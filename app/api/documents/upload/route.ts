import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File
    const isPublic = formData.get("isPublic") === "true"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `documents/${session.user.id}/${fileName}`

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

    if (uploadError) {
      console.error("Erreur upload:", uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

    // Enregistrer les métadonnées en base
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert([
        {
          nom: file.name,
          type: file.type,
          taille: file.size,
          url: urlData.publicUrl,
          user_id: session.user.id,
          is_public: isPublic,
        },
      ])
      .select()
      .single()

    if (docError) {
      console.error("Erreur base de données:", docError)
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: docData,
      message: "Document uploadé avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de l'upload:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
