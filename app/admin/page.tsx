"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Users, UserPlus, FileText, BarChart3, Settings, UserCheck } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface AdminStats {
  users_total: number
  stagiaires_total: number
  demandes_total: number
  demandes_en_attente: number
}

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<AdminStats>({
    users_total: 0,
    stagiaires_total: 0,
    demandes_total: 0,
    demandes_en_attente: 0,
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth/login")
          return
        }

        const { data: profile, error } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (error || !profile || profile.role !== "admin") {
          console.error("❌ Erreur profil admin:", error)
          router.push("/auth/login")
          return
        }

        setUser(profile)
        await loadStats()
      } catch (error) {
        console.error("💥 Erreur checkAuth admin:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const loadStats = async () => {
    try {
      console.log("📊 Chargement des statistiques admin...")

      const response = await fetch("/api/statistics")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("✅ Statistiques admin chargées:", data.data)
        setStats(data.data)
      } else {
        console.error("❌ Erreur API stats:", data.error)
        toast({
          title: "Erreur",
          description: "Impossible de charger les statistiques",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 Erreur lors du chargement des statistiques:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des statistiques",
        variant: "destructive",
      })
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header user={user} />

      <main className="flex-1 max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tableau de bord Administrateur</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Bienvenue, {user?.name || user?.email}. Gérez votre plateforme de stages.
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users_total}</div>
              <p className="text-xs text-muted-foreground">Total des utilisateurs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagiaires</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stagiaires_total}</div>
              <p className="text-xs text-muted-foreground">Stagiaires actifs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.demandes_total}</div>
              <p className="text-xs text-muted-foreground">Total des demandes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.demandes_en_attente}</div>
              <p className="text-xs text-muted-foreground">Demandes à traiter</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestion des utilisateurs</CardTitle>
              <CardDescription>Créer, modifier et gérer les utilisateurs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => router.push("/admin/users")}>
                <Users className="mr-2 h-4 w-4" />
                Voir tous les utilisateurs ({stats.users_total})
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/admin/users/new")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un utilisateur
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gestion des stagiaires</CardTitle>
              <CardDescription>Superviser les stagiaires et leurs tuteurs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" onClick={() => router.push("/admin/stagiaires")}>
                <UserCheck className="mr-2 h-4 w-4" />
                Voir tous les stagiaires ({stats.stagiaires_total})
              </Button>
              <Button variant="outline" className="w-full" onClick={() => router.push("/admin/stagiaires/new")}>
                <UserPlus className="mr-2 h-4 w-4" />
                Ajouter un stagiaire
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Demandes</CardTitle>
              <CardDescription>Traiter les demandes des stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir toutes les demandes ({stats.demandes_total})
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rapports</CardTitle>
              <CardDescription>Générer des rapports et statistiques</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/reports")}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Voir les rapports
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>Configuration de la plateforme</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/settings")}>
                <Settings className="mr-2 h-4 w-4" />
                Paramètres système
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tuteurs</CardTitle>
              <CardDescription>Gérer les tuteurs et leurs assignations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/admin/tuteurs")}>
                <Users className="mr-2 h-4 w-4" />
                Gérer les tuteurs
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
