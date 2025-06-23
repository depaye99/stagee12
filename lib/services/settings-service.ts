interface SystemSettings {
  company_name: string
  company_address: string
  company_phone: string
  company_email: string
  max_stagiaires_per_tuteur: number
  stage_duration_months: number
  notification_email_enabled: boolean
  auto_assign_tuteur: boolean
  require_document_approval: boolean
  session_timeout_hours: number
}

class SettingsService {
  private static instance: SettingsService
  private settings: SystemSettings | null = null
  private lastFetch = 0
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService()
    }
    return SettingsService.instance
  }

  async getSystemSettings(): Promise<SystemSettings> {
    const now = Date.now()

    // Utiliser le cache si récent
    if (this.settings && now - this.lastFetch < this.CACHE_DURATION) {
      return this.settings
    }

    try {
      const response = await fetch("/api/admin/settings")
      const data = await response.json()

      if (data.success) {
        this.settings = data.data
        this.lastFetch = now
        return this.settings
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des paramètres:", error)
    }

    // Valeurs par défaut si erreur
    return this.getDefaultSettings()
  }

  async getSetting<K extends keyof SystemSettings>(key: K): Promise<SystemSettings[K]> {
    const settings = await this.getSystemSettings()
    return settings[key]
  }

  // Invalider le cache pour forcer le rechargement
  invalidateCache(): void {
    this.settings = null
    this.lastFetch = 0
  }

  private getDefaultSettings(): SystemSettings {
    return {
      company_name: "Bridge Technologies Solutions",
      company_address: "123 Rue de la Technologie, Yaoundé, Cameroun",
      company_phone: "+237 123 456 789",
      company_email: "contact@bridgetech.cm",
      max_stagiaires_per_tuteur: 5,
      stage_duration_months: 6,
      notification_email_enabled: true,
      auto_assign_tuteur: true,
      require_document_approval: true,
      session_timeout_hours: 8,
    }
  }
}

export const settingsService = SettingsService.getInstance()
export type { SystemSettings }
