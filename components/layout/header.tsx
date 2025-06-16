"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, LogOut, User, Settings } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { authService } from "@/lib/services/auth-service"
import { useTranslation, languages, type Language } from "@/lib/i18n"
import { useTheme } from "next-themes"
import { useAppStore } from "@/lib/store"
import { Sun, Moon, Languages } from "lucide-react"

interface HeaderProps {
  user?: any
  showAuth?: boolean
}

export function Header({ user, showAuth = false }: HeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage } = useAppStore()
  const { t } = useTranslation(language)

  useEffect(() => {
    if (user) {
      // Charger les notifications de l'utilisateur
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    // TODO: Implémenter le chargement des notifications depuis Supabase
    // const notificationsService = new NotificationsService()
    // const userNotifications = await notificationsService.getByUserId(user.id)
    // setNotifications(userNotifications)
  }

  const handleLogout = async () => {
    try {
      await authService.signOut()
      router.push("/auth/login")
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error)
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrateur"
      case "rh":
        return "Ressources Humaines"
      case "tuteur":
        return "Tuteur"
      case "stagiaire":
        return "Stagiaire"
      default:
        return role
    }
  }

  const getProfileLink = (role: string) => {
    switch (role) {
      case "admin":
        return "/admin/profile"
      case "rh":
        return "/rh/profile"
      case "tuteur":
        return "/tuteur/profile"
      case "stagiaire":
        return "/stagiaire/profile"
      default:
        return "/profile"
    }
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  const changeLanguage = (newLang: Language) => {
    setLanguage(newLang)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="relative mr-3">
              <div className="w-8 h-8 border-2 border-blue-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <div>
              <div className="font-bold text-lg text-foreground">BRIDGE</div>
              <div className="text-sm text-blue-500 font-medium">Technologies</div>
              <div className="text-xs text-muted-foreground">Solutions</div>
            </div>
          </div>
        </Link>

        {!showAuth && (
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-foreground hover:text-blue-500 font-medium">
              {t("home")}
            </Link>
            <Link href="/contacts" className="text-foreground hover:text-blue-500 font-medium">
              {t("contacts")}
            </Link>
            <Link href="/entreprise" className="text-foreground hover:text-blue-500 font-medium">
              {t("company")}
            </Link>
            <Link href="/services" className="text-foreground hover:text-blue-500 font-medium">
              {t("services")}
            </Link>
          </nav>
        )}

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {notifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Aucune notification</div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4">
                        <div className="font-medium">{notification.titre}</div>
                        <div className="text-sm text-gray-500">{notification.message}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(notification.date).toLocaleDateString("fr-FR")}
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.first_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium">
                        {user.first_name} {user.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{getRoleLabel(user.role)}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink(user.role)} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : showAuth ? (
            <div className="flex items-center space-x-2">
              <Link href="/auth/login">
                <Button variant="ghost">Se connecter</Button>
              </Link>
              <Link href="/auth/register">
                <Button>S'inscrire</Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {Object.entries(languages).map(([code, lang]) => (
                    <DropdownMenuItem
                      key={code}
                      onClick={() => changeLanguage(code as Language)}
                      className={language === code ? "bg-accent" : ""}
                    >
                      <span className="mr-2">{lang.flag}</span>
                      {lang.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button variant="outline" size="icon" onClick={toggleTheme}>
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
