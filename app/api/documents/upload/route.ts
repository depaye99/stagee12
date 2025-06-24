import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const type = formData.get("type") as string
    const isPublic = formData.get("isPublic") === "true"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    console.log("📄 Upload document:", { fileName: file.name, size: file.size, type })

    // Générer un nom de fichier unique
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `documents/${user.id}/${fileName}`

    // Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(filePath, file)

    if (uploadError) {
      console.error("❌ Erreur upload:", uploadError)
      return NextResponse.json({ error: "Erreur lors de l'upload: " + uploadError.message }, { status: 500 })
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath)

    // Enregistrer les métadonnées en base
    const { data: docData, error: docError } = await supabase
      .from("documents")
      .insert([
        {
          nom: file.name,
          type: type || file.type,
          taille: file.size,
          url: urlData.publicUrl,
          chemin_fichier: filePath,
          user_id: user.id,
          is_public: isPublic,
          statut: "approuve",
        },
      ])
      .select()
      .single()

    if (docError) {
      console.error("❌ Erreur base de données:", docError)
      // Supprimer le fichier si erreur
      await supabase.storage.from("documents").remove([filePath])
      return NextResponse.json({ error: "Erreur lors de l'enregistrement: " + docError.message }, { status: 500 })
    }

    console.log("✅ Document uploadé avec succès:", docData.id)

    return NextResponse.json({
      success: true,
      data: {
        id: docData.id,
        url: urlData.publicUrl,
        name: file.name,
        size: file.size,
      },
      message: "Document uploadé avec succès",
    })
  } catch (error) {
    console.error("💥 Erreur lors de l'upload:", error)
    return NextResponse.json({ error: "Erreur serveur: " + (error as Error).message }, { status: 500 })
  }
}
