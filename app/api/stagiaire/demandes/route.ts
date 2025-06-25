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
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer le profil stagiaire
    const { data: stagiaire } = await supabase.from("stagiaires").select("id").eq("user_id", user.id).single()

    if (!stagiaire) {
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    // Récupérer les demandes du stagiaire
    const { data: demandes, error } = await supabase
      .from("demandes")
      .select("*")
      .eq("stagiaire_id", stagiaire.id)
      .order("date_demande", { ascending: false })

    if (error) {
      console.error("❌ Erreur récupération demandes:", error)
      throw error
    }

    return NextResponse.json({ success: true, data: demandes || [] })
  } catch (error) {
    console.error("💥 Erreur API demandes stagiaire:", error)
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
      console.error("❌ Erreur auth:", authError)
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    console.log("✅ Utilisateur authentifié:", user.email)

    // Récupérer le profil stagiaire
    const { data: stagiaire, error: stagiaireError } = await supabase
      .from("stagiaires")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (stagiaireError || !stagiaire) {
      console.error("❌ Profil stagiaire non trouvé:", stagiaireError)
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    console.log("✅ Stagiaire trouvé:", stagiaire.id)

    const body = await request.json()
    const { type, titre, description, documents, periode, congeData, prolongationData } = body

    console.log("📝 Données reçues:", { type, titre })

    // Validation
    if (!type || !titre) {
      return NextResponse.json({ error: "Type et titre requis" }, { status: 400 })
    }

    // Construire la description selon le type
    let finalDescription = description || ""

    if (type === "demande_conge" && congeData) {
      finalDescription = `Demande de congé du ${congeData.date_debut} au ${congeData.date_fin}. Motif: ${congeData.description}`
    } else if (type === "demande_prolongation" && prolongationData) {
      finalDescription = `Demande de prolongation de stage. Période d'extension: ${prolongationData.periode_extension}`
    } else if (periode && (type === "stage_academique" || type === "stage_professionnel")) {
      finalDescription = `Demande de ${type.replace("_", " ")}. Début prévu: ${periode.jours}/${periode.mois}/${periode.annee}. Durée: ${periode.nombre_mois} mois.`
    }

    // Créer la demande
    const { data: demande, error: demandeError } = await supabase
      .from("demandes")
      .insert([
        {
          stagiaire_id: stagiaire.id,
          type,
          titre,
          description: finalDescription,
          statut: "en_attente",
          date_demande: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (demandeError) {
      console.error("❌ Erreur création demande:", demandeError)
      throw demandeError
    }

    console.log("✅ Demande créée:", demande.id)

    // TODO: Enregistrer les documents associés si nécessaire
    // TODO: Créer une notification pour les administrateurs

    return NextResponse.json({
      success: true,
      data: demande,
      message: "Demande créée avec succès",
    })
  } catch (error) {
    console.error("💥 Erreur création demande:", error)
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 })
  }
}
