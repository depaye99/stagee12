import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const planningEventSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  date_debut: z.string().transform((str) => new Date(str)),
  date_fin: z.string().transform((str) => new Date(str)),
  type: z.enum(["formation", "reunion", "evaluation", "conge", "autre"]),
  lieu: z.string().optional(),
  stagiaire_id: z.string().uuid().optional(),
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
      .from("planning_events")
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          users(name, email)
        ),
        created_by_user:users!planning_events_created_by_fkey(name, email)
      `)

    // Filtrer selon le rôle
    if (userData.role === "stagiaire") {
      // Les stagiaires ne voient que leurs événements
      const { data: stagiaireData } = await supabase
        .from("stagiaires")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (stagiaireData) {
        query = query.eq("stagiaire_id", stagiaireData.id)
      }
    } else if (userData.role === "tuteur") {
      // Les tuteurs voient les événements de leurs stagiaires + les leurs
      query = query.or(`stagiaire_id.in.(${
        (await supabase
          .from("stagiaires")
          .select("id")
          .eq("tuteur_id", user.id)).data?.map(s => s.id).join(",") || ""
      }),created_by.eq.${user.id}`)
    }
    // admin et rh voient tous les événements

    // Filtres optionnels
    const startDate = searchParams.get("start_date")
    const endDate = searchParams.get("end_date")
    const type = searchParams.get("type")
    const stagiaireId = searchParams.get("stagiaire_id")
    
    if (startDate) {
      query = query.gte("date_debut", startDate)
    }
    
    if (endDate) {
      query = query.lte("date_fin", endDate)
    }
    
    if (type) {
      query = query.eq("type", type)
    }
    
    if (stagiaireId) {
      query = query.eq("stagiaire_id", stagiaireId)
    }

    const { data: events, error } = await query.order("date_debut", { ascending: true })

    if (error) {
      console.error("Erreur récupération planning:", error)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({ events })

  } catch (error) {
    console.error("Erreur API planning:", error)
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
    const validatedData = planningEventSchema.parse(body)

    // Vérifier que la date de fin est après la date de début
    if (validatedData.date_fin <= validatedData.date_debut) {
      return NextResponse.json({ 
        error: "La date de fin doit être après la date de début" 
      }, { status: 400 })
    }

    // Vérifier les permissions
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Seuls les tuteurs, RH et admins peuvent créer des événements
    if (!["tuteur", "rh", "admin"].includes(userData.role)) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    // Si un stagiaire est spécifié, vérifier les permissions
    if (validatedData.stagiaire_id && userData.role === "tuteur") {
      const { data: stagiaireData, error: stagiaireError } = await supabase
        .from("stagiaires")
        .select("tuteur_id")
        .eq("id", validatedData.stagiaire_id)
        .single()

      if (stagiaireError || stagiaireData?.tuteur_id !== user.id) {
        return NextResponse.json({ 
          error: "Vous ne pouvez créer des événements que pour vos stagiaires" 
        }, { status: 403 })
      }
    }

    const { data: event, error } = await supabase
      .from("planning_events")
      .insert({
        ...validatedData,
        date_debut: validatedData.date_debut.toISOString(),
        date_fin: validatedData.date_fin.toISOString(),
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("Erreur création événement:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    // Créer une notification si un stagiaire est concerné
    if (validatedData.stagiaire_id) {
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
            titre: "Nouvel événement planifié",
            message: `Un nouvel événement "${validatedData.title}" a été planifié`,
            type: "info"
          })
      }
    }

    return NextResponse.json({ event })

  } catch (error) {
    console.error("Erreur création événement:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides", details: error.errors }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
