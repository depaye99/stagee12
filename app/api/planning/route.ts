import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    console.log("🔍 Récupération du planning pour:", profile.role, user.id)

    let query = supabase.from("planning_events").select(`
        id,
        title,
        description,
        date_debut,
        date_fin,
        type,
        lieu,
        status,
        stagiaire_id,
        created_by,
        created_at,
        stagiaires!inner (
          id,
          entreprise,
          users!stagiaires_user_id_fkey (
            id,
            name,
            email
          )
        )
      `)

    // Filtrer selon le rôle
    if (profile.role === "tuteur") {
      query = query.eq("stagiaires.tuteur_id", user.id)
    } else if (profile.role === "stagiaire") {
      // Pour les stagiaires, récupérer leurs propres événements
      const { data: stagiaireInfo } = await supabase.from("stagiaires").select("id").eq("user_id", user.id).single()

      if (stagiaireInfo) {
        query = query.eq("stagiaire_id", stagiaireInfo.id)
      } else {
        return NextResponse.json({ success: true, data: [] })
      }
    }
    // Admin et RH voient tout (pas de filtre supplémentaire)

    const { data: events, error } = await query.order("date_debut", { ascending: true })

    if (error) {
      console.error("❌ Erreur lors de la récupération du planning:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    console.log("✅ Événements de planning récupérés:", events?.length || 0)

    return NextResponse.json({
      success: true,
      data: events || [],
      count: events?.length || 0,
    })
  } catch (error) {
    console.error("💥 Erreur dans l'API planning:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (!profile || !["admin", "rh", "tuteur"].includes(profile.role)) {
      return NextResponse.json({ error: "Permissions insuffisantes" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, date_debut, date_fin, type, lieu, status, stagiaire_id } = body

    // Validation des données
    if (!title || !date_debut || !date_fin || !stagiaire_id) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    console.log("📅 Création d'un nouvel événement:", { title, stagiaire_id, type })

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
      .select(`
        *,
        stagiaires (
          id,
          users!stagiaires_user_id_fkey (
            name,
            email
          )
        )
      `)
      .single()

    if (error) {
      console.error("❌ Erreur lors de la création de l'événement:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    console.log("✅ Événement créé avec succès:", event.id)

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    console.error("💥 Erreur dans l'API planning POST:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
