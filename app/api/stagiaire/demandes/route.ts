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

    console.log("🔍 Vérification auth - User:", user?.id)

    if (authError || !user) {
      console.log("❌ Erreur auth:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un stagiaire
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("👤 Profil utilisateur:", profile)

    if (profileError || !profile || profile.role !== "stagiaire") {
      console.log("❌ Erreur profil ou rôle incorrect:", profileError, profile?.role)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer l'ID du stagiaire
    const { data: stagiaire, error: stagiaireError } = await supabase
      .from("stagiaires")
      .select("id")
      .eq("user_id", user.id)
      .single()

    console.log("🎓 Stagiaire trouvé:", stagiaire)

    if (stagiaireError || !stagiaire) {
      console.log("❌ Erreur stagiaire:", stagiaireError)
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    // Récupérer les demandes du stagiaire
    const { data: demandes, error: demandesError } = await supabase
      .from("demandes")
      .select(`
        *,
        tuteur:users!tuteur_id(name, email)
      `)
      .eq("stagiaire_id", stagiaire.id)
      .order("date_demande", { ascending: false })

    console.log("📋 Demandes trouvées:", demandes?.length || 0)

    if (demandesError) {
      console.error("❌ Erreur récupération demandes:", demandesError)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: demandes || [] })
  } catch (error) {
    console.error("💥 Erreur API:", error)
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

    console.log("🔍 POST - Vérification auth - User:", user?.id)

    if (authError || !user) {
      console.log("❌ POST - Erreur auth:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est un stagiaire
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    console.log("👤 POST - Profil utilisateur:", profile)

    if (profileError || !profile || profile.role !== "stagiaire") {
      console.log("❌ POST - Erreur profil ou rôle incorrect:", profileError, profile?.role)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer l'ID du stagiaire
    const { data: stagiaire, error: stagiaireError } = await supabase
      .from("stagiaires")
      .select("id, tuteur_id")
      .eq("user_id", user.id)
      .single()

    console.log("🎓 POST - Stagiaire trouvé:", stagiaire)

    if (stagiaireError || !stagiaire) {
      console.log("❌ POST - Erreur stagiaire:", stagiaireError)
      return NextResponse.json({ error: "Profil stagiaire non trouvé" }, { status: 404 })
    }

    const body = await request.json()
    console.log("📝 POST - Données reçues:", body)

    const { type, titre, description, documents, periode, congeData, prolongationData } = body

    // Validation
    if (!type || !titre) {
      console.log("❌ POST - Validation échouée:", { type, titre })
      return NextResponse.json({ error: "Type et titre requis" }, { status: 400 })
    }

    // Construire la description selon le type de demande
    let finalDescription = description || ""

    if (type === "demande_conge" && congeData) {
      finalDescription = `Demande de congé du ${congeData.date_debut} au ${congeData.date_fin}. Motif: ${congeData.description}`
    } else if (type === "demande_prolongation" && prolongationData) {
      finalDescription = `Demande de prolongation de stage. Période d'extension: ${prolongationData.periode_extension}`
    } else if (!finalDescription) {
      finalDescription = `Demande de ${type.replace("_", " ")}`
    }

    // Construire la liste des documents requis
    const documentsRequis: string[] = []
    if (documents) {
      Object.keys(documents).forEach((key) => {
        if (documents[key]) {
          documentsRequis.push(key)
        }
      })
    }

    // Créer la demande avec seulement les colonnes existantes
    const demandeData = {
      stagiaire_id: stagiaire.id,
      tuteur_id: stagiaire.tuteur_id,
      type,
      titre,
      description: finalDescription,
      statut: "en_attente" as const,
      date_demande: new Date().toISOString(),
      documents_requis: documentsRequis,
    }

    console.log("💾 POST - Création demande avec données:", demandeData)

    const { data: nouvelleDemande, error: creationError } = await supabase
      .from("demandes")
      .insert([demandeData])
      .select()
      .single()

    if (creationError) {
      console.error("❌ POST - Erreur création demande:", creationError)
      return NextResponse.json({ error: "Erreur lors de la création: " + creationError.message }, { status: 500 })
    }

    console.log("✅ POST - Demande créée avec succès:", nouvelleDemande)

    return NextResponse.json({
      success: true,
      data: nouvelleDemande,
      message: "Demande créée avec succès",
    })
  } catch (error) {
    console.error("💥 POST - Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 })
  }
}
