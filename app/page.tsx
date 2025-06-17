"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, Calendar, TrendingUp, ArrowRight, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Stats {
  stagiaires_total: number
  demandes_total: number
  documents_total: number
  evaluations_total: number
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          // Récupérer les informations utilisateur complètes
          const { data: userData } = await supabase.from("users").select("*").eq("id", session.user.id).single()

          if (userData) {
            setUser(userData)

            // Rediriger vers le dashboard approprié
            switch (userData.role) {
              case "admin":
                router.push("/admin")
                return
              case "rh":
                router.push("/rh")
                return
              case "tuteur":
                router.push("/tuteur")
                return
              case "stagiaire":
                router.push("/stagiaire")
                return
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/statistics")
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error("Erreur lors du chargement des statistiques:", error)
      }
    }

    checkUser()
    fetchStats()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">StageManager</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">Se connecter</Button>
              </Link>
              <Link href="/auth/register">
                <Button>S'inscrire</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
              Gestion de stages
              <span className="text-blue-600"> simplifiée</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Plateforme complète pour la gestion des stages, des demandes aux évaluations. Simplifiez vos processus
              administratifs.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <Link href="/auth/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="/auth/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Se connecter
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Fonctionnalités principales</h2>
            <p className="mt-4 text-lg text-gray-600">
              Tout ce dont vous avez besoin pour gérer efficacement vos stages
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-blue-600" />
                <CardTitle>Gestion des stagiaires</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Suivi complet des stagiaires, de leur inscription à leur évaluation finale.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 text-green-600" />
                <CardTitle>Demandes automatisées</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Processus de demande simplifié avec validation automatique et notifications.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-purple-600" />
                <CardTitle>Planning intégré</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Gestion des plannings de stage et coordination entre tuteurs et stagiaires.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-8 w-8 text-orange-600" />
                <CardTitle>Rapports détaillés</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Analyses et rapports complets pour un suivi optimal des performances.</CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900">Statistiques de la plateforme</h2>
            </div>

            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600">{stats.stagiaires_total}</div>
                <div className="mt-2 text-lg text-gray-600">Stagiaires</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600">{stats.demandes_total}</div>
                <div className="mt-2 text-lg text-gray-600">Demandes traitées</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-purple-600">{stats.documents_total}</div>
                <div className="mt-2 text-lg text-gray-600">Documents gérés</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-orange-600">{stats.evaluations_total}</div>
                <div className="mt-2 text-lg text-gray-600">Évaluations</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Pourquoi choisir StageManager ?</h2>
              <p className="mt-4 text-lg text-gray-600">
                Notre plateforme offre une solution complète et intuitive pour la gestion de vos stages.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Interface intuitive</h3>
                    <p className="text-gray-600">Design moderne et facile à utiliser pour tous les utilisateurs.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Automatisation complète</h3>
                    <p className="text-gray-600">Processus automatisés pour réduire la charge administrative.</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">Sécurité renforcée</h3>
                    <p className="text-gray-600">Protection des données avec les dernières technologies de sécurité.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 lg:mt-0">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-white">
                <h3 className="text-2xl font-bold">Prêt à commencer ?</h3>
                <p className="mt-4">
                  Rejoignez les nombreuses organisations qui font confiance à StageManager pour la gestion de leurs
                  stages.
                </p>
                <div className="mt-6">
                  <Link href="/auth/register">
                    <Button size="lg" variant="secondary">
                      Créer un compte gratuit
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white">StageManager</h3>
            <p className="mt-4 text-gray-400">Plateforme de gestion de stages moderne et efficace</p>
            <div className="mt-8 flex justify-center space-x-6">
              <Badge variant="secondary">Version 1.0</Badge>
              <Badge variant="secondary">Sécurisé</Badge>
              <Badge variant="secondary">Support 24/7</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
