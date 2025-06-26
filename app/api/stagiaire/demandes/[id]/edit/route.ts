import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const editDemandeSchema = z.object({
  type: z.enum(["conge", "modification_planning", "changement_tuteur", "autre"]).optional(),
  description: z.string().min(10, "Description trop courte").optional(),
  date_debut: z.string().transform((str) => new Date(str)).optional(),
  date_fin: z.string().transform((str) => new Date(str)).optional(),
  document_url: z.string().url().optional().nullable(),
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

    // Vérifier que l'utilisateur est un stagiaire
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "stagiaire") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Vérifier que la demande appartient au stagiaire
    const { data: existingDemande, error: fetchError } = await supabase
      .from("demandes")
      .select("stagiaire_id, statut")
      .eq("id", params.id)
      .single()

    if (fetchError || !existingDemande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    const { data: stagiaireData } = await supabase
      .from("stagiaires")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (existingDemande.stagiaire_id !== stagiaireData?.id) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    // Vérifier que la demande est en attente
    if (existingDemande.statut !== "en_attente") {
      return NextResponse.json({ 
        error: "Seules les demandes en attente peuvent être modifiées" 
      }, { status: 400 })
    }

    const validatedData = editDemandeSchema.parse(body)

    const updateData: any = { ...validatedData }
    if (validatedData.date_debut) {
      updateData.date_debut = validatedData.date_debut.toISOString().split('T')[0]
    }
    if (validatedData.date_fin) {
      updateData.date_fin = validatedData.date_fin.toISOString().split('T')[0]
    }

    const { data: demande, error } = await supabase
      .from("demandes")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur modification demande:", error)
      return NextResponse.json({ error: "Erreur lors de la modification" }, { status: 500 })
    }

    return NextResponse.json({ demande })

  } catch (error) {
    console.error("Erreur edit demande:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
