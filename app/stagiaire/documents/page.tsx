"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FileText, Search, Download, Trash2, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StagiaireDocumentsPage() {
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
      if (!profile) {
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
            <div className="flex items-center space-x-2 mb-6">
              <User className="h-5 w-5" />
              <span className="font-medium">Ressources humaines</span>
            </div>
            <nav className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Mon profil</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 cursor-pointer">
                <FileText className="h-4 w-4" />
                <span>Mes documents</span>
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
            <div className="flex items-center space-x-4 mb-2">
              <Avatar className="h-16 w-16">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback>RH</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold">Documents, --Ressources Humaines--</h1>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input placeholder="Recherche" className="pl-10" />
            </div>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>PDF</option>
              <option>DOC</option>
              <option>Tous</option>
            </select>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>Date d.</option>
            </select>
            <select className="border border-gray-300 rounded-md px-3 py-2">
              <option>Date f.</option>
            </select>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">VALIDER</Button>
          </div>

          {/* Documents Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-medium">Date</th>
                    <th className="text-left p-4 font-medium">Nom</th>
                    <th className="text-left p-4 font-medium">Description</th>
                    <th className="text-left p-4 font-medium">format</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="p-4">06/05/2025</td>
                    <td className="p-4">Lettre de motivation</td>
                    <td className="p-4">2 jours - 15-16 mai 2025</td>
                    <td className="p-4">DOC</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-600 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-blue-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4">06/05/2025</td>
                    <td className="p-4">Lettre de recomm...</td>
                    <td className="p-4">Lettre de l'ecole</td>
                    <td className="p-4">PDF</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-600 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-blue-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4">06/05/2025</td>
                    <td className="p-4">Lettre de recomm...</td>
                    <td className="p-4">2 jours - 15-16 mai 2025</td>
                    <td className="p-4">DOC</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-600 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-blue-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4">06/05/2025</td>
                    <td className="p-4">Photocopie carte id</td>
                    <td className="p-4">Ma carte d'identité</td>
                    <td className="p-4">PDF</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-600 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-blue-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="p-4">06/05/2025</td>
                    <td className="p-4">Plan de Localisation</td>
                    <td className="p-4">Le chez moi</td>
                    <td className="p-4">PDF</td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-600 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-600 hover:text-blue-600">
                          <Download className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
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
