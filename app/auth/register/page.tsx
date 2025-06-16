"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  })
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      })

      if (error) throw error

      toast({
        title: "Succès",
        description: "Compte créé avec succès",
      })
      router.push("/auth/login")
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
            <nav className="flex space-x-8">
              <a href="#" className="text-gray-700 hover:text-gray-900">
                Accueil
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900">
                Contacts
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900">
                L'entreprise
              </a>
              <a href="#" className="text-gray-700 hover:text-gray-900">
                Services
              </a>
            </nav>
            <div className="flex items-center space-x-4">
              <div className="bg-black text-white px-3 py-1 rounded text-sm">A</div>
              <button className="text-gray-400">☀️</button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Left side - Image */}
        <div className="flex-1 relative">
          <img src="/laptop-bg.jpg" alt="Workspace" className="w-full h-full object-cover" />
        </div>

        {/* Right side - Registration Form */}
        <div className="flex-1 flex items-center justify-center bg-gray-100 p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Rejoignez nous dès aujourd'hui !</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="phone" className="text-gray-700">
                  Numéro de téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirmer mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-md hover:bg-gray-800"
              >
                {loading ? "Création..." : "Envoyer"}
              </Button>

              <div className="text-center">
                <span className="text-gray-500">ou</span>
              </div>

              <div className="text-center">
                <span className="text-gray-600">Vous avez déjà un compte? </span>
                <a href="/auth/login" className="text-blue-600 hover:underline">
                  Se connecter
                </a>
              </div>
            </form>

            <div className="mt-8 text-center text-sm text-gray-500">
              <p>
                En vous connectant vous acceptez nos{" "}
                <a href="#" className="underline">
                  politiques de confidentialité
                </a>{" "}
                et nos{" "}
                <a href="#" className="underline">
                  conditions d'utilisation
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
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
