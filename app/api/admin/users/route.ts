import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("❌ Erreur auth admin users:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.role !== "admin") {
      console.error("❌ Accès non autorisé admin users:", profileError)
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    console.log("🔍 Récupération des utilisateurs par admin...")

    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération utilisateurs:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des utilisateurs" }, { status: 500 })
    }

    console.log("✅ Utilisateurs récupérés:", users?.length || 0)

    return NextResponse.json({
      success: true,
      data: users || [],
      count: users?.length || 0,
    })
  } catch (error) {
    console.error("💥 Erreur API admin users:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { email, name, first_name, last_name, phone, role } = body

    // Validation
    if (!email || !name || !role) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("➕ Création d'un nouvel utilisateur:", { email, name, role })

    // Créer l'utilisateur
    const { data: newUser, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          name,
          first_name,
          last_name,
          phone,
          role,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("❌ Erreur création utilisateur:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    console.log("✅ Utilisateur créé:", newUser.id)

    return NextResponse.json({ success: true, data: newUser }, { status: 201 })
  } catch (error) {
    console.error("💥 Erreur API création utilisateur:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
