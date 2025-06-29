
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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
    const type = formData.get("type") as string
    const isPublic = formData.get("isPublic") === "true"

    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni" }, { status: 400 })
    }

    // Vérifier la taille du fichier (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10MB)" }, { status: 400 })
    }

    // Types de fichiers autorisés
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
    const timestamp = Date.now()
    const fileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `documents/${user.id}/${fileName}`

    try {
      // Upload vers Supabase Storage
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

      // Obtenir l'URL publique ou signée
      let publicUrl: string
      if (isPublic) {
        const { data: { publicUrl: url } } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath)
        publicUrl = url
      } else {
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from("documents")
          .createSignedUrl(filePath, 60 * 60 * 24 * 7) // 7 jours

        if (signedUrlError) {
          console.error("Erreur création URL signée:", signedUrlError)
          // Fallback vers URL publique
          const { data: { publicUrl: fallbackUrl } } = supabase.storage
            .from("documents")
            .getPublicUrl(filePath)
          publicUrl = fallbackUrl
        } else {
          publicUrl = signedUrlData.signedUrl
        }
      }

      // Sauvegarder en base
      const { data: document, error: dbError } = await supabase
        .from("documents")
        .insert({
          nom: file.name,
          type: type || "autre",
          description: "",
          chemin_fichier: filePath,
          url: publicUrl,
          taille: file.size,
          type_fichier: file.type,
          user_id: user.id,
          statut: "valide",
          is_public: isPublic,
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

      console.log("✅ Document uploadé avec succès:", document.id)

      return NextResponse.json({ 
        success: true, 
        data: {
          id: document.id,
          url: publicUrl,
          nom: document.nom,
          type: document.type,
          taille: document.taille
        },
        message: "Document uploadé avec succès"
      })

    } catch (storageError) {
      console.error("Erreur storage:", storageError)
      return NextResponse.json({ 
        error: "Erreur lors de l'upload vers le stockage" 
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error("Erreur upload document:", error)
    return NextResponse.json({ 
      error: "Erreur interne: " + error.message 
    }, { status: 500 })
  }
}
