
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const evaluationUpdateSchema = z.object({
  type: z.enum(["mi_parcours", "finale", "auto_evaluation"]).optional(),
  note_globale: z.number().min(0).max(20).optional(),
  competences_techniques: z.number().min(0).max(20).optional(),
  competences_relationnelles: z.number().min(0).max(20).optional(),
  autonomie: z.number().min(0).max(20).optional(),
  initiative: z.number().min(0).max(20).optional(),
  ponctualite: z.number().min(0).max(20).optional(),
  commentaires: z.string().optional(),
  points_forts: z.string().optional(),
  axes_amelioration: z.string().optional(),
  objectifs_suivants: z.string().optional(),
  date_evaluation: z.string().transform((str) => new Date(str)).optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          users(name, email)
        ),
        evaluateur:users!evaluations_evaluateur_id_fkey(name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Erreur récupération évaluation:", error)
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "stagiaire") {
      // Vérifier que c'est bien l'évaluation du stagiaire
      const { data: stagiaireData } = await supabase
        .from("stagiaires")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (stagiaireData?.id !== evaluation.stagiaire_id) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
      }
    } else if (userData?.role === "tuteur") {
      // Vérifier que c'est l'évaluation d'un de ses stagiaires
      const { data: stagiaireData } = await supabase
        .from("stagiaires")
        .select("tuteur_id")
        .eq("id", evaluation.stagiaire_id)
        .single()

      if (stagiaireData?.tuteur_id !== user.id) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
      }
    }

    return NextResponse.json({ evaluation })

  } catch (error) {
    console.error("Erreur API évaluation:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Valider les données
    const validatedData = evaluationUpdateSchema.parse(body)

    // Récupérer l'évaluation existante
    const { data: existingEvaluation, error: fetchError } = await supabase
      .from("evaluations")
      .select("evaluateur_id, stagiaire_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingEvaluation) {
      return NextResponse.json({ error: "Évaluation non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "tuteur") {
      // Vérifier que c'est bien l'évaluateur
      if (existingEvaluation.evaluateur_id !== user.id) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
      }
    } else if (!["rh", "admin"].includes(userData?.role || "")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    const updateData: any = { ...validatedData }
    if (validatedData.date_evaluation) {
      updateData.date_evaluation = validatedData.date_evaluation.toISOString().split('T')[0]
    }

    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur modification évaluation:", error)
      return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
    }

    return NextResponse.json({ evaluation })

  } catch (error) {
    console.error("Erreur modification évaluation:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier les permissions (seuls admin et RH peuvent supprimer)
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!["rh", "admin"].includes(userData?.role || "")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    const { error } = await supabase
      .from("evaluations")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Erreur suppression évaluation:", error)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ message: "Évaluation supprimée avec succès" })

  } catch (error) {
    console.error("Erreur suppression évaluation:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
