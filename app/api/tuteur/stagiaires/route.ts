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
      console.error("❌ Erreur auth tuteur stagiaires:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est tuteur
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "tuteur") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    console.log("🔍 Récupération des stagiaires pour le tuteur:", user.id)

    // Récupérer les stagiaires assignés à ce tuteur avec une requête simplifiée
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        id,
        user_id,
        entreprise,
        poste,
        specialite,
        niveau,
        date_debut,
        date_fin,
        statut,
        notes,
        created_at,
        users!stagiaires_user_id_fkey (
          id,
          name,
          email,
          phone
        )
      `)
      .eq("tuteur_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération stagiaires tuteur:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des stagiaires" }, { status: 500 })
    }

    console.log("✅ Stagiaires du tuteur récupérés:", stagiaires?.length || 0)

    return NextResponse.json({
      success: true,
      data: stagiaires || [],
      count: stagiaires?.length || 0,
    })
  } catch (error) {
    console.error("💥 Erreur API stagiaires tuteur:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
