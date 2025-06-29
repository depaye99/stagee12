import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

const uploadDocumentSchema = z.object({
  nom: z.string().min(1, "Le nom du document est requis"),
  type: z.enum(["stage", "evaluation", "autre", "cv", "certificat_scolarite", "lettre_motivation", "lettre_recommandation", "convention", "attestation"]),
  description: z.string().optional(),
  demande_id: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Auth error:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const metadataStr = formData.get("metadata") as string

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    let metadata
    try {
      metadata = JSON.parse(metadataStr || '{}')
    } catch {
      return NextResponse.json({ error: "Métadonnées invalides" }, { status: 400 })
    }

    // Valider les métadonnées
    const validatedMetadata = uploadDocumentSchema.parse(metadata)

    // Vérifier la taille du fichier (max 10MB selon les exigences)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10MB)" }, { status: 400 })
    }

    // Types de fichiers autorisés selon les exigences
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'text/plain'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Type de fichier non autorisé. Formats acceptés : PDF, DOC, DOCX, JPG, PNG" 
      }, { status: 400 })
    }

    // Générer un nom de fichier sécurisé
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    const sanitizedFileName = validatedMetadata.nom.replace(/[^a-zA-Z0-9]/g, '_')
    const fileName = `${Date.now()}_${sanitizedFileName}.${fileExtension}`
    const filePath = `documents/${user.id}/${fileName}`

    // Upload vers Supabase Storage avec gestion d'erreur
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error("Erreur upload storage:", uploadError)
      return NextResponse.json({ 
        error: "Erreur lors de l'upload: " + uploadError.message 
      }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath)

    // Sauvegarder en base avec traçabilité complète
    const { data: document, error: dbError } = await supabase
      .from("documents")
      .insert({
        nom: validatedMetadata.nom,
        type: validatedMetadata.type,
        description: validatedMetadata.description || "",
        chemin_fichier: filePath,
        url: publicUrl,
        taille: file.size,
        type_fichier: file.type,
        user_id: user.id,
        demande_id: validatedMetadata.demande_id || null,
        statut: "en_attente", // Workflow de validation
        is_public: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error("Erreur sauvegarde document:", dbError)
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage.from("documents").remove([filePath])
      return NextResponse.json({ 
        error: "Erreur lors de la sauvegarde: " + dbError.message 
      }, { status: 500 })
    }

    // Notification automatique selon les exigences du workflow
    if (validatedMetadata.demande_id) {
      // Notifier le tuteur/RH de l'ajout du document
      try {
        await supabase.from("notifications").insert({
          user_id: user.id,
          titre: "Document ajouté",
          message: `Un nouveau document "${validatedMetadata.nom}" a été ajouté à une demande`,
          type: "document",
          lu: false
        })
      } catch (notifError) {
        console.warn("Erreur notification:", notifError)
      }
    }

    return NextResponse.json({ 
      success: true, 
      document,
      message: "Document uploadé avec succès"
    })

  } catch (error: any) {
    console.error("Erreur upload document:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ 
      error: "Erreur interne: " + error.message 
    }, { status: 500 })
  }
}
