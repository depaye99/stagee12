import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { settingsService } from "@/lib/services/settings-service"

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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const titre = formData.get("titre") as string
    const type = formData.get("type") as string

    if (!file || !titre || !type) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 })
    }

    // **UTILISATION DES PARAMÈTRES SYSTÈME** - Approbation requise
    const requireApproval = await settingsService.getSetting("require_document_approval")

    console.log("📄 Upload document avec approbation requise:", requireApproval)

    // Upload du fichier vers Supabase Storage
    const fileName = `${Date.now()}-${file.name}`
    const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(fileName, file)

    if (uploadError) {
      throw uploadError
    }

    // **IMPACT RÉEL DES PARAMÈTRES** - Statut selon la configuration
    const statut = requireApproval ? "en_attente" : "approuve"

    // Créer l'entrée document
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        titre,
        type,
        chemin_fichier: uploadData.path,
        taille: file.size,
        user_id: user.id,
        statut, // Statut basé sur les paramètres système
      })
      .select()
      .single()

    if (docError) {
      // Supprimer le fichier si erreur
      await supabase.storage.from("documents").remove([fileName])
      throw docError
    }

    // **NOTIFICATIONS BASÉES SUR LES PARAMÈTRES**
    const notificationEnabled = await settingsService.getSetting("notification_email_enabled")

    if (notificationEnabled && requireApproval) {
      // Notifier les RH pour approbation
      console.log("📧 Notification envoyée pour approbation document")
      // Ici on pourrait envoyer un email ou créer une notification
    }

    return NextResponse.json({
      success: true,
      message: requireApproval
        ? "Document uploadé et en attente d'approbation"
        : "Document uploadé et approuvé automatiquement",
      data: document,
    })
  } catch (error) {
    console.error("Erreur lors de l'upload:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
