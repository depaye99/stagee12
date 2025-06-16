"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"

export default function NouvelleDemandePage() {
  const [user, setUser] = useState<any>(null)
  const [demandType, setDemandType] = useState("stage_professionnel")
  const [documents, setDocuments] = useState({
    cv: null,
    certificat_scolarite: null,
    lettre_motivation: null,
    lettre_recommandation: null,
    dernier_diplome: null,
    document_supplementaire: null,
    piece_identite: null,
    plan_localisation: null,
  })
  const [periode, setPeriode] = useState({
    jours: "",
    mois: "",
    annee: "",
    duree_mois: "6 mois",
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

  const handleFileUpload = (documentType: string, file: File) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      // Logique de soumission
      toast({
        title: "Succès",
        description: "Demande soumise avec succès",
      })
      router.push("/stagiaire/demandes")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la soumission",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-sm text-gray-600">FORMULAIRE DE DEMANDE PROFESSIONNEL</div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white rounded-3xl p-8 shadow-sm border">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-3xl font-bold mb-2">
              <span className="text-black">BRIDGE</span>
              <div className="text-lg text-blue-500 -mt-1">Technologies</div>
              <div className="text-sm text-blue-400 -mt-1">Solutions</div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center mb-8">FORMULAIRE DE DEMANDE DE STAGE</h1>

          {/* Type de demande */}
          <div className="flex items-center justify-center mb-12">
            <Label className="text-lg font-medium mr-4">Types de demande</Label>
            <Select value={demandType} onValueChange={setDemandType}>
              <SelectTrigger className="w-64 h-12 rounded-full border-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stage_professionnel">Stage professionnel</SelectItem>
                <SelectItem value="stage_academique">Stage académique</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* CV */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">CV</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("cv", e.target.files[0])}
                  className="hidden"
                  id="cv-upload"
                />
                <label htmlFor="cv-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposer votre cv ici</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Certificat de scolarité */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Certificat de scolarité</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("certificat_scolarite", e.target.files[0])}
                  className="hidden"
                  id="certificat-upload"
                />
                <label htmlFor="certificat-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposer votre Lettre de motivation ici</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Lettre de motivation */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Lettre de motivation</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("lettre_motivation", e.target.files[0])}
                  className="hidden"
                  id="motivation-upload"
                />
                <label htmlFor="motivation-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposer votre Lettre de motivation ici</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Lettre de recommandation */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Lettre de recommandation</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("lettre_recommandation", e.target.files[0])}
                  className="hidden"
                  id="recommandation-upload"
                />
                <label htmlFor="recommandation-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposer votre Lettre de recommandation ici</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Dernier diplôme */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Dernier diplôme</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("dernier_diplome", e.target.files[0])}
                  className="hidden"
                  id="diplome-upload"
                />
                <label htmlFor="diplome-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposez votre diplôme ici</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Document supplémentaire */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Document supplémentaire</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileUpload("document_supplementaire", e.target.files[0])
                  }
                  className="hidden"
                  id="supplementaire-upload"
                />
                <label htmlFor="supplementaire-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Facultatif</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Pièce d'identité */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Pièce d'identité</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("piece_identite", e.target.files[0])}
                  className="hidden"
                  id="identite-upload"
                />
                <label htmlFor="identite-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposer votre ici</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>

            {/* Plan de localisation */}
            <div>
              <Label className="text-lg font-semibold mb-4 block">Plan de localisation</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload("plan_localisation", e.target.files[0])}
                  className="hidden"
                  id="plan-upload"
                />
                <label htmlFor="plan-upload" className="cursor-pointer">
                  <div className="text-gray-500 mb-2">Déposer votre plan de location</div>
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                </label>
              </div>
            </div>
          </div>

          {/* Période */}
          <div className="flex items-center justify-center space-x-4 mb-12">
            <Select value={periode.jours} onValueChange={(value) => setPeriode({ ...periode, jours: value })}>
              <SelectTrigger className="w-32 h-12 rounded-full">
                <SelectValue placeholder="Jours" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 31 }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>
                    {i + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periode.mois} onValueChange={(value) => setPeriode({ ...periode, mois: value })}>
              <SelectTrigger className="w-32 h-12 rounded-full">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Janvier</SelectItem>
                <SelectItem value="2">Février</SelectItem>
                <SelectItem value="3">Mars</SelectItem>
                <SelectItem value="4">Avril</SelectItem>
                <SelectItem value="5">Mai</SelectItem>
                <SelectItem value="6">Juin</SelectItem>
                <SelectItem value="7">Juillet</SelectItem>
                <SelectItem value="8">Août</SelectItem>
                <SelectItem value="9">Septembre</SelectItem>
                <SelectItem value="10">Octobre</SelectItem>
                <SelectItem value="11">Novembre</SelectItem>
                <SelectItem value="12">Décembre</SelectItem>
              </SelectContent>
            </Select>

            <Select value={periode.annee} onValueChange={(value) => setPeriode({ ...periode, annee: value })}>
              <SelectTrigger className="w-32 h-12 rounded-full">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>

            <Input
              value={periode.duree_mois}
              onChange={(e) => setPeriode({ ...periode, duree_mois: e.target.value })}
              className="w-32 h-12 rounded-full text-center"
              placeholder="6 mois"
            />
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-3 rounded-full text-lg"
            >
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
