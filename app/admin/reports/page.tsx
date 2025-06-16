"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { TrendingUp, Users, FileText, Calendar, Download, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AdminReportsPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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
      if (!profile || profile.role !== "admin") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadStats()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStats = async () => {
    try {
      const [usersCount, stagiairesCount, demandesCount, evaluationsCount] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("stagiaires").select("id", { count: "exact", head: true }),
        supabase.from("demandes").select("id", { count: "exact", head: true }),
        supabase.from("evaluations").select("id", { count: "exact", head: true }),
      ])

      setStats({
        users_total: usersCount.count || 0,
        stagiaires_total: stagiairesCount.count || 0,
        demandes_total: demandesCount.count || 0,
        evaluations_total: evaluationsCount.count || 0,
      })
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    }
  }

  const generateReport = (type: string) => {
    // TODO: Implémenter la génération de rapports
    console.log(`Génération du rapport: ${type}`)
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
          <h1 className="text-3xl font-bold text-gray-900">Rapports et statistiques</h1>
          <p className="text-gray-600">Générer des rapports détaillés sur l'activité de la plateforme</p>
        </div>

        {/* Statistiques générales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.users_total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagiaires</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.stagiaires_total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes_total || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.evaluations_total || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Types de rapports */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rapport utilisateurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Statistiques détaillées sur les utilisateurs par rôle et département
              </p>
              <Button onClick={() => generateReport("users")} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport stagiaires
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Analyse des stages par période, entreprise et statut</p>
              <Button onClick={() => generateReport("stagiaires")} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Rapport demandes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Suivi des demandes par type et temps de traitement</p>
              <Button onClick={() => generateReport("demandes")} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rapport évaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Analyse des performances et notes des stagiaires</p>
              <Button onClick={() => generateReport("evaluations")} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Rapport activité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Évolution de l'activité sur la plateforme</p>
              <Button onClick={() => generateReport("activity")} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Rapport complet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">Rapport global avec toutes les métriques</p>
              <Button onClick={() => generateReport("complete")} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Générer
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
