"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/layout/header"
import { ArrowLeft, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Stagiaire {
  id: string
  users: {
    name: string
    email: string
  }
  specialite: string
  niveau: string
}

export default function NewEvaluationPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [selectedStagiaire, setSelectedStagiaire] = useState<string>("")
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
          users!inner(name, email)
        `)
        .eq("tuteur_id", tuteurId)
        .eq("status", "actif")

      if (error) throw error
      setStagiaires(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des stagiaires:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des stagiaires",
        variant: "destructive",
      })
    }
  }

  const handleContinue = () => {
    if (!selectedStagiaire) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un stagiaire",
        variant: "destructive",
      })
      return
    }

    router.push(`/tuteur/stagiaires/${selectedStagiaire}/evaluation`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header user={user} />

      <main className="max-w-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouvelle évaluation</h1>
            <p className="text-gray-600 dark:text-gray-400">Sélectionnez le stagiaire à évaluer</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Sélection du stagiaire
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {stagiaires.length === 0 ? (
              <div className="text-center py-8">
                <User className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucun stagiaire assigné</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Vous n'avez aucun stagiaire assigné actuellement.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="stagiaire">Stagiaire à évaluer</Label>
                  <Select value={selectedStagiaire} onValueChange={setSelectedStagiaire}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un stagiaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {stagiaires.map((stagiaire) => (
                        <SelectItem key={stagiaire.id} value={stagiaire.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{stagiaire.users.name}</span>
                            <span className="text-sm text-gray-500">
                              {stagiaire.specialite} - {stagiaire.niveau}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedStagiaire && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    {(() => {
                      const stagiaire = stagiaires.find((s) => s.id === selectedStagiaire)
                      return stagiaire ? (
                        <div>
                          <h3 className="font-medium text-blue-900 dark:text-blue-100">{stagiaire.users.name}</h3>
                          <p className="text-sm text-blue-700 dark:text-blue-300">{stagiaire.users.email}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            {stagiaire.specialite} - {stagiaire.niveau}
                          </p>
                        </div>
                      ) : null
                    })()}
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <Button variant="outline" onClick={() => router.back()}>
                    Annuler
                  </Button>
                  <Button onClick={handleContinue} disabled={!selectedStagiaire}>
                    Continuer
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
