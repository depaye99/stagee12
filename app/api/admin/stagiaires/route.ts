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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les permissions admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    console.log("🔍 Récupération des stagiaires par admin...")

    // Récupérer tous les stagiaires avec leurs informations utilisateur et tuteur
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!stagiaires_user_id_fkey (
          id,
          name,
          email,
          phone
        ),
        tuteur:users!stagiaires_tuteur_id_fkey (
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des stagiaires" }, { status: 500 })
    }

    console.log("✅ Stagiaires récupérés:", stagiaires?.length || 0)

    return NextResponse.json({
      success: true,
      data: stagiaires || [],
      count: stagiaires?.length || 0,
    })
  } catch (error) {
    console.error("💥 Erreur API admin stagiaires:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
