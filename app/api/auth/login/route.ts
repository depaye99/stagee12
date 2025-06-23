import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Fonction utilitaire pour enregistrer les actions dans la base de données
async function logAuthAction(
  request: NextRequest,
  action: string,
  userId: string | undefined,
  details: object = {},
) {
  try {
    const supabase = await createClient()
    const ip = request.headers.get("x-real-ip") || request.ip
    const userAgent = request.headers.get("user-agent")

    await supabase.from("user_actions_log").insert([
      {
        user_id: userId,
        action_type: action,
        timestamp: new Date().toISOString(),
        ip_address: ip,
        user_agent: userAgent,
        details: details,
      },
    ])
  } catch (error) {
    console.error("Error logging user action:", error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password } = body

    // Validation des champs requis
    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 })
    }

    // Tentative de connexion
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Auth signin error:", authError)

      // Messages d'erreur personnalisés
      if (authError.message.includes("Invalid login credentials")) {
        // Logger la tentative de connexion échouée
        await logAuthAction(request, 'login_failed', undefined, {
          email,
          reason: 'invalid_credentials'
        })
        return NextResponse.json(
          {
            error: `Identifiants invalides pour ${email}. Vérifiez votre email et mot de passe, ou créez un compte si vous n'en avez pas.`,
          },
          { status: 401 },
        )
      }

      if (authError.message.includes("Email not confirmed")) {
        return NextResponse.json(
          {
            error: "Email non confirmé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.",
          },
          { status: 401 },
        )
      }

      return NextResponse.json({ error: authError.message }, { status: 401 })
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json({ error: "Erreur de connexion - pas de session créée" }, { status: 401 })
    }

    console.log("User logged in successfully:", authData.user.email)

    // Récupérer le profil utilisateur existant
    let profile = null

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (!fetchError && existingProfile) {
        profile = existingProfile
        console.log("Existing profile found:", profile.email, "role:", profile.role)
      } else if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Database error fetching profile:", fetchError)
      }
    } catch (error) {
      console.error("Exception fetching profile:", error)
    }

    // Si le profil n'existe pas, utiliser un profil basique basé sur les métadonnées
    if (!profile) {
      console.log("No profile found, using auth metadata for user:", authData.user.email)

      const userRole = authData.user.user_metadata?.role || "stagiaire"
      console.log("User metadata role:", userRole)

      // Créer un profil basique sans toucher à la base de données
      profile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
        role: userRole,
        phone: authData.user.user_metadata?.phone,
        department: authData.user.user_metadata?.department,
        position: authData.user.user_metadata?.position,
        is_active: true,
      }

      console.log("Using metadata-based profile:", profile)
    }

    // Essayer de mettre à jour la dernière connexion (ne pas échouer si ça ne marche pas)
    try {
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)
    } catch (updateError) {
      console.warn("Failed to update last login:", updateError)
    }

    // Préparer les données utilisateur finales en s'assurant que le rôle vient de la DB
    const finalUserData = profile || {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
      role: authData.user.user_metadata?.role || "stagiaire",
    }

    console.log("Login successful for user:", finalUserData.email, "with role:", finalUserData.role)

    // Déterminer l'URL de redirection basée sur le rôle
    let redirectPath = "/stagiaire"
    switch (finalUserData.role) {
      case "admin":
        redirectPath = "/admin"
        break
      case "rh":
        redirectPath = "/rh"
        break
      case "tuteur":
        redirectPath = "/tuteur"
        break
      default:
        redirectPath = "/stagiaire"
    }

    // Créer une réponse avec les cookies de session appropriés
    const response = NextResponse.json({
      success: true,
      user: finalUserData,
      session: authData.session,
      message: "Connexion réussie",
      redirectTo: redirectPath,
    })

    // S'assurer que les cookies de session sont bien définis
    if (authData.session) {
      response.cookies.set('sb-access-token', authData.session.access_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: authData.session.expires_in,
      })

      response.cookies.set('sb-refresh-token', authData.session.refresh_token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 jours
      })
    }

    // Logger la connexion réussie
    await logAuthAction(request, 'login', finalUserData.id, {
      user_name: finalUserData.name,
      user_role: finalUserData.role
    })

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
