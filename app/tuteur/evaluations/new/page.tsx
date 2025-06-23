
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
import { ClipboardList, Save, ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface Stagiaire {
  id: string
  user_id: string
  users?: {
    name: string
    email: string
  }
}

export default function NewEvaluationPage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaires, setStagiaires] = useState<Stagiaire[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    stagiaire_id: "",
    type: "",
    periode: "",
    date_evaluation: "",
    note_globale: "",
    competences_techniques: "",
    competences_relationnelles: "",
    autonomie: "",
    initiative: "",
    ponctualite: "",
    points_forts: "",
    points_amelioration: "",
    commentaires: "",
    recommandations: "",
    objectifs_suivants: "",
    duree_evaluation: "",
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
          id,
          user_id,
          users!user_id(name, email)
        `)
        .eq("tuteur_id", tuteurId)
        .eq("statut", "actif")

      if (error) throw error
      setStagiaires(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des stagiaires:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les stagiaires",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validation
      if (!formData.stagiaire_id || !formData.type || !formData.date_evaluation) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires",
          variant: "destructive",
        })
        setSaving(false)
        return
      }

      // Créer l'évaluation
      const evaluationData = {
        stagiaire_id: formData.stagiaire_id,
        evaluateur_id: user.id,
        type: formData.type,
        periode: formData.periode || null,
        date_evaluation: formData.date_evaluation,
        note_globale: formData.note_globale ? parseFloat(formData.note_globale) : null,
        competences_techniques: formData.competences_techniques ? parseFloat(formData.competences_techniques) : null,
        competences_relationnelles: formData.competences_relationnelles ? parseFloat(formData.competences_relationnelles) : null,
        autonomie: formData.autonomie ? parseFloat(formData.autonomie) : null,
        initiative: formData.initiative ? parseFloat(formData.initiative) : null,
        ponctualite: formData.ponctualite ? parseFloat(formData.ponctualite) : null,
        points_forts: formData.points_forts || null,
        points_amelioration: formData.points_amelioration || null,
        commentaires: formData.commentaires || null,
        recommandations: formData.recommandations || null,
        objectifs_suivants: formData.objectifs_suivants || null,
        duree_evaluation: formData.duree_evaluation ? parseInt(formData.duree_evaluation) : null,
      }

      const { data: evaluation, error } = await supabase
        .from("evaluations")
        .insert(evaluationData)
        .select()
        .single()

      if (error) throw error

      // Créer une notification pour le stagiaire
      const stagiaire = stagiaires.find(s => s.id === formData.stagiaire_id)
      if (stagiaire) {
        await supabase.from("notifications").insert({
          user_id: stagiaire.user_id,
          titre: "Nouvelle évaluation disponible",
          message: `Votre évaluation ${getTypeLabel(formData.type)} a été complétée par votre tuteur. Consultez vos résultats et recommandations.`,
          type: "info",
          related_type: "evaluation",
          related_id: evaluation.id,
          action_url: `/stagiaire/evaluations/${evaluation.id}`,
          action_label: "Voir l'évaluation",
          priority: "normal",
          category: "evaluation",
        })
      }

      toast({
        title: "Succès",
        description: "Évaluation créée avec succès",
      })

      router.push("/tuteur/evaluations")
    } catch (error) {
      console.error("Erreur lors de la création de l'évaluation:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'évaluation",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "mi_parcours":
        return "mi-parcours"
      case "finale":
        return "finale"
      case "mensuelle":
        return "mensuelle"
      case "projet":
        return "de projet"
      default:
        return type
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
          <Button
            variant="outline"
            onClick={() => router.push("/tuteur/evaluations")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux évaluations
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle évaluation</h1>
          <p className="text-gray-600">Créer une évaluation pour un stagiaire</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Formulaire d'évaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informations générales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="stagiaire_id">Stagiaire *</Label>
                  <Select
                    value={formData.stagiaire_id}
                    onValueChange={(value) => setFormData({ ...formData, stagiaire_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un stagiaire" />
                    </SelectTrigger>
                    <SelectContent>
                      {stagiaires.map((stagiaire) => (
                        <SelectItem key={stagiaire.id} value={stagiaire.id}>
                          {stagiaire.users?.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="type">Type d'évaluation *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mensuelle">Mensuelle</SelectItem>
                      <SelectItem value="mi_parcours">Mi-parcours</SelectItem>
                      <SelectItem value="finale">Finale</SelectItem>
                      <SelectItem value="projet">Projet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="periode">Période</Label>
                  <Input
                    id="periode"
                    type="text"
                    value={formData.periode}
                    onChange={(e) => setFormData({ ...formData, periode: e.target.value })}
                    placeholder="Ex: Janvier 2024, Semaine 1-4"
                  />
                </div>

                <div>
                  <Label htmlFor="date_evaluation">Date d'évaluation *</Label>
                  <Input
                    id="date_evaluation"
                    type="date"
                    value={formData.date_evaluation}
                    onChange={(e) => setFormData({ ...formData, date_evaluation: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="duree_evaluation">Durée (minutes)</Label>
                  <Input
                    id="duree_evaluation"
                    type="number"
                    value={formData.duree_evaluation}
                    onChange={(e) => setFormData({ ...formData, duree_evaluation: e.target.value })}
                    placeholder="60"
                    min="1"
                    max="300"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Notes (sur 20)</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="note_globale">Note globale</Label>
                    <Input
                      id="note_globale"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formData.note_globale}
                      onChange={(e) => setFormData({ ...formData, note_globale: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="competences_techniques">Compétences techniques</Label>
                    <Input
                      id="competences_techniques"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formData.competences_techniques}
                      onChange={(e) => setFormData({ ...formData, competences_techniques: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="competences_relationnelles">Compétences relationnelles</Label>
                    <Input
                      id="competences_relationnelles"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formData.competences_relationnelles}
                      onChange={(e) => setFormData({ ...formData, competences_relationnelles: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="autonomie">Autonomie</Label>
                    <Input
                      id="autonomie"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formData.autonomie}
                      onChange={(e) => setFormData({ ...formData, autonomie: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="initiative">Initiative</Label>
                    <Input
                      id="initiative"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formData.initiative}
                      onChange={(e) => setFormData({ ...formData, initiative: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="ponctualite">Ponctualité</Label>
                    <Input
                      id="ponctualite"
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formData.ponctualite}
                      onChange={(e) => setFormData({ ...formData, ponctualite: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Commentaires */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Évaluations qualitatives</h3>
                <div>
                  <Label htmlFor="points_forts">Points forts</Label>
                  <Textarea
                    id="points_forts"
                    value={formData.points_forts}
                    onChange={(e) => setFormData({ ...formData, points_forts: e.target.value })}
                    placeholder="Décrivez les points forts du stagiaire..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="points_amelioration">Points d'amélioration</Label>
                  <Textarea
                    id="points_amelioration"
                    value={formData.points_amelioration}
                    onChange={(e) => setFormData({ ...formData, points_amelioration: e.target.value })}
                    placeholder="Décrivez les points à améliorer..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="commentaires">Commentaires généraux</Label>
                  <Textarea
                    id="commentaires"
                    value={formData.commentaires}
                    onChange={(e) => setFormData({ ...formData, commentaires: e.target.value })}
                    placeholder="Commentaires généraux sur la performance..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="recommandations">Recommandations</Label>
                  <Textarea
                    id="recommandations"
                    value={formData.recommandations}
                    onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                    placeholder="Recommandations pour la suite..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="objectifs_suivants">Objectifs suivants</Label>
                  <Textarea
                    id="objectifs_suivants"
                    value={formData.objectifs_suivants}
                    onChange={(e) => setFormData({ ...formData, objectifs_suivants: e.target.value })}
                    placeholder="Objectifs à atteindre pour la prochaine période..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={saving}>
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Enregistrement..." : "Enregistrer l'évaluation"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/tuteur/evaluations")}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
