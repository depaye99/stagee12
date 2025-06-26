
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const approveDemandeSchema = z.object({
  commentaire_tuteur: z.string().optional(),
})

export async function POST(
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

    // Vérifier que l'utilisateur est un tuteur
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role !== "tuteur") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Vérifier que la demande concerne un stagiaire du tuteur
    const { data: demande, error: fetchError } = await supabase
      .from("demandes")
      .select(`
        *,
        stagiaire:stagiaires(
          id,
          tuteur_id
        )
      `)
      .eq("id", params.id)
      .single()

    if (fetchError || !demande) {
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    if (demande.stagiaire?.tuteur_id !== user.id) {
      return NextResponse.json({ error: "Permission refusée" }, { status: 403 })
    }

    if (demande.statut !== "en_attente") {
      return NextResponse.json({ 
        error: "Cette demande a déjà été traitée" 
      }, { status: 400 })
    }

    const { commentaire_tuteur } = approveDemandeSchema.parse(body)

    const { data: updatedDemande, error } = await supabase
      .from("demandes")
      .update({
        statut: "approuvee",
        commentaire_tuteur,
        date_traitement: new Date().toISOString(),
        traite_par: user.id
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur approbation demande:", error)
      return NextResponse.json({ error: "Erreur lors de l'approbation" }, { status: 500 })
    }

    // Créer une notification pour le stagiaire
    await supabase.from("notifications").insert({
      user_id: demande.stagiaire_id,
      type: "demande_approuvee",
      titre: "Demande approuvée",
      contenu: `Votre demande de ${demande.type} a été approuvée par votre tuteur.`,
      metadata: { demande_id: demande.id }
    })

    return NextResponse.json({ demande: updatedDemande })

  } catch (error) {
    console.error("Erreur approve demande:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
