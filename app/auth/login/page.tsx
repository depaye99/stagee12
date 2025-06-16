"use client"

import type React from "react"
import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"

interface LoginFormData {
  email: string
  password: string
}

function LoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const redirectTo = searchParams.get("redirectTo")

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur de connexion")
      }

      toast({
        title: "Connexion réussie",
        description: "Redirection en cours...",
      })

      if (redirectTo && redirectTo !== "/auth/login" && redirectTo !== "/auth/register") {
        window.location.href = redirectTo
      } else {
        const userRole = data.user?.role || "stagiaire"
        let targetPath = "/stagiaire"
        switch (userRole) {
          case "admin":
            targetPath = "/admin"
            break
          case "rh":
            targetPath = "/rh"
            break
          case "tuteur":
            targetPath = "/tuteur"
            break
        }
        window.location.href = targetPath
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur de connexion"
      setError(errorMessage)
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold">
                  <span className="text-black">BRIDGE</span>
                  <div className="text-sm text-blue-500 -mt-1">Technologies</div>
                  <div className="text-xs text-blue-400 -mt-1">Solutions</div>
                </div>
              </div>
            </div>
            <nav className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <Link href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Accueil
                </Link>
                <Link href="/contacts" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Contacts
                </Link>
                <Link href="/entreprise" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  L'entreprise
                </Link>
                <Link href="/services" className="text-gray-900 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Services
                </Link>
              </div>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="outline" size="sm">
                <span className="text-white bg-black px-2 py-1 rounded text-xs">A</span>
                <span className="ml-1">Fr</span>
              </Button>
              <Button variant="ghost" size="sm">
                ☀️
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Left Side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image src="/laptop-bg.jpg" alt="Workspace" fill className="object-cover" />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Connexion à votre compte Bridge</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email" className="text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 h-12"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-gray-700">
                  Mot de passe
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="mt-1 h-12"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full h-12 bg-black text-white hover:bg-gray-800" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>

              <div className="text-center">
                <div className="text-gray-500 mb-4">ou</div>
                <p className="text-sm text-gray-600">
                  Vous n'avez pas de compte?{" "}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-500 font-medium">
                    S'inscrire
                  </Link>
                </p>
              </div>

              <div className="text-xs text-gray-500 text-center">
                En vous connectant vous acceptez nos{" "}
                <Link href="/conditions" className="underline">
                  politiques de confidentialité
                </Link>{" "}
                et nos{" "}
                <Link href="/conditions" className="underline">
                  conditions d'utilisation
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center">
              <span className="font-medium">🎓 @BridgeTech-Solutions</span>
              <span className="ml-4 text-gray-500">Tous droits réservés</span>
            </div>
            <div className="flex space-x-6 text-gray-500">
              <Link href="/conditions">Condition d'utilisation</Link>
              <Link href="/confidentialite">Politique de confidentialité</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
