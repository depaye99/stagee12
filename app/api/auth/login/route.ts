import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    // Récupérer ou créer le profil utilisateur
    let profile = null

    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .single()
      
      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          console.log("Profile not found for user:", authData.user.id)
        } else {
          console.error("Database error fetching profile:", fetchError)
        }
      } else {
        profile = existingProfile
        console.log("Existing profile found:", profile.email, "role:", profile.role)
      }
    } catch (error) {
      console.error("Exception fetching profile:", error)
    }

    // Si le profil n'existe pas, le créer
    if (!profile) {
      console.log("Creating new profile for user:", authData.user.email)
      
      try {
        // D'abord, vérifier si l'utilisateur existe dans auth.users avec les bonnes métadonnées
        const userRole = authData.user.user_metadata?.role || "stagiaire"
        console.log("User metadata role:", userRole)
        
        const newProfile = {
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
          role: userRole,
          is_active: true,
        }

        // Ajouter les colonnes optionnelles si elles existent
        if (authData.user.user_metadata?.phone) {
          newProfile.phone = authData.user.user_metadata.phone
        }
        if (authData.user.user_metadata?.department) {
          newProfile.department = authData.user.user_metadata.department
        }
        if (authData.user.user_metadata?.position) {
          newProfile.position = authData.user.user_metadata.position
        }

        console.log("Attempting to create profile:", newProfile)

        const { data: createdProfile, error: insertError } = await supabase
          .from("users")
          .insert([newProfile])
          .select()
          .single()

        if (insertError) {
          console.error("Profile creation error details:", {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details,
            hint: insertError.hint
          })
          
          // Essayer de récupérer le profil au cas où il aurait été créé entre temps
          const { data: retryProfile } = await supabase
            .from("users")
            .select("*")
            .eq("id", authData.user.id)
            .single()
          
          if (retryProfile) {
            profile = retryProfile
            console.log("Profile found on retry:", profile)
          } else {
            // Utiliser les données de base si la création échoue
            profile = {
              id: authData.user.id,
              email: authData.user.email!,
              name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
              role: userRole,
              is_active: true,
            }
            console.log("Using fallback profile:", profile)
          }
        } else {
          profile = createdProfile
          console.log("Profile created successfully:", profile)
        }
      } catch (profileError) {
        console.error("Profile creation exception:", profileError)
        // Utiliser les données de base si la création échoue
        profile = {
          id: authData.user.id,
          email: authData.user.email!,
          name: authData.user.user_metadata?.name || authData.user.email!.split("@")[0],
          role: authData.user.user_metadata?.role || "stagiaire",
          is_active: true,
        }
        console.log("Using exception fallback profile:", profile)
      }
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

    // Déterminer l'URL de redirection
    const redirectPath = 
      finalUserData.role === "admin" ? "/admin" :
      finalUserData.role === "rh" ? "/rh" :
      finalUserData.role === "tuteur" ? "/tuteur" :
      "/stagiaire"

    return NextResponse.json({
      success: true,
      user: finalUserData,
      session: authData.session,
      message: "Connexion réussie",
      redirectTo: redirectPath,
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Erreur serveur lors de la connexion" }, { status: 500 })
  }
}
