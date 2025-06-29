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

    console.log("🔍 Récupération des demandes pour le tuteur:", user.id)

    // Récupérer les demandes des stagiaires assignés à ce tuteur
    const { data: demandes, error } = await supabase
      .from("demandes")
      .select(`
        id,
        stagiaire_id,
        type,
        titre,
        description,
        statut,
        date_demande,
        date_reponse,
        commentaire_reponse,
        documents_joints,
        pieces_jointes,
        stagiaires!inner (
          id,
          entreprise,
          poste,
          users!stagiaires_user_id_fkey (
            id,
            name,
            email
          )
        )
      `)
      .eq("stagiaires.tuteur_id", user.id)
      .order("date_demande", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération demandes tuteur:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération des demandes" }, { status: 500 })
    }

    console.log("✅ Demandes du tuteur récupérées:", demandes?.length || 0)

    return NextResponse.json({
      success: true,
      data: demandes || [],
      count: demandes?.length || 0,
    })
  } catch (error) {
    console.error("💥 Erreur API demandes tuteur:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
