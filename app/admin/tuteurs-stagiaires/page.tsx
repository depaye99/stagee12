"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { useToast } from "@/hooks/use-toast"
import { Users, UserCheck, ArrowRight, Save, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Stagiaire {
  id: string
  user_id: string
  tuteur_id?: string
  entreprise?: string
  poste?: string
  statut: string
  user?: {
    name: string
    email: string
  }
  tuteur?: {
    name: string
    email: string
  }
}

interface Tuteur {
  id: string
  name: string
  email: string
}

export default function TuteursStagiairesPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [tuteurs, setTuteurs] = useState<Tuteur[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [assignments, setAssignments] = useState<{ [key: string]: string }>({})
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
      if (!profile || profile.role !== "admin") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadData()
      setLoading(false)
    }

    checkAuth()
  }, [])

  const loadData = async () => {
    try {
      // Charger les stagiaires
      const { data: stagiairesData, error: stagiairesError } = await supabase
        .from("stagiaires")
        .select(`
          *,
          user:users!user_id(name, email),
          tuteur:users!tuteur_id(name, email)
        `)
        .order("created_at", { ascending: false })

      if (stagiairesError) throw stagiairesError

      // Charger les tuteurs
      const { data: tuteursData, error: tuteursError } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "tuteur")
        .eq("is_active", true)
        .order("name")

      if (tuteursError) throw tuteursError

      setStagiaires(stagiairesData || [])
      setTuteurs(tuteursData || [])

      // Initialiser les assignments avec les tuteurs actuels
      const currentAssignments: { [key: string]: string } = {}
      stagiairesData?.forEach((stagiaire) => {
        if (stagiaire.tuteur_id) {
          currentAssignments[stagiaire.id] = stagiaire.tuteur_id
        }
      })
      setAssignments(currentAssignments)
    } catch (error) {
      console.error("Erreur lors du chargement:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    }
  }

  const handleAssignmentChange = (stagiaireId: string, tuteurId: string) => {
    setAssignments((prev) => ({
      ...prev,
      [stagiaireId]: tuteurId === "none" ? "" : tuteurId,
    }))
  }

  const saveAssignments = async () => {
    setSaving(true)
    try {
      const updates = Object.entries(assignments).map(([stagiaireId, tuteurId]) => ({
        id: stagiaireId,
        tuteur_id: tuteurId || null,
      }))

      for (const update of updates) {
        const { error } = await supabase.from("stagiaires").update({ tuteur_id: update.tuteur_id }).eq("id", update.id)

        if (error) throw error
      }

      toast({
        title: "Succès",
        description: "Attributions sauvegardées avec succès",
      })

      await loadData() // Recharger les données
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les attributions",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getAssignmentStats = () => {
    const assigned = stagiaires.filter((s) => s.tuteur_id).length
    const unassigned = stagiaires.length - assigned
    return { assigned, unassigned, total: stagiaires.length }
  }

  const stats = getAssignmentStats()

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
          <h1 className="text-3xl font-bold text-gray-900">Attribution Tuteurs - Stagiaires</h1>
          <p className="text-gray-600">Gérer l'attribution des tuteurs aux stagiaires</p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total stagiaires</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avec tuteur</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Sans tuteur</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.unassigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <UserCheck className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tuteurs disponibles</p>
                  <p className="text-2xl font-bold text-gray-900">{tuteurs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="mb-6 flex gap-4">
          <Button onClick={saveAssignments} disabled={saving}>
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Sauvegarder les attributions
              </>
            )}
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualiser
          </Button>
        </div>

        {/* Tableau d'attribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowRight className="h-5 w-5" />
              Attribution des tuteurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Tuteur actuel</TableHead>
                  <TableHead>Nouveau tuteur</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stagiaires.map((stagiaire) => (
                  <TableRow key={stagiaire.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stagiaire.user?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{stagiaire.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{stagiaire.entreprise || "-"}</TableCell>
                    <TableCell>{stagiaire.poste || "-"}</TableCell>
                    <TableCell>
                      {stagiaire.tuteur ? (
                        <div>
                          <div className="font-medium">{stagiaire.tuteur.name}</div>
                          <div className="text-sm text-gray-500">{stagiaire.tuteur.email}</div>
                        </div>
                      ) : (
                        <Badge variant="secondary">Non assigné</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={assignments[stagiaire.id] || "none"}
                        onValueChange={(value) => handleAssignmentChange(stagiaire.id, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un tuteur" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Aucun tuteur</SelectItem>
                          {tuteurs.map((tuteur) => (
                            <SelectItem key={tuteur.id} value={tuteur.id}>
                              {tuteur.name} ({tuteur.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          stagiaire.statut === "actif"
                            ? "bg-green-100 text-green-800"
                            : stagiaire.statut === "termine"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                        }
                      >
                        {stagiaire.statut}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
