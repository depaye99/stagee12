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
          role: (role as UserRole) || "stagiaire",
          phone: telephone || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

      if (profileError) {
        console.error("Profile creation error:", profileError)
        // Continuer même si le profil n'est pas créé immédiatement
      }
    }

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
