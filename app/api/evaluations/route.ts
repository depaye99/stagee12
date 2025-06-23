
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logUserAction } from "@/lib/utils/request-logger"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const stagiaireId = searchParams.get("stagiaire_id")
    const tuteurId = searchParams.get("tuteur_id")

    let query = supabase
      .from("evaluations")
      .select(`
        *,
        stagiaires!inner(
          users!inner(name, email)
        ),
        users!evaluateur_id(name, email)
      `)
      .order("date_evaluation", { ascending: false })

    if (stagiaireId) {
      query = query.eq("stagiaire_id", stagiaireId)
    }

    if (tuteurId) {
      query = query.eq("evaluateur_id", tuteurId)
    }

    const { data: evaluations, error } = await query

    if (error) throw error

    await logUserAction(request, "view_evaluations", session.user.id, null, {
      filters: { stagiaireId, tuteurId },
      count: evaluations?.length || 0,
    })

    return NextResponse.json({ success: true, data: evaluations })
  } catch (error) {
    console.error("Erreur lors de la récupération des évaluations:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

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

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!currentUser || !["tuteur", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const evaluationData = {
      ...body,
      evaluateur_id: session.user.id,
    }

    // Créer l'évaluation
    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .insert(evaluationData)
      .select()
      .single()

    if (error) throw error

    // Récupérer les informations du stagiaire pour la notification
    const { data: stagiaireInfo } = await supabase
      .from("stagiaires")
      .select(`
        user_id,
        users!user_id(name, email)
      `)
      .eq("id", evaluationData.stagiaire_id)
      .single()

    // Créer une notification pour le stagiaire
    if (stagiaireInfo) {
      const typeLabel = getTypeLabel(evaluationData.type)
      await supabase.from("notifications").insert({
        user_id: stagiaireInfo.user_id,
        titre: "Nouvelle évaluation disponible",
        message: `Votre évaluation ${typeLabel} a été complétée par votre tuteur. Consultez vos résultats et recommandations.`,
        type: "info",
        related_type: "evaluation",
        related_id: evaluation.id,
        action_url: `/stagiaire/evaluations/${evaluation.id}`,
        action_label: "Voir l'évaluation",
        priority: "normal",
        category: "evaluation",
      })
    }

    await logUserAction(request, "create_evaluation", session.user.id, evaluation.id, {
      stagiaire_id: evaluationData.stagiaire_id,
      type: evaluationData.type,
      note_globale: evaluationData.note_globale,
    })

    return NextResponse.json({ success: true, data: evaluation })
  } catch (error) {
    console.error("Erreur lors de la création de l'évaluation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "mi_parcours":
      return "mi-parcours"
    case "finale":
      return "finale"
    case "mensuelle":
      return "mensuelle"
    case "projet":
      return "de projet"
    default:
      return type
  }
}
