import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Récupérer les statistiques générales sans vérification d'authentification
    // pour les statistiques publiques de la page d'accueil
    const [stagiaireCount, demandeCount, documentCount, evaluationCount] = await Promise.all([
      supabase.from("stagiaires").select("id", { count: "exact", head: true }),
      supabase.from("demandes").select("id", { count: "exact", head: true }),
      supabase.from("documents").select("id", { count: "exact", head: true }),
      supabase.from("evaluations").select("id", { count: "exact", head: true }),
    ])

    const stats = {
      stagiaires_total: stagiaireCount.count || 0,
      demandes_total: demandeCount.count || 0,
      documents_total: documentCount.count || 0,
      evaluations_total: evaluationCount.count || 0,
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error)

    // Retourner des statistiques par défaut en cas d'erreur
    return NextResponse.json({
      stagiaires_total: 0,
      demandes_total: 0,
      documents_total: 0,
      evaluations_total: 0,
    })
  }
}
