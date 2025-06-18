import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { email, password } = body

    console.log("🔐 Login attempt for:", email)

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
      console.error("❌ Auth signin error:", authError)
      return NextResponse.json(
        {
          error: authError.message.includes("Invalid login credentials")
            ? "Identifiants invalides. Vérifiez votre email et mot de passe."
            : authError.message,
        },
        { status: 401 },
      )
    }

    if (!authData.user || !authData.session) {
      console.error("❌ No user or session returned")
      return NextResponse.json({ error: "Erreur de connexion - pas de session créée" }, { status: 401 })
    }

    console.log("✅ User authenticated:", authData.user.email)

    // Récupérer ou créer le profil utilisateur
    let profile = null
    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.warn("⚠️ Profile fetch error:", profileError)
      }

      profile = existingProfile
    } catch (error) {
      console.log("ℹ️ Profile not found, will create one")
    }

    // Si le profil n'existe pas, le créer
    if (!profile) {
      const newProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
        role: authData.user.user_metadata?.role || "stagiaire",
        first_name: authData.user.user_metadata?.first_name,
        last_name: authData.user.user_metadata?.last_name,
        phone: authData.user.user_metadata?.phone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      try {
        const { data: createdProfile, error: insertError } = await supabase
          .from("users")
          .insert([newProfile])
          .select()
          .single()

        if (insertError) {
          console.warn("⚠️ Could not create profile in database:", insertError)
          profile = newProfile // Utiliser le profil de base
        } else {
          profile = createdProfile
          console.log("✅ Profile created successfully")
        }
      } catch (insertException) {
        console.warn("⚠️ Profile creation exception:", insertException)
        profile = newProfile
      }
    }

    // Mettre à jour la dernière connexion
    try {
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", authData.user.id)
    } catch (updateError) {
      console.warn("⚠️ Could not update last login:", updateError)
    }

    const finalUserData = {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      first_name: profile.first_name,
      last_name: profile.last_name,
      phone: profile.phone,
    }

    console.log("✅ Login successful for:", finalUserData.email, "Role:", finalUserData.role)

    // Créer la réponse avec les cookies de session
    const response = NextResponse.json({
      success: true,
      user: finalUserData,
      message: "Connexion réussie",
    })

    // Les cookies de session sont automatiquement gérés par Supabase
    return response
  } catch (error) {
    console.error("💥 Login error:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
