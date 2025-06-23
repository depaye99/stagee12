import { type NextRequest, NextResponse } from "next/server"
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
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un stagiaire
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "stagiaire") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer l'ID du stagiaire
    const { data: stagiaire } = await supabase.from("stagiaires").select("id").eq("user_id", user.id).single()

    if (!stagiaire) {
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    // Récupérer les demandes du stagiaire
    const { data: demandes, error } = await supabase
      .from("demandes")
      .select(`
        *,
        tuteur:users!tuteur_id(name, email)
      `)
      .eq("stagiaire_id", stagiaire.id)
      .order("date_demande", { ascending: false })

    if (error) {
      console.error("Erreur récupération demandes:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: demandes })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un stagiaire
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "stagiaire") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer l'ID du stagiaire
    const { data: stagiaire } = await supabase
      .from("stagiaires")
      .select("id, tuteur_id")
      .eq("user_id", user.id)
      .single()

    if (!stagiaire) {
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    const { type, titre, description, documents_requis } = body

    // Validation
    if (!type || !titre) {
      return NextResponse.json({ error: "Type et titre requis" }, { status: 400 })
    }

    // Créer la demande
    const { data: nouvelleDemande, error } = await supabase
      .from("demandes")
      .insert([
        {
          stagiaire_id: stagiaire.id,
          tuteur_id: stagiaire.tuteur_id,
          type,
          titre,
          description,
          statut: "en_attente",
          date_demande: new Date().toISOString(),
          documents_requis,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Erreur création demande:", error)
      return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: nouvelleDemande,
      message: "Demande créée avec succès",
    })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
