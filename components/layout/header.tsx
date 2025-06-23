'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Bell, User, LogOut, Settings, Menu, Home, FileText, Users, BarChart3 } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

interface HeaderProps {
  user: any
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()
  const isMobile = useIsMobile()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrateur'
      case 'rh':
        return 'Ressources Humaines'
      case 'tuteur':
        return 'Tuteur'
      case 'stagiaire':
        return 'Stagiaire'
      default:
        return role
    }
  }

  const getNavigationItems = () => {
    const baseItems = [
      { icon: Home, label: 'Accueil', href: `/${user?.role}` },
    ]

    switch (user?.role) {
      case 'admin':
        return [
          ...baseItems,
          { icon: Users, label: 'Utilisateurs', href: '/admin/users' },
          { icon: FileText, label: 'Demandes', href: '/admin/demandes' },
          { icon: BarChart3, label: 'Logs', href: '/admin/logs' },
        ]
      case 'rh':
        return [
          ...baseItems,
          { icon: Users, label: 'Stagiaires', href: '/rh/stagiaires' },
          { icon: FileText, label: 'Demandes', href: '/rh/demandes' },
          { icon: BarChart3, label: 'Rapports', href: '/rh/reporting' },
        ]
      case 'tuteur':
        return [
          ...baseItems,
          { icon: Users, label: 'Mes Stagiaires', href: '/tuteur/stagiaires' },
          { icon: FileText, label: 'Demandes', href: '/tuteur/demandes' },
          { icon: BarChart3, label: 'Évaluations', href: '/tuteur/evaluations' },
        ]
      case 'stagiaire':
        return [
          ...baseItems,
          { icon: FileText, label: 'Mes Demandes', href: '/stagiaire/demandes' },
          { icon: User, label: 'Mon Profil', href: '/stagiaire/profil' },
          { icon: BarChart3, label: 'Évaluations', href: '/stagiaire/evaluations' },
        ]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {isMobile && (
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="px-2">
                    <h2 className="text-lg font-semibold">Navigation</h2>
                    <p className="text-sm text-gray-500">{getRoleDisplay(user?.role)}</p>
                  </div>
                  <nav className="flex flex-col space-y-2">
                    {navigationItems.map((item) => (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className="justify-start"
                        onClick={() => router.push(item.href)}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Button>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
              Bridge Technologies
            </h1>
            <span className="text-xs sm:text-sm text-gray-500">
              {getRoleDisplay(user?.role)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.avatar_url} alt={user?.name} />
                  <AvatarFallback className="text-xs">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground truncate">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Se déconnecter</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}