"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Calendar, Users, Clock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface StagiaireWithDates {
  id: string
  entreprise?: string
  poste?: string
  date_debut?: string
  date_fin?: string
  statut: string
  users?: {
    name: string
    email: string
  }
}

export default function TuteurPlanningPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<StagiaireWithDates[]>([])
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
      await loadStagiaires(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaires = async (tuteurId: string) => {
    try {
      const { data, error } = await supabase
        .from("stagiaires")
        .select(`
          *,
          users!user_id(name, email)
        `)
        .eq("tuteur_id", tuteurId)
        .order("date_debut", { ascending: true })

      if (error) throw error
      setStagiaires(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des stagiaires:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger le planning",
        variant: "destructive",
      })
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Non définie"
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "actif":
        return "bg-green-100 text-green-800"
      case "termine":
        return "bg-gray-100 text-gray-800"
      case "suspendu":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const isStageActive = (dateDebut?: string, dateFin?: string) => {
    if (!dateDebut || !dateFin) return false
    const now = new Date()
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    return now >= debut && now <= fin
  }

  const getDaysRemaining = (dateFin?: string) => {
    if (!dateFin) return null
    const now = new Date()
    const fin = new Date(dateFin)
    const diffTime = fin.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
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
          <h1 className="text-3xl font-bold text-gray-900">Planning des stages</h1>
          <p className="text-gray-600">Vue d'ensemble des stages de vos stagiaires</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stages actifs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stagiaires.filter((s) => s.statut === "actif").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stages terminés</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stagiaires.filter((s) => s.statut === "termine").length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total stagiaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stagiaires.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Planning */}
        <div className="space-y-6">
          {stagiaires.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun stagiaire</h3>
                <p className="mt-1 text-sm text-gray-500">Vous n'avez pas encore de stagiaires assignés.</p>
              </CardContent>
            </Card>
          ) : (
            stagiaires.map((stagiaire) => (
              <Card key={stagiaire.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{stagiaire.users?.name}</CardTitle>
                    <Badge className={getStatusColor(stagiaire.statut)}>{stagiaire.statut}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Entreprise</p>
                      <p className="font-medium">{stagiaire.entreprise || "Non définie"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Poste</p>
                      <p className="font-medium">{stagiaire.poste || "Non défini"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Période</p>
                      <p className="font-medium">
                        {formatDate(stagiaire.date_debut)} - {formatDate(stagiaire.date_fin)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Temps restant</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">
                          {stagiaire.statut === "actif" && stagiaire.date_fin
                            ? `${getDaysRemaining(stagiaire.date_fin)} jours`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isStageActive(stagiaire.date_debut, stagiaire.date_fin) && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        <strong>Stage en cours</strong> - Ce stagiaire est actuellement en stage.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
