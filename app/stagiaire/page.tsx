"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Header } from "@/components/layout/header"
import { FileText, Clock, CheckCircle, XCircle, Plus, Calendar, Mail, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { createClient } from "@/lib/supabase/client"

interface Demande {
  id: string
  type: string
  titre: string
  statut: string
  created_at: string
  updated_at: string
}

export default function StagiaireDashboard() {
  const { user, loading: authLoading } = useAuth("stagiaire")
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadDemandes()
    }
  }, [user])

  const loadDemandes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("demandes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      setDemandes(data || [])
    } catch (error) {
      console.error("Error loading demandes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approuve":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approuvé
          </Badge>
        )
      case "rejete":
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </Badge>
        )
      case "en_attente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader2 className="animate-spin h-12 w-12 mx-auto text-blue-600" />
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* En-tête de bienvenue */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bonjour, {user.first_name || user.name || "Stagiaire"} !</h1>
          <p className="mt-2 text-gray-600">
            Bienvenue sur votre tableau de bord. Gérez vos demandes de stage et suivez leur progression.
          </p>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total demandes</p>
                  <p className="text-2xl font-bold text-gray-900">{demandes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demandes.filter((d) => d.statut === "en_attente").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approuvées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demandes.filter((d) => d.statut === "approuve").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejetées</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {demandes.filter((d) => d.statut === "rejete").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Mes demandes récentes */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Mes demandes récentes</CardTitle>
                  <CardDescription>Suivez l'état de vos demandes de stage</CardDescription>
                </div>
                <Link href="/stagiaire/demandes/nouvelle">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nouvelle demande
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {demandes.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande</h3>
                    <p className="mt-1 text-sm text-gray-500">Commencez par créer votre première demande de stage.</p>
                    <div className="mt-6">
                      <Link href="/stagiaire/demandes/nouvelle">
                        <Button>
                          <Plus className="w-4 h-4 mr-2" />
                          Nouvelle demande
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {demandes.slice(0, 5).map((demande) => (
                      <div key={demande.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{demande.titre}</p>
                            <p className="text-sm text-gray-500">
                              Créée le {new Date(demande.created_at).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">{getStatusBadge(demande.statut)}</div>
                      </div>
                    ))}
                    {demandes.length > 5 && (
                      <div className="text-center pt-4">
                        <Link href="/stagiaire/demandes">
                          <Button variant="outline">Voir toutes les demandes</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profil utilisateur */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Mon profil</CardTitle>
                <CardDescription>Informations personnelles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{user.email}</span>
                </div>
                <Separator />
                <Link href="/stagiaire/profile">
                  <Button variant="outline" className="w-full">
                    Modifier le profil
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Actions rapides */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/stagiaire/demandes">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Voir toutes mes demandes
                  </Button>
                </Link>
                <Link href="/stagiaire/documents">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    Mes documents
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
