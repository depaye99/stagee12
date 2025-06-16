import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { UserRole } from "@/lib/supabase/database.types"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
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
    // Utilisons seulement les colonnes de base pour éviter les erreurs de schéma
    try {
      const userProfile = {
        id: authData.user.id,
        email: authData.user.email!,
        name: `${prenom} ${nom}`,
        role: (role as UserRole) || "stagiaire",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Ajouter les colonnes optionnelles seulement si elles existent
      if (telephone) {
        userProfile.phone = telephone
      }

      // Essayer d'abord avec toutes les colonnes
      const { error: profileError } = await supabase.from("users").insert([userProfile])

      // Si erreur de colonne manquante, essayer avec les colonnes de base seulement
      if (profileError && profileError.message.includes("column")) {
        console.warn("Some columns missing, trying with basic columns only:", profileError.message)

        const basicProfile = {
          id: authData.user.id,
          email: authData.user.email!,
          name: `${prenom} ${nom}`,
          role: (role as UserRole) || "stagiaire",
        }

        const { error: basicError } = await supabase.from("users").insert([basicProfile])

        if (basicError) {
          console.error("Profile creation error with basic columns:", basicError)
          // Ne pas échouer si le profil n'est pas créé
        }
      } else if (profileError) {
        console.error("Profile creation error:", profileError)
        // Ne pas échouer si le profil n'est pas créé
      }
    } catch (profileError) {
      console.error("Profile creation exception:", profileError)
      // Ne pas échouer si le profil n'est pas créé
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
