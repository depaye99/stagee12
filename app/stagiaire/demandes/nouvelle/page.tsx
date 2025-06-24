"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Plus, Upload } from "lucide-react"

export default function NouvelleDemandePage() {
  const [user, setUser] = useState<any>(null)
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
  const [congeData, setCongeData] = useState({
    date_debut: "",
    date_fin: "",
    description: "",
    fichier_justificatif: null as File | null,
  })
  const [prolongationData, setProlongationData] = useState({
    document_prolongation: null as File | null,
    periode_extension: "",
  })
  const [periode, setPeriode] = useState({
    jours: "",
    mois: "",
    annee: "",
    nombre_mois: "6",
  })
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("🔍 Vérification de l'authentification...")

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError || !session?.user) {
          console.log("❌ Pas de session utilisateur")
          router.push("/auth/login")
          return
        }

        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (profileError || !profile) {
          console.error("❌ Erreur profil:", profileError)
          router.push("/auth/login")
          return
        }

        if (profile.role !== "stagiaire") {
          console.log("❌ Rôle incorrect:", profile.role)
          router.push(`/${profile.role}`)
          return
        }

        console.log("✅ Authentification réussie")
        setUser(profile)
      } catch (error) {
        console.error("💥 Erreur lors de la vérification auth:", error)
        router.push("/auth/login")
      } finally {
        setAuthLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  const uploadFile = async (file: File, documentType: string): Promise<string | null> => {
    try {
      setUploadingFiles((prev) => new Set(prev).add(documentType))

      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", documentType)
      formData.append("isPublic", "false")

      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de l'upload")
      }

      console.log("✅ Fichier uploadé:", result.data)
      return result.data.url
    } catch (error) {
      console.error("❌ Erreur upload:", error)
      toast({
        title: "Erreur",
        description: `Erreur lors de l'upload de ${file.name}`,
        variant: "destructive",
      })
      return null
    } finally {
      setUploadingFiles((prev) => {
        const newSet = new Set(prev)
        newSet.delete(documentType)
        return newSet
      })
    }
  }

  const handleFileUpload = async (documentType: string, file: File) => {
    console.log("📤 Upload fichier:", { documentType, fileName: file.name })

    // Upload du fichier
    const fileUrl = await uploadFile(file, documentType)

    if (fileUrl) {
      // Mettre à jour l'état selon le type de demande
      if (documentType === "fichier_justificatif") {
        setCongeData((prev) => ({ ...prev, fichier_justificatif: file }))
      } else if (documentType === "document_prolongation") {
        setProlongationData((prev) => ({ ...prev, document_prolongation: file }))
      } else {
        setDocuments((prev) => ({
          ...prev,
          [documentType]: file,
        }))
      }

      toast({
        title: "Succès",
        description: `${file.name} uploadé avec succès`,
      })
    }
  }

  const validateForm = () => {
    if (demandType === "demande_conge") {
      if (!congeData.date_debut || !congeData.date_fin || !congeData.description) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires pour la demande de congé",
          variant: "destructive",
        })
        return false
      }
    }

    if (demandType === "demande_prolongation") {
      if (!prolongationData.document_prolongation || !prolongationData.periode_extension) {
        toast({
          title: "Erreur",
          description: "Veuillez remplir tous les champs obligatoires pour la demande de prolongation",
          variant: "destructive",
        })
        return false
      }
    }

    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    try {
      // Construire le titre selon le type de demande
      let titre = ""
      switch (demandType) {
        case "stage_academique":
          titre = "Demande de stage académique"
          break
        case "stage_professionnel":
          titre = "Demande de stage professionnel"
          break
        case "demande_conge":
          titre = "Demande de congé"
          break
        case "demande_prolongation":
          titre = "Demande de prolongation de stage"
          break
        default:
          titre = `Demande de ${demandType.replace("_", " ")}`
      }

      const requestData = {
        type: demandType,
        titre,
        description: "",
        documents,
        periode,
        congeData,
        prolongationData,
      }

      console.log("📤 Envoi de la demande:", requestData)

      const response = await fetch("/api/stagiaire/demandes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la création")
      }

      toast({
        title: "Succès",
        description: `${titre} soumise avec succès`,
      })

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

  const FileUploadBox = ({
    id,
    label,
    placeholder,
    documentType,
    required = false,
    acceptedFiles = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  }: {
    id: string
    label: string
    placeholder: string
    documentType: string
    required?: boolean
    acceptedFiles?: string
  }) => {
    const getUploadedFile = () => {
      if (documentType === "fichier_justificatif") {
        return congeData.fichier_justificatif
      }
      if (documentType === "document_prolongation") {
        return prolongationData.document_prolongation
      }
      return documents[documentType as keyof typeof documents]
    }

    const uploadedFile = getUploadedFile()
    const isUploading = uploadingFiles.has(documentType)

    return (
      <div className="space-y-3">
        <Label className="text-lg font-semibold">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors bg-gray-50">
          <input
            type="file"
            accept={acceptedFiles}
            onChange={(e) => e.target.files?.[0] && handleFileUpload(documentType, e.target.files[0])}
            className="hidden"
            id={id}
            disabled={isUploading}
          />
          <label htmlFor={id} className="cursor-pointer">
            <div className="text-gray-500 mb-3 text-sm">{placeholder}</div>
            <div className="bg-black text-white rounded-lg p-2 inline-flex items-center justify-center w-8 h-8">
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </div>
          </label>
          {uploadedFile && <div className="mt-2 text-sm text-green-600">✓ {(uploadedFile as File)?.name}</div>}
          {isUploading && <div className="mt-2 text-sm text-blue-600">Upload en cours...</div>}
        </div>
      </div>
    )
  }

  // Affichage du loading pendant la vérification d'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de l'authentification...</p>
        </div>
      </div>
    )
  }

  // Si pas d'utilisateur après vérification, ne rien afficher (redirection en cours)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="text-sm text-gray-600 uppercase tracking-wide">
              FORMULAIRE DE DEMANDE{" "}
              {demandType === "stage_academique"
                ? "ACADEMIQUE"
                : demandType === "stage_professionnel"
                  ? "PROFESSIONNEL"
                  : demandType === "demande_conge"
                    ? "DE CONGE"
                    : "DE PROLONGATION"}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Connecté en tant que: <span className="font-semibold">{user.name}</span>
              </div>
              <Button variant="outline" onClick={() => router.back()}>
                Retour
              </Button>
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

          <h1 className="text-2xl font-bold text-center mb-12">FORMULAIRE DE DEMANDE</h1>

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
                  <SelectItem value="demande_conge">Demande de congé</SelectItem>
                  <SelectItem value="demande_prolongation">Demande de prolongation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Section Documents pour Stage Académique */}
          {demandType === "stage_academique" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">DOCUMENTS</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <FileUploadBox
                  id="cv-upload"
                  label="CV"
                  placeholder="Déposer votre CV ici"
                  documentType="cv"
                  required
                />

                <FileUploadBox
                  id="certificat-upload"
                  label="Certificat de scolarité"
                  placeholder="Déposer votre certificat de scolarité ici"
                  documentType="certificat_scolarite"
                  required
                />

                <FileUploadBox
                  id="motivation-upload"
                  label="Lettre de motivation"
                  placeholder="Déposer votre lettre de motivation ici"
                  documentType="lettre_motivation"
                  required
                />

                <FileUploadBox
                  id="recommandation-upload"
                  label="Lettre de recommandation"
                  placeholder="Déposer votre lettre de recommandation ici"
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
                  placeholder="Déposer votre pièce d'identité ici"
                  documentType="piece_identite"
                  required
                />

                <FileUploadBox
                  id="plan-upload"
                  label="Plan de localisation"
                  placeholder="Déposer votre plan de localisation"
                  documentType="plan_localisation"
                />
              </div>
            </>
          )}

          {/* Section Documents pour Stage Professionnel */}
          {demandType === "stage_professionnel" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">DOCUMENTS</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <FileUploadBox
                  id="cv-upload-pro"
                  label="CV"
                  placeholder="Déposer votre CV ici"
                  documentType="cv"
                  required
                />

                <FileUploadBox
                  id="certificat-upload-pro"
                  label="Certificat de scolarité"
                  placeholder="Déposer votre certificat de scolarité ici"
                  documentType="certificat_scolarite"
                  required
                />

                <FileUploadBox
                  id="motivation-upload-pro"
                  label="Lettre de motivation"
                  placeholder="Déposer votre lettre de motivation ici"
                  documentType="lettre_motivation"
                  required
                />

                <FileUploadBox
                  id="recommandation-upload-pro"
                  label="Lettre de recommandation"
                  placeholder="Déposer votre lettre de recommandation ici"
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
                  id="identite-upload-pro"
                  label="Pièce d'identité"
                  placeholder="Déposer votre pièce d'identité ici"
                  documentType="piece_identite"
                  required
                />

                <FileUploadBox
                  id="plan-upload-pro"
                  label="Plan de localisation"
                  placeholder="Déposer votre plan de localisation"
                  documentType="plan_localisation"
                />
              </div>
            </>
          )}

          {/* Section Demande de Congé */}
          {demandType === "demande_conge" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">DEMANDE DE CONGÉ</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Date de début <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={congeData.date_debut}
                    onChange={(e) => setCongeData({ ...congeData, date_debut: e.target.value })}
                    className="h-12 rounded-full border-2"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Date de fin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={congeData.date_fin}
                    onChange={(e) => setCongeData({ ...congeData, date_fin: e.target.value })}
                    className="h-12 rounded-full border-2"
                    required
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <Label className="text-lg font-semibold">
                    Motif du congé <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={congeData.description}
                    onChange={(e) => setCongeData({ ...congeData, description: e.target.value })}
                    className="min-h-32 border-2 border-gray-300 rounded-2xl resize-none"
                    placeholder="Décrivez le motif de votre demande de congé..."
                    required
                  />
                </div>

                <div className="space-y-3 md:col-span-2">
                  <FileUploadBox
                    id="justificatif-upload"
                    label="Fichier justificatif"
                    placeholder="Déposer votre justificatif ici"
                    documentType="fichier_justificatif"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Section Demande de Prolongation */}
          {demandType === "demande_prolongation" && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">DEMANDE DE PROLONGATION</h2>
              </div>

              <div className="grid grid-cols-1 gap-8 mb-16">
                <FileUploadBox
                  id="document-prolongation-upload"
                  label="Document de prolongation"
                  placeholder="Déposer votre document Word ou PDF ici"
                  documentType="document_prolongation"
                  acceptedFiles=".pdf,.doc,.docx"
                  required
                />

                <div className="space-y-3">
                  <Label className="text-lg font-semibold">
                    Période d'extension du stage <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={prolongationData.periode_extension}
                    onChange={(e) => setProlongationData({ ...prolongationData, periode_extension: e.target.value })}
                    className="h-12 rounded-full border-2"
                    placeholder="Ex: 3 mois supplémentaires"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {/* Section Périodes (pour stages seulement) */}
          {(demandType === "stage_academique" || demandType === "stage_professionnel") && (
            <>
              <div className="text-center mb-8">
                <h2 className="text-xl font-bold">PÉRIODES</h2>
              </div>

              <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 mb-16">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de début</Label>
                  <div className="flex space-x-4">
                    <Select value={periode.jours} onValueChange={(value) => setPeriode({ ...periode, jours: value })}>
                      <SelectTrigger className="w-24 h-12 rounded-full border-2">
                        <SelectValue placeholder="Jour" />
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
                    value={periode.nombre_mois}
                    onChange={(e) => setPeriode({ ...periode, nombre_mois: e.target.value })}
                    className="w-32 h-12 rounded-full text-center border-2"
                    placeholder="6"
                    type="number"
                    min="1"
                    max="12"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <Button
              onClick={handleSubmit}
              disabled={loading || uploadingFiles.size > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-full text-lg font-medium disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi en cours...
                </>
              ) : uploadingFiles.size > 0 ? (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload en cours ({uploadingFiles.size})...
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
