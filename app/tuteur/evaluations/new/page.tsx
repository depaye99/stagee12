"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { User, ArrowRight, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Stagiaire {
  id: string
  entreprise?: string
  poste?: string
  specialite?: string
  statut: string
  user: {
    id: string
    name: string
    email: string
  }
}

export default function NewEvaluationPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
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

        const { data: profile } = await supabase.from("users").select("*").eq("id", session.user.id).single()

        if (!profile || profile.role !== "tuteur") {
          router.push("/auth/login")
          return
        }

        setUser(profile)
        await loadStagiaires()
      } catch (error) {
        console.error("💥 Erreur checkAuth:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const loadStagiaires = async () => {
    try {
      console.log("🔍 Chargement des stagiaires du tuteur...")

      const response = await fetch("/api/tuteur/stagiaires")

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        console.log("✅ Stagiaires chargés:", data.data?.length || 0)
        setStagiaires(data.data || [])
      } else {
        console.error("❌ Erreur API stagiaires:", data.error)
        toast({
          title: "Erreur",
          description: "Impossible de charger vos stagiaires",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("💥 Erreur lors du chargement des stagiaires:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des stagiaires",
        variant: "destructive",
      })
    }
  }

  const handleSelectStagiaire = (stagiaireId: string) => {
    router.push(`/tuteur/stagiaires/${stagiaireId}/evaluation`)
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

      <main className="flex-1 max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouvelle évaluation</h1>
          <p className="text-gray-600 dark:text-gray-400">Sélectionnez un stagiaire à évaluer</p>
        </div>

        {stagiaires.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun stagiaire assigné</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vous n'avez actuellement aucun stagiaire assigné pour créer une évaluation.
              </p>
              <Button onClick={() => router.push("/tuteur")} variant="outline">
                Retour au tableau de bord
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stagiaires.map((stagiaire) => (
              <Card key={stagiaire.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {stagiaire.user?.name || "Nom non défini"}
                  </CardTitle>
                  <CardDescription>{stagiaire.user?.email}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Entreprise: </span>
                      <span className="font-medium">{stagiaire.entreprise || "Non définie"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Poste: </span>
                      <span className="font-medium">{stagiaire.poste || "Non défini"}</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Spécialité: </span>
                      <span className="font-medium">{stagiaire.specialite || "Non définie"}</span>
                    </div>
                  </div>
                  <Button className="w-full" onClick={() => handleSelectStagiaire(stagiaire.id)}>
                    Créer une évaluation
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
