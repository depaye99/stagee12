"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
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

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Bienvenue sur
              <br />
              Bridge Technologies Solutions
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Explorez et soumettez vos demandes de stage en toute simplicité grâce à notre plateforme intuitive.
            </p>
          </div>
          <div className="relative">
            <div className="absolute top-4 right-4 w-16 h-16 bg-blue-600 rounded-full"></div>
            <div className="bg-white rounded-2xl p-4 shadow-lg">
              <Image src="/laptop-bg.jpg" alt="Laptop workspace" width={600} height={400} className="rounded-xl" />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-white mb-4">Commencez dès maintenant et boostez votre carrière !</h2>
          <p className="text-lg text-gray-800 mb-8">
            Déposez votre candidature en un click et suivez son avancé en temps réel
          </p>
          <div className="flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="bg-black text-white hover:bg-gray-800">
                Commencer →
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                J'ai déjà un compte
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="text-sm font-medium">🎓 @BridgeTech-Solutions</div>
              <div className="ml-8 text-sm text-gray-500">Tous droits réservés</div>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <Link href="/conditions" className="hover:text-gray-900">
                Condition d'utilisation
              </Link>
              <Link href="/confidentialite" className="hover:text-gray-900">
                Politique de confidentialité
              </Link>
              <Link href="/contact" className="hover:text-gray-900">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
