import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const evaluationSchema = z.object({
  stagiaire_id: z.string().uuid(),
  type: z.enum(["mi_parcours", "finale", "auto_evaluation"]),
  note_globale: z.number().min(0).max(20),
  competences_techniques: z.number().min(0).max(20),
  competences_relationnelles: z.number().min(0).max(20),
  autonomie: z.number().min(0).max(20),
  initiative: z.number().min(0).max(20).optional(),
  ponctualite: z.number().min(0).max(20).optional(),
  commentaires: z.string().optional(),
  points_forts: z.string().optional(),
  axes_amelioration: z.string().optional(),
  objectifs_suivants: z.string().optional(),
  date_evaluation: z.string().transform((str) => new Date(str)),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le rôle de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    let query = supabase
      .from("evaluations")
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          users(name, email)
        ),
        evaluateur:users!evaluations_evaluateur_id_fkey(name, email)
      `)

    // Filtrer selon le rôle
    if (userData.role === "stagiaire") {
      // Les stagiaires ne voient que leurs évaluations
      const { data: stagiaireData } = await supabase
        .from("stagiaires")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (stagiaireData) {
        query = query.eq("stagiaire_id", stagiaireData.id)
      }
    } else if (userData.role === "tuteur") {
      // Les tuteurs ne voient que les évaluations de leurs stagiaires
      query = query.in("stagiaire_id", 
        supabase
          .from("stagiaires")
          .select("id")
          .eq("tuteur_id", user.id)
      )
    }
    // admin et rh voient toutes les évaluations

    // Filtres optionnels
    const stagiaireId = searchParams.get("stagiaire_id")
    const type = searchParams.get("type")
    
    if (stagiaireId) {
      query = query.eq("stagiaire_id", stagiaireId)
    }
    
    if (type) {
      query = query.eq("type", type)
    }

    const { data: evaluations, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur récupération évaluations:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({ evaluations })

  } catch (error) {
    console.error("Erreur API évaluations:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Valider les données
    const validatedData = evaluationSchema.parse(body)

    // Vérifier les permissions
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Seuls les tuteurs, RH et admins peuvent créer des évaluations
    if (!["tuteur", "rh", "admin"].includes(userData.role)) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    // Si c'est un tuteur, vérifier qu'il évalue bien son stagiaire
    if (userData.role === "tuteur") {
      const { data: stagiaireData, error: stagiaireError } = await supabase
        .from("stagiaires")
        .select("tuteur_id")
        .eq("id", validatedData.stagiaire_id)
        .single()

      if (stagiaireError || stagiaireData?.tuteur_id !== user.id) {
        return NextResponse.json({ error: "Vous ne pouvez évaluer que vos stagiaires" }, { status: 403 })
      }
    }

    const { data: evaluation, error } = await supabase
      .from("evaluations")
      .insert({
        ...validatedData,
        evaluateur_id: user.id,
        date_evaluation: validatedData.date_evaluation.toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création évaluation:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    // Créer une notification pour le stagiaire
    const { data: stagiaireUser } = await supabase
      .from("stagiaires")
      .select("users(id, name)")
      .eq("id", validatedData.stagiaire_id)
      .single()

    if (stagiaireUser?.users) {
      await supabase
        .from("notifications")
        .insert({
          user_id: stagiaireUser.users.id,
          titre: "Nouvelle évaluation",
          message: "Une nouvelle évaluation a été créée pour votre stage",
          type: "info"
        })
    }

    return NextResponse.json({ evaluation })

  } catch (error) {
    console.error("Erreur création évaluation:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
