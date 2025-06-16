"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StagiaireProfilPage() {
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
              <span className="font-medium">Stagiaire</span>
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
            <h1 className="text-2xl font-bold mb-2">Profile</h1>
            <p className="text-gray-600">Ceci est votre tableau de bord qui recence l'ensemble de vos activités</p>
          </div>

          {/* Profile Card */}
          <Card className="max-w-4xl">
            <CardContent className="p-8">
              <div className="flex items-start space-x-8">
                <div className="flex-shrink-0">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="text-2xl">NS</AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-8">
                  <div>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600">Nom :</label>
                      <p className="text-lg">Nom du stagiaire</p>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600">Email :</label>
                      <p className="text-lg">Mail du stagiaire</p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600">Adresse :</label>
                      <p className="text-lg">Lycée de makepe</p>
                    </div>
                    <div className="mb-4">
                      <label className="text-sm font-medium text-gray-600">Téléphone :</label>
                      <p className="text-lg">+237- 652347895</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-8">
                <Button className="bg-black text-white px-8 py-2 rounded">Modifier</Button>
              </div>
            </CardContent>
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
