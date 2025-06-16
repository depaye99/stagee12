import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = Number.parseInt(searchParams.get("period") || "12")

    // Calculer la date de début selon la période
    const startDate = new Date()
    startDate.setMonth(startDate.getMonth() - period)

    // Données des stagiaires
    const { data: stagiaires } = await supabase
      .from("stagiaires")
      .select(`
        *,
        users(name, email, department)
      `)
      .gte("created_at", startDate.toISOString())

    // Données des demandes
    const { data: demandes } = await supabase.from("demandes").select("*").gte("created_at", startDate.toISOString())

    // Données des évaluations
    const { data: evaluations } = await supabase
      .from("evaluations")
      .select("*")
      .gte("created_at", startDate.toISOString())

    // Données des documents
    const { data: documents } = await supabase.from("documents").select("*").gte("created_at", startDate.toISOString())

    // Traitement des données pour les graphiques
    const reportingData = {
      stagiaires: {
        total: stagiaires?.length || 0,
        actifs: stagiaires?.filter((s) => s.statut === "actif").length || 0,
        termines: stagiaires?.filter((s) => s.statut === "termine").length || 0,
        par_mois: generateMonthlyData(stagiaires || [], period),
        par_departement: generateDepartmentData(stagiaires || []),
      },
      demandes: {
        total: demandes?.length || 0,
        en_attente: demandes?.filter((d) => d.statut === "en_attente").length || 0,
        approuvees: demandes?.filter((d) => d.statut === "approuvee").length || 0,
        rejetees: demandes?.filter((d) => d.statut === "rejetee").length || 0,
        par_type: generateDemandeTypeData(demandes || []),
        par_mois: generateMonthlyData(demandes || [], period),
      },
      evaluations: {
        total: evaluations?.length || 0,
        moyenne_globale: calculateAverageGrade(evaluations || []),
        par_critere: generateCriteriaData(evaluations || []),
      },
      documents: {
        total: documents?.length || 0,
        par_type: generateDocumentTypeData(documents || []),
      },
    }

    return NextResponse.json(reportingData)
  } catch (error) {
    console.error("Erreur lors de la génération du rapport:", error)
    return NextResponse.json({ error: "Erreur lors de la génération du rapport" }, { status: 500 })
  }
}

function generateMonthlyData(data: any[], period: number) {
  const months = []
  const now = new Date()

  for (let i = period - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })

    const count = data.filter((item) => {
      const itemDate = new Date(item.created_at)
      return itemDate.getMonth() === date.getMonth() && itemDate.getFullYear() === date.getFullYear()
    }).length

    months.push({ mois: monthName, nombre: count })
  }

  return months
}

function generateDepartmentData(stagiaires: any[]) {
  const departments = stagiaires.reduce((acc, stagiaire) => {
    const dept = stagiaire.users?.department || "Non défini"
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {})

  return Object.entries(departments).map(([departement, nombre]) => ({
    departement,
    nombre: nombre as number,
  }))
}

function generateDemandeTypeData(demandes: any[]) {
  const types = demandes.reduce((acc, demande) => {
    acc[demande.type] = (acc[demande.type] || 0) + 1
    return acc
  }, {})

  return Object.entries(types).map(([type, nombre]) => ({
    type,
    nombre: nombre as number,
  }))
}

function generateDocumentTypeData(documents: any[]) {
  const types = documents.reduce((acc, document) => {
    acc[document.type] = (acc[document.type] || 0) + 1
    return acc
  }, {})

  return Object.entries(types).map(([type, nombre]) => ({
    type,
    nombre: nombre as number,
  }))
}

function calculateAverageGrade(evaluations: any[]) {
  if (evaluations.length === 0) return 0

  const total = evaluations.reduce((sum, evaluation) => sum + (evaluation.note_globale || 0), 0)
  return total / evaluations.length
}

function generateCriteriaData(evaluations: any[]) {
  if (evaluations.length === 0) return []

  const criteria = [
    { key: "competences_techniques", label: "Compétences techniques" },
    { key: "competences_relationnelles", label: "Compétences relationnelles" },
    { key: "autonomie", label: "Autonomie" },
  ]

  return criteria.map((criterion) => {
    const validEvals = evaluations.filter((e) => e[criterion.key] != null)
    const average =
      validEvals.length > 0 ? validEvals.reduce((sum, e) => sum + e[criterion.key], 0) / validEvals.length : 0

    return {
      critere: criterion.label,
      moyenne: Number(average.toFixed(2)),
    }
  })
}
