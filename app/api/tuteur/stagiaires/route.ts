import { type NextRequest, NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle tuteur
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "tuteur") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les stagiaires assignés au tuteur
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        user:users!stagiaires_user_id_fkey(id, name, email, phone, is_active)
      `)
      .eq("tuteur_id", profile.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires tuteur:", error)
      return NextResponse.json({
        success: true,
        data: [],
        message: "Aucun stagiaire trouvé"
      })
    }

    return NextResponse.json({
      success: true,
      data: stagiaires || [],
    })
  } catch (error) {
    console.error("💥 Erreur API stagiaires tuteur:", error)
    return NextResponse.json({
      success: true,
      data: [],
      message: "Erreur serveur interne"
    })
  }
}
