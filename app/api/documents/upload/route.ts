import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const uploadDocumentSchema = z.object({
  nom: z.string().min(1, "Le nom du document est requis"),
  type: z.enum(["stage", "evaluation", "autre"]),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const metadata = JSON.parse(formData.get("metadata") as string)

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Valider les métadonnées
    const validatedMetadata = uploadDocumentSchema.parse(metadata)

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10MB)" }, { status: 400 })
    }

    // Vérifier le type de fichier
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
      return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 })
    }

    // Générer un nom de fichier unique
    const fileExtension = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`
    const filePath = `documents/${user.id}/${fileName}`

    // Upload du fichier vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file)

    if (uploadError) {
      console.error("Erreur upload storage:", uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from("documents")
      .getPublicUrl(filePath)

    // Sauvegarder les informations en base
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
        statut: "approuve",
        is_public: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error("Erreur sauvegarde document:", dbError)
      // Supprimer le fichier uploadé en cas d'erreur
      await supabase.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: "Erreur lors de la sauvegarde: " + dbError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, document })

  } catch (error: any) {
    console.error("Erreur upload document:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne: " + error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer les documents de l'utilisateur
    const { data: documents, error: fetchError } = await supabase
      .from("documents")
      .select(`
        *,
        users:user_id (
          name,
          email
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.error("Erreur récupération documents:", fetchError)
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 })
    }

    return NextResponse.json({ success: true, documents })

  } catch (error: any) {
    console.error("Erreur GET documents:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
