"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, Calendar, Star, UserCheck } from "lucide-react"
import Link from "next/link"

export default function TuteurPage() {
  return (
    <DashboardLayout requiredRole="tuteur">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Espace Tuteur</h1>
            <p className="text-gray-600">Encadrez vos stagiaires et gérez leurs évaluations</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/tuteur/evaluations">
              <Button variant="outline">
                <Star className="h-4 w-4 mr-2" />
                Évaluations
              </Button>
            </Link>
            <Link href="/tuteur/planning">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Planning
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques Tuteur */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mes stagiaires</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">Actuellement encadrés</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes à valider</CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">À compléter</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2/5</div>
              <p className="text-xs text-muted-foreground">Satisfaction stagiaires</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Tuteur */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Mes stagiaires
              </CardTitle>
              <CardDescription>Gérer et suivre mes stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tuteur/stagiaires">
                <Button className="w-full">Voir mes stagiaires</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Demandes à valider
              </CardTitle>
              <CardDescription>Traiter les demandes de mes stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tuteur/demandes">
                <Button className="w-full">Valider les demandes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-yellow-600" />
                Évaluations
              </CardTitle>
              <CardDescription>Évaluer les performances</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/tuteur/evaluations">
                <Button className="w-full">Faire une évaluation</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
