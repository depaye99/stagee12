"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, ClipboardList, User, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StagiaireDashboard() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireInfo, setStagiaireInfo] = useState<any>(null)
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

      if (!profile) {
        router.push("/auth/login")
        return
      }

      setUser(profile)

      // Récupérer les informations du stagiaire
      const { data: stagiaire } = await supabase
        .from("stagiaires")
        .select("*, tuteur:users!tuteur_id(*)")
        .eq("user_id", profile.id)
        .single()

      setStagiaireInfo(stagiaire)
      await loadStats(profile.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadStats = async (userId: string) => {
    try {
      const [demandesCount, documentsCount, evaluationsCount] = await Promise.all([
        supabase
          .from("demandes")
          .select("id", { count: "exact", head: true })
          .eq("stagiaire_id", stagiaireInfo?.id || ""),
        supabase.from("documents").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase
          .from("evaluations")
          .select("id", { count: "exact", head: true })
          .eq("stagiaire_id", stagiaireInfo?.id || ""),
      ])

      setStats({
        demandes_total: demandesCount.count || 0,
        documents_total: documentsCount.count || 0,
        evaluations_total: evaluationsCount.count || 0,
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon espace stagiaire</h1>
          <p className="text-gray-600">Bienvenue, {user?.name}</p>
        </div>

        {/* Informations du stage */}
        {stagiaireInfo && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informations de stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Entreprise</p>
                  <p className="font-medium">{stagiaireInfo.entreprise || "Non définie"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Poste</p>
                  <p className="font-medium">{stagiaireInfo.poste || "Non défini"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tuteur</p>
                  <p className="font-medium">{stagiaireInfo.tuteur?.name || "Non assigné"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Statut</p>
                  <Badge variant={stagiaireInfo.statut === "actif" ? "default" : "secondary"}>
                    {stagiaireInfo.statut}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes demandes</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.demandes_total || 0}</div>
              <p className="text-xs text-muted-foreground">Demandes soumises</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.documents_total || 0}</div>
              <p className="text-xs text-muted-foreground">Documents uploadés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.evaluations_total || 0}</div>
              <p className="text-xs text-muted-foreground">Évaluations reçues</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Nouvelle demande</CardTitle>
              <CardDescription>Soumettre une nouvelle demande</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/demandes/nouvelle")}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une demande
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes demandes</CardTitle>
              <CardDescription>Consulter le statut de mes demandes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/demandes")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir mes demandes
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mes documents</CardTitle>
              <CardDescription>Gérer mes documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/documents")}>
                <FileText className="mr-2 h-4 w-4" />
                Mes documents
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mon profil</CardTitle>
              <CardDescription>Mettre à jour mes informations</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/stagiaire/profil")}>
                <User className="mr-2 h-4 w-4" />
                Modifier mon profil
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
