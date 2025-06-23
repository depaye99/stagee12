import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/supabase/database.types"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password, nom, prenom, telephone, role } = body

    // Validation des champs requis
    if (!email || !password || !nom || !prenom) {
      return NextResponse.json({ error: "Email, mot de passe, nom et prénom sont requis" }, { status: 400 })
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return NextResponse.json({ error: "Le mot de passe doit contenir au moins 6 caractères" }, { status: 400 })
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Format d'email invalide" }, { status: 400 })
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: `${prenom} ${nom}`,
          role: role || "stagiaire",
          phone: telephone,
        },
      },
    })

    if (authError) {
      console.error("Auth signup error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 400 })
    }

    // Créer le profil utilisateur dans notre table users
    // Utiliser un trigger dans la base de données ou attendre la confirmation
    if (authData.user.email_confirmed_at) {
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: authData.user.email!,
          name: `${prenom} ${nom}`,
          first_name: prenom,
          last_name: nom,
          role: (role as UserRole) || "stagiaire",
          phone: telephone || null,
          company: "Bridge Technologies",
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Continuer même si le profil n'est pas créé immédiatement
      }

      // Si c'est un tuteur, créer l'entrée dans la table tuteurs
      if (role === "tuteur") {
        const { error: tuteurError } = await supabase.from("tuteurs").insert([
          {
            user_id: authData.user.id,
            specialite: "Non définie",
            max_stagiaires: 5,
          },
        ])

        if (tuteurError) {
          console.error("Tuteur creation error:", tuteurError)
        }
      }

      // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
      if (role === "stagiaire") {
        const { error: stagiaireError } = await supabase.from("stagiaires").insert([
          {
            user_id: authData.user.id,
            entreprise: "Bridge Technologies",
            statut: "actif",
          },
        ])

        if (stagiaireError) {
          console.error("Stagiaire creation error:", stagiaireError)
        }
      }
    }
    const userData =  {
        id: authData.user.id,
        email: authData.user.email,
        name: `${prenom} ${nom}`,
        role: role || "stagiaire",
      }

    // Logger l'inscription réussie
    await logAuthAction(request, 'register', userData.id, {
      user_name: userData.name,
      user_role: userData.role,
      user_email: userData.email
    })

    return NextResponse.json({
      success: true,
      message: authData.user.email_confirmed_at
        ? "Inscription réussie ! Vous pouvez maintenant vous connecter."
        : "Inscription réussie ! Vérifiez votre email pour confirmer votre compte.",
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: `${prenom} ${nom}`,
        role: role || "stagiaire",
      },
      requiresConfirmation: !authData.user.email_confirmed_at,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "Erreur serveur lors de l'inscription" }, { status: 500 })
  }
}

async function logAuthAction(
  request: NextRequest,
  actionType: string,
  userId: string,
  additionalData: any
) {
  const supabase = await createClient();
  const ip = request.headers.get('x-forwarded-for') || request.ip;
  const userAgent = request.headers.get('user-agent');

  const { error } = await supabase.from('user_actions_log').insert([
    {
      user_id: userId,
      action_type: actionType,
      timestamp: new Date().toISOString(),
      ip_address: ip,
      user_agent: userAgent,
      additional_data: additionalData,
    },
  ]);

  if (error) {
    console.error('Error logging user action:', error);
  }
}
