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

    // Vérifier que l'utilisateur est tuteur
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "tuteur") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les stagiaires assignés à ce tuteur
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!user_id(name, email, phone)
      `)
      .eq("tuteur_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires tuteur:", error)
      throw error
    }

    console.log("✅ Stagiaires du tuteur récupérés:", stagiaires?.length || 0)

    return NextResponse.json({ success: true, data: stagiaires || [] })
  } catch (error) {
    console.error("💥 Erreur API stagiaires tuteur:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
