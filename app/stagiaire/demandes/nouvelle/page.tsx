"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function NouvelleDemandePage() {
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    type: "stage_academique",
    titre: "",
    description: "",
  })
  const [loading, setLoading] = useState(false)
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
    }

    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.type || !formData.titre) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      console.log("📤 Envoi de la demande:", formData)

      const response = await fetch("/api/stagiaire/demandes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()
      console.log("📥 Réponse API:", result)

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création")
      }

      toast({
        title: "Succès",
        description: "Demande créée avec succès",
      })

      // Redirection vers la liste des demandes
      router.push("/stagiaire/demandes")
    } catch (error) {
      console.error("❌ Erreur lors de la soumission:", error)
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de la soumission",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-sm text-gray-600 uppercase tracking-wide">NOUVELLE DEMANDE</div>
            <Button variant="outline" onClick={() => router.back()}>
              Retour
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-3xl p-12 shadow-sm border-2 border-gray-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center space-x-3 mb-6">
              <div className="relative">
                <div className="w-12 h-12 border-3 border-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-black">BRIDGE</div>
                <div className="text-sm text-blue-500 font-medium">Technologies</div>
                <div className="text-xs text-gray-600">Solutions</div>
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-12">NOUVELLE DEMANDE</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Type de demande */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Type de demande *</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger className="w-full h-12 rounded-lg border-2 border-gray-300">
                  <SelectValue />
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

            {/* Titre */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Titre de la demande *</Label>
              <Input
                value={formData.titre}
                onChange={(e) => handleInputChange("titre", e.target.value)}
                placeholder="Ex: Demande de stage en développement web"
                className="h-12 rounded-lg border-2 border-gray-300"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Décrivez votre demande en détail..."
                className="min-h-32 rounded-lg border-2 border-gray-300"
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <div className="text-center pt-8">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-full text-lg font-medium"
              >
                {loading ? "Envoi en cours..." : "Créer la demande"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
