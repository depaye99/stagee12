import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const { email, password, name, role, department, phone, notes } = await request.json()

    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    // Créer l'utilisateur dans auth.users
    const { data: authUser, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role
      }
    })

    if (signUpError) {
      throw signUpError
    }

    // Créer l'utilisateur dans la table users
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user?.id,
        email,
        name,
        role,
        department,
        phone,
        notes,
        is_active: true
      })
      .select()
      .single()

    if (userError) {
      // Si erreur, supprimer l'utilisateur créé dans auth
      await supabase.auth.admin.deleteUser(authUser.user?.id || "")
      throw userError
    }

    console.log("✅ Utilisateur créé:", newUser)

    return NextResponse.json({
      success: true,
      data: newUser,
      message: "Utilisateur créé avec succès"
    })
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}