"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { ClipboardList, TrendingUp, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface Evaluation {
  id: string
  type: string
  periode?: string
  date_evaluation: string
  note_globale?: number
  competences_techniques?: number
  competences_relationnelles?: number
  autonomie?: number
  initiative?: number
  ponctualite?: number
  points_forts?: string
  points_amelioration?: string
  commentaires?: string
  recommandations?: string
  evaluateur?: {
    name: string
  }
}

export default function StagiaireEvaluationsPage() {
  const [user, setUser] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [stats, setStats] = useState({
    moyenne_globale: 0,
    derniere_note: 0,
    progression: 0,
    total_evaluations: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push("/auth/login")
        return
      }

      const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()
      if (!profile || profile.role !== "stagiaire") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadEvaluations(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadEvaluations = async (userId: string) => {
    try {
      // Récupérer le stagiaire
      const { data: stagiaire } = await supabase
        .from("stagiaires")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (!stagiaire) return

      // Récupérer les évaluations
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          users!evaluateur_id(name)
        `)
        .eq("stagiaire_id", stagiaire.id)
        .order("date_evaluation", { ascending: false })

      if (error) throw error

      const evaluationsData = data || []
      setEvaluations(evaluationsData)

      // Calculer les statistiques
      if (evaluationsData.length > 0) {
        const notesGlobales = evaluationsData
          .filter((e) => e.note_globale !== null)
          .map((e) => e.note_globale)

        const moyenne = notesGlobales.length > 0 
          ? notesGlobales.reduce((sum, note) => sum + note, 0) / notesGlobales.length 
          : 0

        const derniereNote = evaluationsData[0]?.note_globale || 0
        const premiereNote = evaluationsData[evaluationsData.length - 1]?.note_globale || 0
        const progression = premiereNote > 0 ? ((derniereNote - premiereNote) / premiereNote) * 100 : 0

        setStats({
          moyenne_globale: moyenne,
          derniere_note: derniereNote,
          progression: progression,
          total_evaluations: evaluationsData.length,
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des évaluations:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger vos évaluations",
        variant: "destructive",
      })
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "mi_parcours":
        return "Mi-parcours"
      case "finale":
        return "Finale"
      case "mensuelle":
        return "Mensuelle"
      case "projet":
        return "Projet"
      default:
        return type
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 16) return "text-green-600"
    if (score >= 12) return "text-yellow-600"
    return "text-red-600"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mes évaluations</h1>
          <p className="text-gray-600">Consultez vos évaluations et votre progression</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Note moyenne</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.moyenne_globale.toFixed(1)}/20</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600 ml-auto" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Dernière note</p>
                  <p className={`text-2xl font-bold ${getScoreColor(stats.derniere_note)}`}>
                    {stats.derniere_note.toFixed(1)}/20
                  </p>
                </div>
                <ClipboardList className="h-8 w-8 text-green-600 ml-auto" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progression</p>
                  <p className={`text-2xl font-bold ${stats.progression >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.progression >= 0 ? '+' : ''}{stats.progression.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 ml-auto" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total évaluations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_evaluations}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-gray-600 ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Historique des évaluations ({evaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune évaluation</h3>
                <p className="mt-1 text-sm text-gray-500">Vos évaluations apparaîtront ici une fois créées par votre tuteur.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evaluations.map((evaluation) => (
                  <Card key={evaluation.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            Évaluation {getTypeLabel(evaluation.type)}
                          </h3>
                          {evaluation.periode && (
                            <p className="text-sm text-gray-600">Période: {evaluation.periode}</p>
                          )}
                          <p className="text-sm text-gray-600">
                            Date: {formatDate(evaluation.date_evaluation)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Évaluateur: {evaluation.evaluateur?.name}
                          </p>
                        </div>
                        <div className="text-right">
                          {evaluation.note_globale && (
                            <div className="text-2xl font-bold text-blue-600">
                              {evaluation.note_globale}/20
                            </div>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/stagiaire/evaluations/${evaluation.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </div>
                      </div>

                      {/* Notes détaillées */}
                      {(evaluation.competences_techniques || evaluation.competences_relationnelles || evaluation.autonomie) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {evaluation.competences_techniques && (
                            <div>
                              <p className="text-sm text-gray-600">Compétences techniques</p>
                              <div className="flex items-center gap-2">
                                <Progress value={(evaluation.competences_techniques / 20) * 100} className="flex-1" />
                                <span className="text-sm font-medium">{evaluation.competences_techniques}/20</span>
                              </div>
                            </div>
                          )}
                          {evaluation.competences_relationnelles && (
                            <div>
                              <p className="text-sm text-gray-600">Compétences relationnelles</p>
                              <div className="flex items-center gap-2">
                                <Progress value={(evaluation.competences_relationnelles / 20) * 100} className="flex-1" />
                                <span className="text-sm font-medium">{evaluation.competences_relationnelles}/20</span>
                              </div>
                            </div>
                          )}
                          {evaluation.autonomie && (
                            <div>
                              <p className="text-sm text-gray-600">Autonomie</p>
                              <div className="flex items-center gap-2">
                                <Progress value={(evaluation.autonomie / 20) * 100} className="flex-1" />
                                <span className="text-sm font-medium">{evaluation.autonomie}/20</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Aperçu des commentaires */}
                      {evaluation.points_forts && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-green-700">Points forts:</p>
                          <p className="text-sm text-gray-700 line-clamp-2">{evaluation.points_forts}</p>
                        </div>
                      )}

                      {evaluation.points_amelioration && (
                        <div className="mb-2">
                          <p className="text-sm font-medium text-orange-700">Points d'amélioration:</p>
                          <p className="text-sm text-gray-700 line-clamp-2">{evaluation.points_amelioration}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
