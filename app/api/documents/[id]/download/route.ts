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

    console.log("⬇️ Téléchargement du document:", params.id)

    // Récupérer les informations du document
    const { data: document, error } = await supabase.from("documents").select("*").eq("id", params.id).single()

    if (error || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    const canDownload =
      document.user_id === user.id || // Propriétaire
      document.is_public || // Document public
      (profile && ["admin", "rh", "tuteur"].includes(profile.role)) // Rôles autorisés

    if (!canDownload) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Si le document a une URL directe
    if (document.url) {
      return NextResponse.redirect(document.url)
    }

    // Sinon, générer un lien de téléchargement temporaire
    const { data: signedUrl, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(`${document.user_id}/${document.nom}`, 3600) // 1 heure

    if (signError || !signedUrl) {
      console.error("❌ Erreur génération URL signée:", signError)
      return NextResponse.json({ error: "Impossible de générer le lien de téléchargement" }, { status: 500 })
    }

    return NextResponse.redirect(signedUrl.signedUrl)
  } catch (error) {
    console.error("💥 Erreur API téléchargement document:", error)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
