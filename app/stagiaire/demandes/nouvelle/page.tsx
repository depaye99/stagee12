"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Plus, ArrowLeft, Loader2 } from "lucide-react"

export default function NouvelleDemandePage() {
  const { user, loading: authLoading } = useAuth("stagiaire")
  const [demandType, setDemandType] = useState("stage_academique")
  const [documents, setDocuments] = useState({
    cv: null as File | null,
    certificat_scolarite: null as File | null,
    lettre_motivation: null as File | null,
    lettre_recommandation: null as File | null,
    dernier_diplome: null as File | null,
    document_supplementaire: null as File | null,
    piece_identite: null as File | null,
    plan_localisation: null as File | null,
  })
  const [periode, setPeriode] = useState({
    jours: "",
    mois: "",
    annee: "",
    nombre_mois: "6",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleFileUpload = (documentType: string, file: File) => {
    setDocuments((prev) => ({
      ...prev,
      [documentType]: file,
    }))
  }

  const handleSubmit = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Créer la demande
      const { data: demande, error: demandeError } = await supabase
        .from("demandes")
        .insert({
          user_id: user.id,
          type: demandType,
          titre: `Demande de ${demandType.replace("_", " ")}`,
          description: `Demande de ${demandType.replace("_", " ")} pour une durée de ${periode.nombre_mois} mois`,
          statut: "en_attente",
          date_debut:
            periode.jours && periode.mois && periode.annee
              ? `${periode.annee}-${periode.mois.padStart(2, "0")}-${periode.jours.padStart(2, "0")}`
              : null,
          duree_mois: Number.parseInt(periode.nombre_mois) || 6,
        })
        .select()
        .single()

      if (demandeError) throw demandeError

      // Upload des documents (simulation)
      // TODO: Implémenter l'upload réel des fichiers vers Supabase Storage

      toast({
        title: "Succès",
        description: "Demande créée avec succès",
      })

      router.push("/stagiaire/demandes")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de la demande",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const FileUploadBox = ({
    id,
    label,
    placeholder,
    documentType,
    required = false,
  }: {
    id: string
    label: string
    placeholder: string
    documentType: string
    required?: boolean
  }) => (
    <div className="space-y-3">
      <Label className="text-lg font-semibold">{label}</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(documentType, e.target.files[0])}
          className="hidden"
          id={id}
        />
        <label htmlFor={id} className="cursor-pointer">
          <div className="text-gray-500 mb-3 text-sm">{placeholder}</div>
          <div className="bg-black text-white rounded-lg p-2 inline-flex items-center justify-center w-8 h-8">
            <Plus className="h-4 w-4" />
          </div>
        </label>
        {documents[documentType as keyof typeof documents] && (
          <div className="mt-2 text-sm text-green-600">
            ✓ {(documents[documentType as keyof typeof documents] as File)?.name}
          </div>
        )}
      </div>
    </div>
  )

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header simple */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Button variant="ghost" onClick={() => router.push("/stagiaire")} className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              FORMULAIRE DE DEMANDE {demandType === "stage_academique" ? "ACADEMIQUE" : "PROFESSIONNEL"}
            </div>
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

          <h1 className="text-2xl font-bold text-center mb-12">FORMULAIRE DE DEMANDE DE STAGE</h1>

          {/* Type de demande */}
          <div className="flex items-center justify-center mb-16">
            <div className="flex items-center space-x-6">
              <Label className="text-lg font-medium">Types de demande</Label>
              <Select value={demandType} onValueChange={setDemandType}>
                <SelectTrigger className="w-64 h-12 rounded-full border-2 border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stage_academique">Stage académique</SelectItem>
                  <SelectItem value="stage_professionnel">Stage professionnel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Documents */}
          {demandType === "stage_academique" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">DOCUMENTS</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <FileUploadBox
                  id="cv-upload"
                  label="CV"
                  placeholder="Déposer votre cv ici"
                  documentType="cv"
                  required
                />

                <FileUploadBox
                  id="certificat-upload"
                  label="Certificat de scolarité"
                  placeholder="Déposer votre Certificat de scolarité ici"
                  documentType="certificat_scolarite"
                  required
                />

                <FileUploadBox
                  id="motivation-upload"
                  label="Lettre de motivation"
                  placeholder="Déposer votre Lettre de motivation ici"
                  documentType="lettre_motivation"
                  required
                />

                <FileUploadBox
                  id="recommandation-upload"
                  label="Lettre de recommandation"
                  placeholder="Déposer votre Lettre de recommandation ici"
                  documentType="lettre_recommandation"
                  required
                />
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">INFORMATIONS PERSONNELLES</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <FileUploadBox
                  id="identite-upload"
                  label="Pièce d'identité"
                  placeholder="Déposer votre ici"
                  documentType="piece_identite"
                  required
                />

                <FileUploadBox
                  id="plan-upload"
                  label="Plan de localisation"
                  placeholder="Déposer votre plan de location"
                  documentType="plan_localisation"
                />
              </div>
            </>
          )}

          {demandType === "stage_professionnel" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <FileUploadBox
                  id="cv-upload"
                  label="CV"
                  placeholder="Déposer votre cv ici"
                  documentType="cv"
                  required
                />

                <FileUploadBox
                  id="certificat-upload"
                  label="Certificat de scolarité"
                  placeholder="Déposer votre Certificat de scolarité ici"
                  documentType="certificat_scolarite"
                  required
                />

                <FileUploadBox
                  id="motivation-upload"
                  label="Lettre de motivation"
                  placeholder="Déposer votre Lettre de motivation ici"
                  documentType="lettre_motivation"
                  required
                />

                <FileUploadBox
                  id="recommandation-upload"
                  label="Lettre de recommandation"
                  placeholder="Déposer votre Lettre de recommandation ici"
                  documentType="lettre_recommandation"
                  required
                />

                <FileUploadBox
                  id="diplome-upload"
                  label="Dernier diplôme"
                  placeholder="Déposez votre diplôme ici"
                  documentType="dernier_diplome"
                  required
                />

                <FileUploadBox
                  id="supplementaire-upload"
                  label="Document supplémentaire"
                  placeholder="Facultatif"
                  documentType="document_supplementaire"
                />

                <FileUploadBox
                  id="identite-upload"
                  label="Pièce d'identité"
                  placeholder="Déposer votre ici"
                  documentType="piece_identite"
                  required
                />

                <FileUploadBox
                  id="plan-upload"
                  label="Plan de localisation"
                  placeholder="Déposer votre plan de location"
                  documentType="plan_localisation"
                />
              </div>
            </>
          )}

          {/* Section Périodes */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold">PÉRIODES</h2>
          </div>

          <div className="flex items-center justify-center space-x-8 mb-16">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date de début</Label>
              <div className="flex space-x-4">
                <Select value={periode.jours} onValueChange={(value) => setPeriode({ ...periode, jours: value })}>
                  <SelectTrigger className="w-24 h-12 rounded-full border-2">
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
                  <SelectTrigger className="w-24 h-12 rounded-full border-2">
                    <SelectValue placeholder="Mois" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Jan</SelectItem>
                    <SelectItem value="2">Fév</SelectItem>
                    <SelectItem value="3">Mar</SelectItem>
                    <SelectItem value="4">Avr</SelectItem>
                    <SelectItem value="5">Mai</SelectItem>
                    <SelectItem value="6">Juin</SelectItem>
                    <SelectItem value="7">Juil</SelectItem>
                    <SelectItem value="8">Août</SelectItem>
                    <SelectItem value="9">Sep</SelectItem>
                    <SelectItem value="10">Oct</SelectItem>
                    <SelectItem value="11">Nov</SelectItem>
                    <SelectItem value="12">Déc</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={periode.annee} onValueChange={(value) => setPeriode({ ...periode, annee: value })}>
                  <SelectTrigger className="w-24 h-12 rounded-full border-2">
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre de mois</Label>
              <Input
                value={periode.nombre_mois + " mois"}
                onChange={(e) => setPeriode({ ...periode, nombre_mois: e.target.value.replace(" mois", "") })}
                className="w-32 h-12 rounded-full text-center border-2"
                placeholder="6 mois"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-full text-lg font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
