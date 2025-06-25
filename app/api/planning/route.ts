import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single()

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    let query = supabase.from("planning_events").select(`
        *,
        stagiaires!inner(
          id,
          users!inner(name, email)
        )
      `)

    // Filtrer selon le rôle
    if (user.role === "tuteur") {
      query = query.eq("stagiaires.tuteur_id", user.id)
    } else if (user.role === "stagiaire") {
      query = query.eq("stagiaires.user_id", user.id)
    }
    // Admin et RH voient tout

    const { data: events, error } = await query.order("date_debut", { ascending: true })

    if (error) {
      console.error("Erreur lors de la récupération du planning:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json(events)
  } catch (error) {
    console.error("Erreur dans l'API planning:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: user } = await supabase.from("users").select("*").eq("id", session.user.id).single()

    if (!user || !["admin", "rh", "tuteur"].includes(user.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, date_debut, date_fin, type, lieu, status, stagiaire_id } = body

    // Validation des données
    if (!title || !date_debut || !date_fin || !stagiaire_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    const { data: event, error } = await supabase
      .from("planning_events")
      .insert([
        {
          title,
          description,
          date_debut,
          date_fin,
          type: type || "autre",
          lieu,
          status: status || "planifie",
          stagiaire_id,
          created_by: user.id,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erreur lors de la création de l'événement:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Erreur dans l'API planning POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
