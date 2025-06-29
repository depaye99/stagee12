"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/layout/header"
import { ArrowLeft, FileText, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  name: string
  email: string
  role: string
}

export default function NouvelleDemandePage() {
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    type: "",
    sujet: "",
    description: "",
    priorite: "normale",
    domaine: ""
  })
  const [documents, setDocuments] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
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

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (!profile || profile.role !== "stagiaire") {
          router.push("/")
          return
        }

        setUser(profile)
      } catch (error) {
        console.error("Erreur d'authentification:", error)
        router.push("/auth/login")
      } finally {
        setPageLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.type || !formData.sujet || !formData.description) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Créer la demande
      const response = await fetch("/api/stagiaire/demandes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error)
      }

      // Upload des documents si présents
      if (documents.length > 0) {
        for (const file of documents) {
          const formData = new FormData()
          formData.append("file", file)
          formData.append("demande_id", data.data.id)
          formData.append("type", "demande_document")

          await fetch("/api/documents/upload", {
            method: "POST",
            body: formData,
          })
        }
      }

      toast({
        title: "Succès",
        description: "Votre demande a été créée avec succès. Vous recevrez une notification par email lors du traitement.",
      })

      router.push("/stagiaire/demandes")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Impossible de créer la demande",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files))
    }
  }

  if (pageLoading) {
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
        <div className="mb-6 flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvelle demande</h1>
            <p className="text-gray-600">Créer une nouvelle demande de stage</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de la demande
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Type de demande *</Label>
                  <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stage_initiation">Stage d'initiation</SelectItem>
                      <SelectItem value="stage_perfectionnement">Stage de perfectionnement</SelectItem>
                      <SelectItem value="stage_fin_etudes">Stage de fin d'études</SelectItem>
                      <SelectItem value="stage_professionnel">Stage professionnel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priorite">Priorité</Label>
                  <Select value={formData.priorite} onValueChange={(value) => handleInputChange("priorite", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basse">Basse</SelectItem>
                      <SelectItem value="normale">Normale</SelectItem>
                      <SelectItem value="haute">Haute</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sujet">Sujet de la demande *</Label>
                <Input
                  id="sujet"
                  value={formData.sujet}
                  onChange={(e) => handleInputChange("sujet", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domaine">Domaine de stage</Label>
                <Input
                  id="domaine"
                  value={formData.domaine}
                  onChange={(e) => handleInputChange("domaine", e.target.value)}
                  placeholder="Ex: Développement web, Marketing, Finance..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description détaillée *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={5}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="documents">Documents joints</Label>
                <Input
                  id="documents"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-gray-500">
                  Formats acceptés: PDF, DOC, DOCX, JPG, PNG (max 5 fichiers)
                </p>
                {documents.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium">Fichiers sélectionnés:</p>
                    <ul className="text-sm text-gray-600">
                      {documents.map((file, index) => (
                        <li key={index}>• {file.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Création..." : "Créer la demande"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}