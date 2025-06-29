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

    // Récupérer les stagiaires assignés à ce tuteur
    const { data: stagiaires, error: stagiairesError } = await supabase
      .from("stagiaires")
      .select(`
        id,
        statut,
        date_debut,
        date_fin,
        created_at,
        updated_at,
        users!inner (
          id,
          name,
          email,
          phone,
          department
        )
      `)
      .eq("tuteur_id", user.id)
      .order("created_at", { ascending: false })

    if (stagiairesError) {
      console.error("❌ Erreur récupération stagiaires tuteur:", stagiairesError)
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
