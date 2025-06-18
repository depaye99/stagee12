"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Header } from "@/components/layout/header"
import { Bell, Shield, Palette } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    darkMode: false,
    twoFactorAuth: false,
  })
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
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const handleSettingChange = (key: string, value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    toast({
      title: "Paramètre mis à jour",
      description: "Vos préférences ont été sauvegardées",
    })
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
          <h1 className="text-3xl font-bold text-gray-900">Paramètres</h1>
          <p className="text-gray-600">Gérer vos préférences et paramètres de compte</p>
        </div>

        <div className="space-y-6">
          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications">Notifications par email</Label>
                  <p className="text-sm text-gray-500">Recevoir des notifications par email</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => handleSettingChange("emailNotifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push-notifications">Notifications push</Label>
                  <p className="text-sm text-gray-500">Recevoir des notifications push dans le navigateur</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => handleSettingChange("pushNotifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Apparence */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Apparence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Mode sombre</Label>
                  <p className="text-sm text-gray-500">Utiliser le thème sombre</p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange("darkMode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="two-factor">Authentification à deux facteurs</Label>
                  <p className="text-sm text-gray-500">Ajouter une couche de sécurité supplémentaire</p>
                </div>
                <Switch
                  id="two-factor"
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => handleSettingChange("twoFactorAuth", checked)}
                />
              </div>
              <div className="pt-4">
                <Button variant="outline">Changer le mot de passe</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
