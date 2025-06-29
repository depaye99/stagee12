"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { FileText, Search, Plus, Download, Eye, Trash2, Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Document {
  id: string
  nom: string
  type: string
  taille: number
  url: string
  user_id: string
  demande_id?: string
  is_public: boolean
  created_at: string
  users?: {
    name: string
    email: string
  }
}

export default function RHDocumentsPage() {
  const [user, setUser] = useState<any>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
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
      if (!profile || profile.role !== "rh") {
        router.push("/auth/login")
        return
      }

      setUser(profile)
      await loadDocuments()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("documents")
        .select(`
          *,
          users(name, email)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
      setFilteredDocuments(data || [])
    } catch (error) {
      console.error("Erreur lors du chargement des documents:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    let filtered = documents

    if (searchQuery) {
      filtered = filtered.filter(
        (doc) =>
          doc.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doc.users?.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDocuments(filtered)
  }, [documents, searchQuery])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const handleDownload = async (document: Document) => {
    try {
      const { data, error } = await supabase.storage.from("documents").download(document.url)
      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = document.nom
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error)
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le document",
        variant: "destructive",
      })
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

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion documentaire</h1>
          <p className="text-gray-600">Gérer les documents et modèles de la plateforme</p>
        </div>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Modèles</CardTitle>
              <CardDescription>Gérer les modèles de documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/rh/documents/modeles")}>
                <FileText className="mr-2 h-4 w-4" />
                Gérer les modèles
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Génération</CardTitle>
              <CardDescription>Générer des documents automatiquement</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/rh/documents/generer")}>
                <Plus className="mr-2 h-4 w-4" />
                Générer document
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload</CardTitle>
              <CardDescription>Télécharger de nouveaux documents</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={() => router.push("/rh/documents/upload")}>
                <Upload className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Archives</CardTitle>
              <CardDescription>Consulter les documents archivés</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline" onClick={() => router.push("/rh/documents/archives")}>
                <FileText className="mr-2 h-4 w-4" />
                Voir archives
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recherche */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, type, utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tableau des documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents ({filteredDocuments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Propriétaire</TableHead>
                  <TableHead>Visibilité</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.nom}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.type}</Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(document.taille)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{document.users?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{document.users?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={document.is_public ? "default" : "secondary"}>
                        {document.is_public ? "Public" : "Privé"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(document.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleDownload(document)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
