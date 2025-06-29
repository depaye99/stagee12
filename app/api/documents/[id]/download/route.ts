import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    // Récupérer les informations du document
    const { data: document, error } = await supabase.from("documents").select("*").eq("id", params.id).single()

    if (error || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const canAccess =
      document.user_id === session.user.id || // Propriétaire
      document.is_public || // Document public
      (profile && ["admin", "rh", "tuteur"].includes(profile.role)) // Rôles autorisés

    if (!canAccess) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Télécharger depuis Supabase Storage
    if (document.chemin_fichier) {
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("documents")
        .download(document.chemin_fichier)

      if (downloadError) {
        console.error("Erreur téléchargement:", downloadError)
        return NextResponse.json({ error: "Erreur lors du téléchargement" }, { status: 500 })
      }

      const buffer = await fileData.arrayBuffer()

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": document.type_fichier || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${document.nom}"`,
          "Content-Length": buffer.byteLength.toString(),
        },
      })
    }

    return NextResponse.json({ error: "Fichier non disponible" }, { status: 404 })
  } catch (error) {
    console.error("Erreur téléchargement document:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
