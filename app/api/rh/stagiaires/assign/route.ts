import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUser } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (!currentUser || !["rh", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { tuteur_id, stagiaire_ids } = body

    // Validation
    if (!tuteur_id || !stagiaire_ids || !Array.isArray(stagiaire_ids) || stagiaire_ids.length === 0) {
      return NextResponse.json({ error: "Tuteur et stagiaires requis" }, { status: 400 })
    }

    // Vérifier que le tuteur existe et sa capacité
    const { data: tuteurData, error: tuteurError } = await supabase
      .from("tuteurs")
      .select("max_stagiaires")
      .eq("user_id", tuteur_id)
      .single()

    if (tuteurError || !tuteurData) {
      return NextResponse.json({ error: "Tuteur non trouvé" }, { status: 404 })
    }

    // Compter les stagiaires actuels du tuteur
    const { count: currentCount } = await supabase
      .from("stagiaires")
      .select("*", { count: "exact", head: true })
      .eq("tuteur_id", tuteur_id)
      .eq("statut", "actif")

    // Vérifier la capacité
    if ((currentCount || 0) + stagiaire_ids.length > tuteurData.max_stagiaires) {
      return NextResponse.json(
        {
          error: `Le tuteur ne peut pas prendre plus de ${tuteurData.max_stagiaires} stagiaires. Actuellement: ${currentCount}`,
        },
        { status: 400 },
      )
    }

    // Mettre à jour les stagiaires
    const { data: updatedStagiaires, error: updateError } = await supabase
      .from("stagiaires")
      .update({ tuteur_id, updated_at: new Date().toISOString() })
      .in("id", stagiaire_ids)
      .select()

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      data: updatedStagiaires,
      message: `${stagiaire_ids.length} stagiaire(s) assigné(s) avec succès`,
    })
  } catch (error) {
    console.error("Erreur lors de l'assignation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Endpoint pour désassigner un stagiaire
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUser } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (!currentUser || !["rh", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const stagiaireId = searchParams.get("stagiaire_id")

    if (!stagiaireId) {
      return NextResponse.json({ error: "ID stagiaire requis" }, { status: 400 })
    }

    // Désassigner le tuteur
    const { data: updatedStagiaire, error } = await supabase
      .from("stagiaires")
      .update({ tuteur_id: null, updated_at: new Date().toISOString() })
      .eq("id", stagiaireId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedStagiaire,
      message: "Stagiaire désassigné avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la désassignation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
