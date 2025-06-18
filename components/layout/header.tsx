"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Bell, LogOut, User, Settings, Sun, Moon, Languages } from "lucide-react"
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
import { createClient } from "@/lib/supabase/client"

interface HeaderProps {
  user?: any
  showAuth?: boolean
}

export function Header({ user, showAuth = false }: HeaderProps) {
  const [notifications, setNotifications] = useState<any[]>([])
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { language, setLanguage, primaryColor } = useAppStore()
  const { t } = useTranslation(language)
  const supabase = createClient()

  useEffect(() => {
    if (user) {
      loadNotifications()
    }
  }, [user])

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("lu", false)
        .order("created_at", { ascending: false })
        .limit(10)

      if (!error && data) {
        setNotifications(data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    }
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

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await supabase.from("notifications").update({ lu: true }).eq("id", notificationId)
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    } catch (error) {
      console.error("Erreur lors du marquage de la notification:", error)
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex items-center">
            <div className="relative mr-3">
              <div
                className="w-8 h-8 border-2 rounded-full flex items-center justify-center"
                style={{ borderColor: primaryColor }}
              >
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }}></div>
              </div>
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                style={{ backgroundColor: primaryColor }}
              ></div>
            </div>
            <div>
              <div className="font-bold text-lg text-foreground">BRIDGE</div>
              <div className="text-sm font-medium" style={{ color: primaryColor }}>
                Technologies
              </div>
              <div className="text-xs text-muted-foreground">Solutions</div>
            </div>
          </div>
        </Link>

        {/* Navigation centrale (si pas en mode auth) */}
        {!showAuth && user && (
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href={
                user.role === "admin"
                  ? "/admin"
                  : user.role === "rh"
                    ? "/rh"
                    : user.role === "tuteur"
                      ? "/tuteur"
                      : "/stagiaire"
              }
              className="text-foreground hover:text-blue-500 font-medium transition-colors"
            >
              Tableau de bord
            </Link>
            {user.role === "stagiaire" && (
              <>
                <Link href="/stagiaire/demandes" className="text-foreground hover:text-blue-500 font-medium">
                  Mes demandes
                </Link>
                <Link href="/stagiaire/documents" className="text-foreground hover:text-blue-500 font-medium">
                  Mes documents
                </Link>
              </>
            )}
            {user.role === "tuteur" && (
              <>
                <Link href="/tuteur/stagiaires" className="text-foreground hover:text-blue-500 font-medium">
                  Mes stagiaires
                </Link>
                <Link href="/tuteur/evaluations" className="text-foreground hover:text-blue-500 font-medium">
                  Évaluations
                </Link>
              </>
            )}
            {user.role === "rh" && (
              <>
                <Link href="/rh/stagiaires" className="text-foreground hover:text-blue-500 font-medium">
                  Stagiaires
                </Link>
                <Link href="/rh/demandes" className="text-foreground hover:text-blue-500 font-medium">
                  Demandes
                </Link>
              </>
            )}
            {user.role === "admin" && (
              <>
                <Link href="/admin/users" className="text-foreground hover:text-blue-500 font-medium">
                  Utilisateurs
                </Link>
                <Link href="/admin/stagiaires" className="text-foreground hover:text-blue-500 font-medium">
                  Stagiaires
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Actions à droite */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Sélecteur de langue */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
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

              {/* Toggle thème */}
              <Button variant="outline" size="icon" onClick={toggleTheme} className="h-9 w-9">
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative h-9 w-9">
                    <Bell className="h-4 w-4" />
                    {notifications.length > 0 && (
                      <span
                        className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center text-[10px] font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {notifications.length > 9 ? "9+" : notifications.length}
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
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex flex-col items-start p-4 cursor-pointer"
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="font-medium">{notification.titre}</div>
                          <div className="text-sm text-gray-500 mt-1">{notification.message}</div>
                          <div className="text-xs text-gray-400 mt-2">
                            {new Date(notification.created_at).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Menu utilisateur */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 h-auto py-2 px-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm font-medium">
                        {user.first_name?.[0]?.toUpperCase() ||
                          user.name?.[0]?.toUpperCase() ||
                          user.email?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <div className="text-sm font-medium text-foreground">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.name || user.email}
                      </div>
                      <div className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">
                        {user.first_name && user.last_name
                          ? `${user.first_name} ${user.last_name}`
                          : user.name || "Utilisateur"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getProfileLink(user.role)} className="flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 cursor-pointer">
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
              {/* Sélecteur de langue pour visiteurs */}
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

              {/* Toggle thème pour visiteurs */}
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
