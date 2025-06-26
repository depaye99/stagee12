
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Récupérer le document avec ses informations
    const { data: document, error: fetchError } = await supabase
      .from("documents")
      .select("uploaded_by, file_path")
      .eq("id", params.id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const canDelete = document.uploaded_by === user.id || 
                     ["admin", "rh"].includes(userData?.role || "")

    if (!canDelete) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    // Supprimer le fichier du storage
    if (document.file_path) {
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.file_path])

      if (storageError) {
        console.error("Erreur suppression storage:", storageError)
      }
    }

    // Supprimer l'enregistrement de la base
    const { error: deleteError } = await supabase
      .from("documents")
      .delete()
      .eq("id", params.id)

    if (deleteError) {
      console.error("Erreur suppression document:", deleteError)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    return NextResponse.json({ message: "Document supprimé avec succès" })

  } catch (error) {
    console.error("Erreur delete document:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
