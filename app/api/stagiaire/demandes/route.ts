import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le profil stagiaire
    const { data: stagiaire } = await supabase
      .from("stagiaires")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!stagiaire) {
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    // Récupérer les demandes du stagiaire avec documents
    const { data: demandes, error } = await supabase
      .from("demandes")
      .select(`
        *,
        documents (
          id,
          nom,
          type,
          taille,
          created_at
        )
      `)
      .eq("stagiaire_id", stagiaire.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: demandes })
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
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

    // Récupérer le profil stagiaire
    const { data: stagiaire } = await supabase
      .from("stagiaires")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!stagiaire) {
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    const { type, sujet, description, priorite, domaine } = await request.json()

    if (!type || !sujet || !description) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
    }

    const { data: demande, error } = await supabase
      .from("demandes")
      .insert({
        stagiaire_id: stagiaire.id,
        type,
        sujet,
        description,
        priorite: priorite || "normale",
        domaine,
        status: "en_attente"
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    console.log("✅ Demande créée:", demande)

    return NextResponse.json({
      success: true,
      data: demande,
      message: "Demande créée avec succès"
    })
  } catch (error) {
    console.error("Erreur lors de la création de la demande:", error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}