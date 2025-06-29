import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const planningEventUpdateSchema = z.object({
  title: z.string().min(1, "Le titre est requis").optional(),
  description: z.string().optional(),
  date_debut: z.string().transform((str) => new Date(str)).optional(),
  date_fin: z.string().transform((str) => new Date(str)).optional(),
  type: z.enum(["formation", "reunion", "evaluation", "conge", "autre"]).optional(),
  lieu: z.string().optional(),
  status: z.enum(["planifie", "en_cours", "termine", "annule"]).optional(),
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

    const { data: event, error } = await supabase
      .from("planning_events")
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          users(name, email)
        ),
        created_by_user:users!planning_events_created_by_fkey(name, email)
      `)
      .eq("id", params.id)
      .single()

    if (error) {
      console.error("Erreur récupération événement:", error)
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "stagiaire") {
      // Vérifier que c'est bien l'événement du stagiaire
      const { data: stagiaireData } = await supabase
        .from("stagiaires")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (stagiaireData?.id !== event.stagiaire_id) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
      }
    } else if (userData?.role === "tuteur") {
      // Vérifier que c'est l'événement d'un de ses stagiaires ou créé par lui
      if (event.created_by !== user.id && event.stagiaire_id) {
        const { data: stagiaireData } = await supabase
          .from("stagiaires")
          .select("tuteur_id")
          .eq("id", event.stagiaire_id)
          .single()

        if (stagiaireData?.tuteur_id !== user.id) {
          return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
        }
      }
    }

    return NextResponse.json({ event })

  } catch (error) {
    console.error("Erreur API événement:", error)
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
    const validatedData = planningEventUpdateSchema.parse(body)

    // Vérifier que la date de fin est après la date de début si les deux sont fournies
    if (validatedData.date_debut && validatedData.date_fin) {
      if (validatedData.date_fin <= validatedData.date_debut) {
        return NextResponse.json({ 
          error: "La date de fin doit être après la date de début" 
        }, { status: 400 })
      }
    }

    // Récupérer l'événement existant
    const { data: existingEvent, error: fetchError } = await supabase
      .from("planning_events")
      .select("created_by, stagiaire_id")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingEvent) {
      return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "tuteur") {
      // Vérifier que c'est bien le créateur ou le tuteur du stagiaire
      if (existingEvent.created_by !== user.id && existingEvent.stagiaire_id) {
        const { data: stagiaireData } = await supabase
          .from("stagiaires")
          .select("tuteur_id")
          .eq("id", existingEvent.stagiaire_id)
          .single()

        if (stagiaireData?.tuteur_id !== user.id) {
          return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
        }
      }
    } else if (!["rh", "admin"].includes(userData?.role || "")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    const updateData: any = { ...validatedData }
    if (validatedData.date_debut) {
      updateData.date_debut = validatedData.date_debut.toISOString()
    }
    if (validatedData.date_fin) {
      updateData.date_fin = validatedData.date_fin.toISOString()
    }

    const { data: event, error } = await supabase
      .from("planning_events")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur modification événement:", error)
      return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
    }

    return NextResponse.json({ event })

  } catch (error) {
    console.error("Erreur modification événement:", error)
    
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

    // Vérifier les permissions (seuls admin, RH et créateur peuvent supprimer)
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "tuteur") {
      // Vérifier que c'est le créateur
      const { data: eventData } = await supabase
        .from("planning_events")
        .select("created_by")
        .eq("id", params.id)
        .single()

      if (eventData?.created_by !== user.id) {
        return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
      }
    } else if (!["rh", "admin"].includes(userData?.role || "")) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    const { error } = await supabase
      .from("planning_events")
      .delete()
      .eq("id", params.id)

    if (error) {
      console.error("Erreur suppression événement:", error)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ message: "Événement supprimé avec succès" })

  } catch (error) {
    console.error("Erreur suppression événement:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
