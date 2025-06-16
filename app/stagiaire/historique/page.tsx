"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/layout/header"
import { Clock, FileText, User, Calendar, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface HistoriqueItem {
  id: string
  type: "demande" | "evaluation" | "document" | "notification" | "connexion"
  titre: string
  description: string
  date: string
  statut?: string
  details?: any
}

export default function StagiaireHistoriquePage() {
  const [user, setUser] = useState<any>(null)
  const [historique, setHistorique] = useState<HistoriqueItem[]>([])
  const [loading, setLoading] = useState(true)
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
      await loadHistorique(session.user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadHistorique = async (userId: string) => {
    try {
      // Récupérer les informations du stagiaire
      const { data: stagiaire } = await supabase.from("stagiaires").select("id").eq("user_id", userId).single()

      if (!stagiaire) return

      // Récupérer l'historique depuis différentes tables
      const [demandes, evaluations, documents, notifications] = await Promise.all([
        // Demandes
        supabase
          .from("demandes")
          .select("*")
          .eq("stagiaire_id", stagiaire.id)
          .order("created_at", { ascending: false }),

        // Évaluations
        supabase
          .from("evaluations")
          .select("*")
          .eq("stagiaire_id", stagiaire.id)
          .order("created_at", { ascending: false }),

        // Documents
        supabase
          .from("documents")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),

        // Notifications
        supabase
          .from("notifications")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ])

      // Construire l'historique unifié
      const historiqueItems: HistoriqueItem[] = []

      // Ajouter les demandes
      demandes.data?.forEach((demande) => {
        historiqueItems.push({
          id: `demande-${demande.id}`,
          type: "demande",
          titre: `Demande: ${demande.titre}`,
          description: `Demande de ${demande.type} - ${demande.statut}`,
          date: demande.created_at,
          statut: demande.statut,
          details: demande,
        })
      })

      // Ajouter les évaluations
      evaluations.data?.forEach((evaluation) => {
        historiqueItems.push({
          id: `evaluation-${evaluation.id}`,
          type: "evaluation",
          titre: `Évaluation ${evaluation.type}`,
          description: `Note globale: ${evaluation.note_globale || "Non notée"}/5`,
          date: evaluation.created_at,
          details: evaluation,
        })
      })

      // Ajouter les documents
      documents.data?.forEach((document) => {
        historiqueItems.push({
          id: `document-${document.id}`,
          type: "document",
          titre: `Document: ${document.nom}`,
          description: `Type: ${document.type} - Taille: ${formatFileSize(document.taille)}`,
          date: document.created_at,
          details: document,
        })
      })

      // Ajouter les notifications importantes
      notifications.data?.slice(0, 10).forEach((notification) => {
        historiqueItems.push({
          id: `notification-${notification.id}`,
          type: "notification",
          titre: notification.titre,
          description: notification.message,
          date: notification.created_at,
          details: notification,
        })
      })

      // Trier par date décroissante
      historiqueItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setHistorique(historiqueItems)
    } catch (error) {
      console.error("Erreur lors du chargement de l'historique:", error)
      toast({
        title: "Erreur",
        description: "Impossible de charger l'historique",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "demande":
        return <FileText className="h-4 w-4" />
      case "evaluation":
        return <User className="h-4 w-4" />
      case "document":
        return <FileText className="h-4 w-4" />
      case "notification":
        return <MessageSquare className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "demande":
        return "bg-blue-100 text-blue-800"
      case "evaluation":
        return "bg-green-100 text-green-800"
      case "document":
        return "bg-purple-100 text-purple-800"
      case "notification":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (statut?: string) => {
    if (!statut) return "bg-gray-100 text-gray-800"
    switch (statut) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-800"
      case "approuvee":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Aujourd'hui"
    if (diffDays === 2) return "Hier"
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`
    return date.toLocaleDateString("fr-FR")
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
          <h1 className="text-3xl font-bold text-gray-900">Mon historique</h1>
          <p className="text-gray-600">Toutes vos activités et interactions sur la plateforme</p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Demandes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {historique.filter((h) => h.type === "demande").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Évaluations</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {historique.filter((h) => h.type === "evaluation").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Documents</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {historique.filter((h) => h.type === "document").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {historique.filter((h) => h.type === "notification").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline de l'historique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Historique des activités ({historique.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historique.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune activité</h3>
                <p className="text-gray-500">Votre historique d'activités apparaîtra ici.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {historique.map((item, index) => (
                  <div key={item.id} className="flex items-start space-x-4 pb-4">
                    {/* Timeline line */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-8 h-8 bg-white border-2 border-gray-300 rounded-full">
                        {getTypeIcon(item.type)}
                      </div>
                      {index < historique.length - 1 && <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-medium text-gray-900">{item.titre}</h3>
                          <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                          {item.statut && <Badge className={getStatusColor(item.statut)}>{item.statut}</Badge>}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(item.date)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
