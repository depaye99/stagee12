"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Users, FileText, TrendingUp, Settings, UserPlus, Activity } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface DashboardStats {
  users_total: number
  stagiaires_total: number
  demandes_total: number
  demandes_en_attente: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
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

      // Récupérer le profil utilisateur
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
      const [usersCount, stagiairesCount, demandesCount, demandesEnAttenteCount] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("stagiaires").select("id", { count: "exact", head: true }),
        supabase.from("demandes").select("id", { count: "exact", head: true }),
        supabase.from("demandes").select("id", { count: "exact", head: true }).eq("statut", "en_attente"),
      ])

      setStats({
        users_total: usersCount.count || 0,
        stagiaires_total: stagiairesCount.count || 0,
        demandes_total: demandesCount.count || 0,
        demandes_en_attente: demandesEnAttenteCount.count || 0,
      })
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error)
    }
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

      <main className="container-responsive py-responsive">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-responsive-lg font-bold text-gray-900">Tableau de bord - Administration</h1>
          <p className="text-responsive-sm text-gray-600 mt-1">Vue d'ensemble de la plateforme Bridge Technologies</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="card-responsive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs totaux</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl sm:text-2xl font-bold">{stats?.users_total || 0}</div>
              <p className="text-xs text-muted-foreground">Tous les utilisateurs actifs</p>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagiaires</CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl sm:text-2xl font-bold">{stats?.stagiaires_total || 0}</div>
              <p className="text-xs text-muted-foreground">Stagiaires actifs</p>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes en attente</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl sm:text-2xl font-bold">{stats?.demandes_en_attente || 0}</div>
              <p className="text-xs text-muted-foreground">À traiter</p>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Logs d'activité</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <div className="text-xl sm:text-2xl font-bold">{0}</div>
              <p className="text-xs text-muted-foreground">Actions enregistrées</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Gestion des utilisateurs</CardTitle>
              <CardDescription className="text-sm">Créer et gérer les comptes utilisateurs</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <Button className="w-full" onClick={() => router.push("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Gérer les utilisateurs
              </Button>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Demandes</CardTitle>
              <CardDescription className="text-sm">Superviser toutes les demandes</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <Button className="w-full" onClick={() => router.push("/admin/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir les demandes
              </Button>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Logs système</CardTitle>
              <CardDescription className="text-sm">Consulter l'activité du système</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <Button className="w-full" onClick={() => router.push("/admin/logs")}>
                <Activity className="mr-2 h-4 w-4" />
                Voir les logs
              </Button>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Rapports</CardTitle>
              <CardDescription className="text-sm">Générer des rapports d'activité</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <Button className="w-full" onClick={() => router.push("/admin/reports")}>
                <TrendingUp className="mr-2 h-4 w-4" />
                Générer un rapport
              </Button>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Stagiaires</CardTitle>
              <CardDescription className="text-sm">Gérer les stagiaires</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <Button className="w-full" onClick={() => router.push("/admin/stagiaires")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Gérer les stagiaires
              </Button>
            </CardContent>
          </Card>

          <Card className="card-responsive">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Paramètres</CardTitle>
              <CardDescription className="text-sm">Configuration du système</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pt-4">
              <Button className="w-full" onClick={() => router.push("/admin/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres système
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
