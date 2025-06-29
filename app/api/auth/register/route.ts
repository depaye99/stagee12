import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  role: z.enum(["admin", "rh", "tuteur", "stagiaire"]),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    // Validation des données
    const validatedData = registerSchema.parse(body)
    
    // Vérifier si l'utilisateur existe déjà
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", validatedData.email)
      .single()

    if (existingUser) {
      return NextResponse.json(
        { error: "Un utilisateur avec cet email existe déjà" },
        { status: 400 }
      )
    }

    // Créer l'utilisateur auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
          role: validatedData.role,
        }
      }
    })

    if (authError) {
      console.error("Erreur création auth:", authError)
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Erreur lors de la création du compte" },
        { status: 500 }
      )
    }

    // Créer le profil utilisateur
    const { error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role,
        phone: validatedData.phone,
        department: validatedData.department,
        position: validatedData.position,
        is_active: true
      })

    if (profileError) {
      console.error("Erreur création profil:", profileError)
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      )
    }

    // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
    if (validatedData.role === "stagiaire") {
      const { error: stagiaireError } = await supabase
        .from("stagiaires")
        .insert({
          user_id: authData.user.id,
          statut: "actif"
        })

      if (stagiaireError) {
        console.error("Erreur création stagiaire:", stagiaireError)
      }
    }

    // Créer une notification de bienvenue
    await supabase
      .from("notifications")
      .insert({
        user_id: authData.user.id,
        titre: "Bienvenue sur la plateforme",
        message: `Bienvenue ${validatedData.name} ! Votre compte a été créé avec succès.`,
        type: "success"
      })

    return NextResponse.json({
      message: "Compte créé avec succès",
      user: {
        id: authData.user.id,
        email: validatedData.email,
        name: validatedData.name,
        role: validatedData.role
      }
    })

  } catch (error) {
    console.error("Erreur registration:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
}
