"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, FileText, Calendar, BarChart3, Download, UserCheck } from "lucide-react"
import Link from "next/link"

export default function RHPage() {
  return (
    <DashboardLayout requiredRole="rh">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ressources Humaines</h1>
            <p className="text-gray-600">Gérez les stagiaires et les processus RH</p>
          </div>
          <div className="flex space-x-2">
            <Link href="/rh/reporting">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </Link>
            <Link href="/rh/planning">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="h-4 w-4 mr-2" />
                Planning
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistiques RH */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stagiaires actifs</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">67</div>
              <p className="text-xs text-muted-foreground">+8 ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conventions signées</CardTitle>
              <FileText className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
              <p className="text-xs text-muted-foreground">Cette semaine</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <UserCheck className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">34</div>
              <p className="text-xs text-muted-foreground">En attente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de satisfaction</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">+3% ce trimestre</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions RH */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Gestion des stagiaires
              </CardTitle>
              <CardDescription>Suivre et gérer tous les stagiaires</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rh/stagiaires">
                <Button className="w-full">Voir les stagiaires</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Demandes RH
              </CardTitle>
              <CardDescription>Traiter les demandes administratives</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rh/demandes">
                <Button className="w-full">Traiter les demandes</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
                Rapports et analyses
              </CardTitle>
              <CardDescription>Générer des rapports détaillés</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/rh/reporting">
                <Button className="w-full">Voir les rapports</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
