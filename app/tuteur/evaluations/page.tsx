"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { ClipboardList, Plus, Eye, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Evaluation {
  id: string
  type: string
  note_globale?: number
  date_evaluation: string
  stagiaires?: {
    users?: {
      name: string
    }
  }
}

export default function TuteurEvaluationsPage() {
  const [user, setUser] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
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
      if (!profile || profile.role !== "tuteur") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadEvaluations(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadEvaluations = async (tuteurId: string) => {
    try {
      const { data, error } = await supabase
        .from("evaluations")
        .select(`
          *,
          stagiaires!inner(
            users!inner(name)
          )
        `)
        .eq("evaluateur_id", tuteurId)
        .order("date_evaluation", { ascending: false })

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des évaluations:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les évaluations",
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
      case "auto_evaluation":
        return "Auto-évaluation"
      default:
        return type
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Évaluations</h1>
          <p className="text-gray-600">Gérer les évaluations de vos stagiaires</p>
        </div>

        {/* Actions */}
        <div className="mb-6">
          <Button onClick={() => router.push("/tuteur/evaluations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle évaluation
          </Button>
        </div>

        {/* Liste des évaluations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Mes évaluations ({evaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evaluations.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune évaluation</h3>
                <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première évaluation.</p>
                <div className="mt-6">
                  <Button onClick={() => router.push("/tuteur/evaluations/new")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle évaluation
                  </Button>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stagiaire</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Note globale</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="font-medium">{evaluation.stagiaires?.users?.name || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getTypeLabel(evaluation.type)}</Badge>
                      </TableCell>
                      <TableCell>{evaluation.note_globale ? `${evaluation.note_globale}/20` : "Non notée"}</TableCell>
                      <TableCell>{formatDate(evaluation.date_evaluation)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/tuteur/evaluations/${evaluation.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/tuteur/evaluations/${evaluation.id}/edit`)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
