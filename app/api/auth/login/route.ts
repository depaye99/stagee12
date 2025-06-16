import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password } = body

    console.log("Login attempt for:", email)

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
        return NextResponse.json(
          {
            error: `Identifiants invalides. Vérifiez votre email et mot de passe.`,
          },
          { status: 401 },
        )
      }

      if (authError.message.includes("Email not confirmed")) {
        return NextResponse.json(
          {
            error: "Email non confirmé. Vérifiez votre boîte mail.",
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

    // Récupérer le profil utilisateur
    let profile = null
    try {
      const { data: existingProfile } = await supabase.from("users").select("*").eq("id", authData.user.id).single()
      profile = existingProfile
    } catch (error) {
      console.log("Profile not found, creating basic profile")
    }

    // Si le profil n'existe pas, créer un profil de base
    if (!profile) {
      const newProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
        role: "stagiaire",
      }

      try {
        const { data: createdProfile } = await supabase.from("users").insert([newProfile]).select().single()
        profile = createdProfile
      } catch (insertError) {
        console.warn("Could not create profile in database:", insertError)
        // Utiliser le profil de base même si l'insertion échoue
        profile = newProfile
      }
    }

    // Préparer les données utilisateur finales
    const finalUserData = profile || {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
      role: "stagiaire",
    }

    console.log("Login successful, returning user data")

    return NextResponse.json({
      success: true,
      user: finalUserData,
      session: authData.session,
      message: "Connexion réussie",
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
