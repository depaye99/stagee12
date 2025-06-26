import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
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

    console.log("📄 Récupération du contenu du document:", params.id)

    // Récupérer les informations du document
    const { data: document, error } = await supabase.from("documents").select("*").eq("id", params.id).single()

    if (error || !document) {
      console.error("❌ Document non trouvé:", error)
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    const canAccess =
      document.user_id === user.id || // Propriétaire
      document.is_public || // Document public
      (profile && ["admin", "rh", "tuteur"].includes(profile.role)) // Rôles autorisés

    if (!canAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Si c'est un document stocké dans Supabase Storage
    if (document.url && document.url.includes("supabase")) {
      try {
        const { data: fileData, error: downloadError } = await supabase.storage
          .from("documents")
          .download(document.url.split("/").pop() || "")

        if (downloadError) {
          console.error("❌ Erreur téléchargement:", downloadError)
          return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
        }

        const buffer = await fileData.arrayBuffer()

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": document.type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${document.nom}"`,
            "Content-Length": buffer.byteLength.toString(),
          },
        })
      } catch (storageError) {
        console.error("❌ Erreur storage:", storageError)
      }
    }

    // Fallback : retourner les métadonnées du document
    return NextResponse.json({
      success: true,
      data: {
        id: document.id,
        nom: document.nom,
        type: document.type,
        taille: document.taille,
        url: document.url,
        is_public: document.is_public,
        created_at: document.created_at,
        preview_available: false,
        message: "Prévisualisation non disponible pour ce type de fichier",
      },
    })
  } catch (error) {
    console.error("💥 Erreur API contenu document:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
