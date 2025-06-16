"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/layout/header"
import { ArrowLeft, Save } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface DemandeFormData {
  type: string
  titre: string
  description: string
}

export default function NouvelleDemandePage() {
  const [user, setUser] = useState<any>(null)
  const [stagiaireInfo, setStagiaireInfo] = useState<any>(null)
  const [formData, setFormData] = useState<DemandeFormData>({
    type: "",
    titre: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
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
      if (!profile) {
        router.push("/auth/login")
        return
      }

      setUser(profile)

      // Récupérer les informations du stagiaire
      const { data: stagiaire } = await supabase.from("stagiaires").select("*").eq("user_id", profile.id).single()

      setStagiaireInfo(stagiaire)
    }

    checkAuth()
  }, [router, supabase])

  const handleInputChange = (field: keyof DemandeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.type || !formData.titre) {
      setError("Veuillez remplir tous les champs obligatoires")
      setLoading(false)
      return
    }

    if (!stagiaireInfo) {
      setError("Profil de stagiaire non trouvé")
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from("demandes")
        .insert([
          {
            stagiaire_id: stagiaireInfo.id,
            tuteur_id: stagiaireInfo.tuteur_id,
            type: formData.type,
            titre: formData.titre,
            description: formData.description,
            statut: "en_attente",
          },
        ])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Succès",
        description: "Demande créée avec succès",
      })

      router.push("/stagiaire/demandes")
    } catch (error) {
      console.error("Erreur lors de la création:", error)
      setError(error instanceof Error ? error.message : "Erreur lors de la création")
    } finally {
      setLoading(false)
    }
  }

  if (!stagiaireInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-600">
                Vous devez d'abord compléter votre profil de stagiaire pour pouvoir faire des demandes.
              </p>
              <Button className="mt-4" onClick={() => router.push("/stagiaire/profil")}>
                Compléter mon profil
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle demande</h1>
          <p className="text-gray-600">Créer une nouvelle demande</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informations de la demande</CardTitle>
            <CardDescription>Remplissez les informations pour créer votre demande</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="type">Type de demande *</Label>
                <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type de demande" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage_academique">Stage académique</SelectItem>
                    <SelectItem value="stage_professionnel">Stage professionnel</SelectItem>
                    <SelectItem value="conge">Demande de congé</SelectItem>
                    <SelectItem value="prolongation">Prolongation de stage</SelectItem>
                    <SelectItem value="attestation">Demande d'attestation</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="titre">Titre de la demande *</Label>
                <Input
                  id="titre"
                  value={formData.titre}
                  onChange={(e) => handleInputChange("titre", e.target.value)}
                  placeholder="Ex: Demande de validation de stage"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Décrivez votre demande en détail..."
                  rows={6}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    "Création..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Créer la demande
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
