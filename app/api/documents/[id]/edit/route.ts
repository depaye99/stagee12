
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const editDocumentSchema = z.object({
  nom: z.string().min(1, "Le nom du document est requis").optional(),
  type: z.enum(["stage", "evaluation", "autre"]).optional(),
  description: z.string().optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier que le document existe et appartient à l'utilisateur
    const { data: existingDoc, error: fetchError } = await supabase
      .from("documents")
      .select("uploaded_by")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: "Document non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    const canEdit = existingDoc.uploaded_by === user.id || 
                   ["admin", "rh"].includes(userData?.role || "")

    if (!canEdit) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    const validatedData = editDocumentSchema.parse(body)

    const { data: document, error } = await supabase
      .from("documents")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString()
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur modification document:", error)
      return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
    }

    return NextResponse.json({ document })

  } catch (error) {
    console.error("Erreur edit document:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
