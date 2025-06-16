"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/layout/header"
import { User, Save, Building, Calendar } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function StagiaireProfilPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireData, setStagiaireData] = useState<any>(null)
  const [tuteurs, setTuteurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    entreprise: "",
    poste: "",
    date_debut: "",
    date_fin: "",
    tuteur_id: "",
    notes: "",
  })
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
      if (!profile || profile.role !== "stagiaire") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadTuteurs()
      await loadStagiaireData(profile.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadTuteurs = async () => {
    try {
      const { data, error } = await supabase.from("users").select("id, name").eq("role", "tuteur").eq("is_active", true)

      if (error) throw error
      setTuteurs(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des tuteurs:", error)
    }
  }

  const loadStagiaireData = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("stagiaires").select("*").eq("user_id", userId).single()

      if (data) {
        setStagiaireData(data)
        setFormData({
          entreprise: data.entreprise || "",
          poste: data.poste || "",
          date_debut: data.date_debut || "",
          date_fin: data.date_fin || "",
          tuteur_id: data.tuteur_id || "",
          notes: data.notes || "",
        })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des données stagiaire:", error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (stagiaireData) {
        // Mettre à jour
        const { error } = await supabase.from("stagiaires").update(formData).eq("id", stagiaireData.id)
        if (error) throw error
      } else {
        // Créer
        const { error } = await supabase.from("stagiaires").insert([{ ...formData, user_id: user.id, statut: "actif" }])
        if (error) throw error
      }

      toast({
        title: "Succès",
        description: "Profil de stagiaire mis à jour avec succès",
      })

      // Recharger les données
      await loadStagiaireData(user.id)
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compléter mon profil de stagiaire</h1>
          <p className="text-gray-600">Renseignez vos informations de stage</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informations de stage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="entreprise">
                  <Building className="h-4 w-4 inline mr-2" />
                  Entreprise *
                </Label>
                <Input
                  id="entreprise"
                  value={formData.entreprise}
                  onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
                  placeholder="Nom de l'entreprise"
                  required
                />
              </div>
              <div>
                <Label htmlFor="poste">Poste *</Label>
                <Input
                  id="poste"
                  value={formData.poste}
                  onChange={(e) => setFormData({ ...formData, poste: e.target.value })}
                  placeholder="Intitulé du poste"
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_debut">
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Date de début *
                </Label>
                <Input
                  id="date_debut"
                  type="date"
                  value={formData.date_debut}
                  onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="date_fin">Date de fin *</Label>
                <Input
                  id="date_fin"
                  type="date"
                  value={formData.date_fin}
                  onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="tuteur_id">Tuteur</Label>
                <Select
                  value={formData.tuteur_id}
                  onValueChange={(value) => setFormData({ ...formData, tuteur_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un tuteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {tuteurs.map((tuteur) => (
                      <SelectItem key={tuteur.id} value={tuteur.id}>
                        {tuteur.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="notes">Notes / Objectifs</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Objectifs du stage, missions principales..."
                  rows={4}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer"}
              </Button>
              <Button variant="outline" onClick={() => router.push("/stagiaire")}>
                Retour au tableau de bord
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
