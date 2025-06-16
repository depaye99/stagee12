"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, FileText, BarChart3 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RHDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/bridge-logo.png" alt="Bridge Technologies" className="h-8 w-auto" />
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Accueil</span>
              <div className="bg-black text-white px-3 py-1 rounded text-sm">A</div>
              <button className="text-gray-400">☀️</button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white min-h-screen border-r border-gray-200">
          <div className="p-4">
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900">Ressources Humaines</h2>
            </div>
            <nav className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                <BarChart3 className="h-4 w-4" />
                <span>Statistiques</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                <FileText className="h-4 w-4" />
                <span>Documents</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                <Users className="h-4 w-4" />
                <span>Mon profil</span>
              </div>
            </nav>
          </div>

          <div className="absolute bottom-4 left-4">
            <Button variant="outline" className="flex items-center space-x-2">
              <span>🚪</span>
              <span>Log Out</span>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">Bonjour, bienvenue sur votre tableau de bord</h1>
            <p className="text-gray-600">Ceci est votre tableau de bord qui recence l'ensemble de vos activités</p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Stagiaires actifs</span>
                <Users className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold mb-1">2</div>
              <div className="text-xs text-gray-500">Stagiaire actuellement en entreprise</div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Nombre de demande en cours</span>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="text-2xl font-bold mb-1">5</div>
              <div className="text-xs text-gray-500">Demande en attente de réponse</div>
            </Card>
          </div>

          {/* Suivi des demandes */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Suivis des demandes</h2>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-medium">Date</th>
                      <th className="text-left p-4 font-medium">Type</th>
                      <th className="text-left p-4 font-medium">Decision tuteur</th>
                      <th className="text-left p-4 font-medium">Details</th>
                      <th className="text-left p-4 font-medium">Decision finale</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">06/05/2025</td>
                      <td className="p-4">Demande de stage</td>
                      <td className="p-4">
                        <Badge className="bg-orange-100 text-orange-800 flex items-center">
                          En attente <span className="ml-1">▼</span>
                        </Badge>
                      </td>
                      <td className="p-4"></td>
                      <td className="p-4">
                        <Badge className="bg-green-100 text-green-800 flex items-center">
                          validé <span className="ml-1">▼</span>
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">06/05/2025</td>
                      <td className="p-4">Demande de congé</td>
                      <td className="p-4">
                        <Badge className="bg-orange-100 text-orange-800 flex items-center">
                          En attente <span className="ml-1">▼</span>
                        </Badge>
                      </td>
                      <td className="p-4">2 jours - 15-16 mai 2025</td>
                      <td className="p-4">
                        <Badge className="bg-red-100 text-red-800 flex items-center">
                          Refusé <span className="ml-1">▼</span>
                        </Badge>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">06/05/2025</td>
                      <td className="p-4">Demande de congé</td>
                      <td className="p-4">
                        <Badge className="bg-orange-100 text-orange-800 flex items-center">
                          En attente <span className="ml-1">▼</span>
                        </Badge>
                      </td>
                      <td className="p-4">2 jours - 15-16 mai 2025</td>
                      <td className="p-4">
                        <Badge className="bg-orange-100 text-orange-800 flex items-center">
                          En attente <span className="ml-1">▼</span>
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button className="p-2 text-gray-400">‹</button>
              <button className="px-3 py-1 bg-gray-200 rounded">1</button>
              <button className="px-3 py-1 text-gray-600">2</button>
              <button className="px-3 py-1 text-gray-600">3</button>
              <span className="text-gray-400">...</span>
              <button className="px-3 py-1 text-gray-600">30</button>
              <button className="p-2 text-gray-400">›</button>
            </div>
          </div>

          {/* Stagiaires actifs */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Stagiaires actifs</h2>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-200">
                    <tr>
                      <th className="text-left p-4 font-medium">Id</th>
                      <th className="text-left p-4 font-medium">Nom</th>
                      <th className="text-left p-4 font-medium">Prenom</th>
                      <th className="text-left p-4 font-medium">periode de stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">01</td>
                      <td className="p-4">ESSAKA</td>
                      <td className="p-4">Anette</td>
                      <td className="p-4"></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">02</td>
                      <td className="p-4">NDOUMBE</td>
                      <td className="p-4">Armant</td>
                      <td className="p-4">2 jours - 15-16 mai 2025</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="p-4">03</td>
                      <td className="p-4">KAMGA</td>
                      <td className="p-4">boris</td>
                      <td className="p-4">2 jours - 15-16 mai 2025</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Pagination */}
            <div className="flex justify-center items-center space-x-2 mt-4">
              <button className="p-2 text-gray-400">‹</button>
              <button className="px-3 py-1 bg-gray-200 rounded">1</button>
              <button className="px-3 py-1 text-gray-600">2</button>
              <button className="px-3 py-1 text-gray-600">3</button>
              <span className="text-gray-400">...</span>
              <button className="px-3 py-1 text-gray-600">30</button>
              <button className="p-2 text-gray-400">›</button>
            </div>
          </div>

          {/* Notification */}
          <div className="mb-8">
            <div className="bg-green-100 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium text-center">
                Le stagiaire --nom stagiaire-- a bien été enregistré
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span>🎓</span>
              <span className="text-sm text-gray-600">@BridgeTech-Solutions</span>
              <span className="text-sm text-gray-600">Tous droits reservés</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900">
                Condition d'utilisation
              </a>
              <a href="#" className="hover:text-gray-900">
                Politique de confidentialité
              </a>
              <a href="#" className="hover:text-gray-900">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
