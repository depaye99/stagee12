"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, User, Plus, Clock, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"

export default function StagiairePage() {
  return (
    <DashboardLayout requiredRole="stagiaire">
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
            <p className="text-gray-600">Gérez vos demandes de stage et suivez votre progression</p>
          </div>
          <Link href="/stagiaire/demandes/nouvelle">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande
            </Button>
          </Link>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Demandes totales</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">+1 ce mois</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En attente</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">En cours de traitement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approuvées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Demandes validées</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Fichiers uploadés</p>
            </CardContent>
          </Card>
        </div>

        {/* Demandes récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Mes demandes récentes</CardTitle>
            <CardDescription>Suivez l'état de vos demandes de stage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium">Demande de stage académique</h3>
                    <p className="text-sm text-gray-600">Soumise le 15 janvier 2024</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    <Clock className="h-3 w-3 mr-1" />
                    En attente
                  </Badge>
                  <Button variant="outline" size="sm">
                    Voir détails
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-green-600" />
                  <div>
                    <h3 className="font-medium">Convention de stage</h3>
                    <p className="text-sm text-gray-600">Approuvée le 10 janvier 2024</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approuvée
                  </Badge>
                  <Button variant="outline" size="sm">
                    Télécharger
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <FileText className="h-8 w-8 text-red-600" />
                  <div>
                    <h3 className="font-medium">Demande de prolongation</h3>
                    <p className="text-sm text-gray-600">Rejetée le 5 janvier 2024</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Rejetée
                  </Badge>
                  <Button variant="outline" size="sm">
                    Voir raison
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Plus className="h-5 w-5 mr-2 text-blue-600" />
                Nouvelle demande
              </CardTitle>
              <CardDescription>Créer une nouvelle demande de stage</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stagiaire/demandes/nouvelle">
                <Button className="w-full">Commencer</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2 text-green-600" />
                Mes demandes
              </CardTitle>
              <CardDescription>Consulter toutes mes demandes</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stagiaire/demandes">
                <Button variant="outline" className="w-full">
                  Voir tout
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                Mon profil
              </CardTitle>
              <CardDescription>Gérer mes informations personnelles</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/stagiaire/profile">
                <Button variant="outline" className="w-full">
                  Modifier
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
