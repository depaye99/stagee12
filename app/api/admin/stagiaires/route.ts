import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

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

    // Récupérer tous les stagiaires avec leurs relations
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!user_id(name, email, phone),
        tuteur:users!tuteur_id(name, email)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires:", error)
      throw error
    }

    console.log("✅ Stagiaires récupérés:", stagiaires?.length || 0)

    return NextResponse.json({ success: true, data: stagiaires || [] })
  } catch (error) {
    console.error("💥 Erreur API stagiaires:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

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
    const { user_id, tuteur_id, entreprise, poste, date_debut, date_fin, notes } = body

    console.log("📝 Création stagiaire:", body)

    // Validation
    if (!user_id) {
      return NextResponse.json({ error: "ID utilisateur requis" }, { status: 400 })
    }

    // Vérifier que l'utilisateur n'est pas déjà stagiaire
    const { data: existingStagiaire } = await supabase.from("stagiaires").select("id").eq("user_id", user_id).single()

    if (existingStagiaire) {
      return NextResponse.json({ error: "Cet utilisateur est déjà stagiaire" }, { status: 400 })
    }

    // Créer le stagiaire
    const { data: stagiaire, error } = await supabase
      .from("stagiaires")
      .insert([
        {
          user_id,
          tuteur_id: tuteur_id || null,
          entreprise,
          poste,
          date_debut,
          date_fin,
          statut: "actif",
          notes,
        },
      ])
      .select(`
        *,
        user:users!user_id(name, email),
        tuteur:users!tuteur_id(name, email)
      `)
      .single()

    if (error) {
      console.error("❌ Erreur création stagiaire:", error)
      throw error
    }

    console.log("✅ Stagiaire créé:", stagiaire)

    return NextResponse.json({
      success: true,
      data: stagiaire,
      message: "Stagiaire créé avec succès",
    })
  } catch (error) {
    console.error("💥 Erreur création stagiaire:", error)
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 })
  }
}
