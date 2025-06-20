"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { UserCheck, Search, Users, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface StagiaireWithUser {
  id: string
  user_id: string
  tuteur_id?: string
  entreprise?: string
  poste?: string
  statut: string
  users?: {
    name: string
    email: string
  }
  tuteur?: {
    name: string
    email: string
  }
}

interface TuteurWithUser {
  id: string
  user_id: string
  specialite?: string
  max_stagiaires: number
  users?: {
    name: string
    email: string
    department?: string
  }
  stagiaires_count?: number
}

export default function AssignerStagiairePage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<StagiaireWithUser[]>([])
  const [tuteurs, setTuteurs] = useState<TuteurWithUser[]>([])
  const [filteredStagiaires, setFilteredStagiaires] = useState<StagiaireWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTuteur, setSelectedTuteur] = useState("")
  const [selectedStagiaires, setSelectedStagiaires] = useState<string[]>([])
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
      if (!profile || !["rh", "admin"].includes(profile.role)) {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadData()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadData = async () => {
    try {
      // Charger les stagiaires sans tuteur ou avec tuteur existant
      const { data: stagiaireData, error: stagiaireError } = await supabase
        .from("stagiaires")
        .select(`
          *,
          users!user_id(name, email),
          tuteur:users!tuteur_id(name, email)
        `)
        .eq("statut", "actif")
        .order("created_at", { ascending: false })

      if (stagiaireError) throw stagiaireError

      // Charger les tuteurs avec leur nombre de stagiaires actuel
      const { data: tuteurData, error: tuteurError } = await supabase
        .from("tuteurs")
        .select(`
          *,
          users!user_id(name, email, department)
        `)
        .order("created_at", { ascending: false })

      if (tuteurError) throw tuteurError

      // Calculer le nombre de stagiaires par tuteur
      const tuteursWithCount = await Promise.all(
        (tuteurData || []).map(async (tuteur) => {
          const { count } = await supabase
            .from("stagiaires")
            .select("*", { count: "exact", head: true })
            .eq("tuteur_id", tuteur.user_id)
            .eq("statut", "actif")

          return {
            ...tuteur,
            stagiaires_count: count || 0,
          }
        })
      )

      setStagiaires(stagiaireData || [])
      setFilteredStagiaires(stagiaireData || [])
      setTuteurs(tuteursWithCount)
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let filtered = stagiaires

    if (searchQuery) {
      filtered = filtered.filter(
        (stagiaire) =>
          stagiaire.users?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stagiaire.users?.email.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredStagiaires(filtered)
  }, [stagiaires, searchQuery])

  const handleStagiaireSelection = (stagiaireId: string) => {
    setSelectedStagiaires((prev) =>
      prev.includes(stagiaireId) ? prev.filter((id) => id !== stagiaireId) : [...prev, stagiaireId],
    )
  }

  const handleAssignTuteur = async () => {
    if (!selectedTuteur || selectedStagiaires.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un tuteur et au moins un stagiaire",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Vérifier la capacité du tuteur
      const tuteur = tuteurs.find((t) => t.user_id === selectedTuteur)
      if (tuteur && (tuteur.stagiaires_count || 0) + selectedStagiaires.length > tuteur.max_stagiaires) {
        toast({
          title: "Erreur",
          description: `Le tuteur ne peut pas prendre plus de ${tuteur.max_stagiaires} stagiaires`,
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Mettre à jour les stagiaires sélectionnés
      const { error } = await supabase
        .from("stagiaires")
        .update({ tuteur_id: selectedTuteur, updated_at: new Date().toISOString() })
        .in("id", selectedStagiaires)

      if (error) throw error

      toast({
        title: "Succès",
        description: `${selectedStagiaires.length} stagiaire(s) assigné(s) avec succès`,
      })

      // Recharger les données
      await loadData()
      setSelectedStagiaires([])
      setSelectedTuteur("")
    } catch (error) {
      console.error("Erreur lors de l'assignation:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de l'assignation du tuteur",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getTuteurCapacity = (tuteur: TuteurWithUser) => {
    const current = tuteur.stagiaires_count || 0
    const max = tuteur.max_stagiaires
    const available = max - current
    return { current, max, available }
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
        <div className="mb-8 flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/rh/stagiaires")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Assigner un tuteur</h1>
            <p className="text-gray-600">Attribuer des stagiaires à leurs tuteurs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sélection du tuteur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Sélectionner un tuteur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="tuteur">Tuteur</Label>
                <Select value={selectedTuteur} onValueChange={setSelectedTuteur}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un tuteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {tuteurs.map((tuteur) => {
                      const capacity = getTuteurCapacity(tuteur)
                      return (
                        <SelectItem
                          key={tuteur.user_id}
                          value={tuteur.user_id}
                          disabled={capacity.available <= 0}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span>{tuteur.users?.name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              ({capacity.current}/{capacity.max})
                            </span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedTuteur && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  {(() => {
                    const tuteur = tuteurs.find((t) => t.user_id === selectedTuteur)
                    if (!tuteur) return null
                    const capacity = getTuteurCapacity(tuteur)
                    return (
                      <div>
                        <p className="font-medium">{tuteur.users?.name}</p>
                        <p className="text-sm text-gray-600">{tuteur.users?.email}</p>
                        <p className="text-sm text-gray-600">Spécialité: {tuteur.specialite || "Non définie"}</p>
                        <p className="text-sm text-gray-600">
                          Capacité: {capacity.current}/{capacity.max} stagiaires
                        </p>
                        <p className="text-sm text-green-600">
                          Places disponibles: {capacity.available}
                        </p>
                      </div>
                    )
                  })()}
                </div>
              )}

              <Button 
                onClick={handleAssignTuteur} 
                disabled={!selectedTuteur || selectedStagiaires.length === 0 || saving}
                className="w-full"
              >
                {saving ? "Attribution en cours..." : `Assigner ${selectedStagiaires.length} stagiaire(s)`}
              </Button>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {stagiaires.filter((s) => !s.tuteur_id).length}
                  </p>
                  <p className="text-sm text-gray-600">Sans tuteur</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {stagiaires.filter((s) => s.tuteur_id).length}
                  </p>
                  <p className="text-sm text-gray-600">Avec tuteur</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{tuteurs.length}</p>
                  <p className="text-sm text-gray-600">Tuteurs disponibles</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{selectedStagiaires.length}</p>
                  <p className="text-sm text-gray-600">Sélectionnés</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Liste des stagiaires */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Stagiaires actifs ({filteredStagiaires.length})
            </CardTitle>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedStagiaires.length === filteredStagiaires.length && filteredStagiaires.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStagiaires(filteredStagiaires.map((s) => s.id))
                        } else {
                          setSelectedStagiaires([])
                        }
                      }}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Tuteur actuel</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStagiaires.map((stagiaire) => (
                  <TableRow key={stagiaire.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedStagiaires.includes(stagiaire.id)}
                        onChange={() => handleStagiaireSelection(stagiaire.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stagiaire.users?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{stagiaire.users?.email}</div>
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
                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                          Non assigné
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">{stagiaire.statut}</Badge>
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
