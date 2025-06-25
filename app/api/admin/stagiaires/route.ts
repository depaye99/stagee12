import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    console.log("🔍 Récupération des stagiaires...")

    // Récupérer tous les stagiaires avec leurs relations
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!user_id(id, name, email, phone),
        tuteur:users!tuteur_id(id, name, email)
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
