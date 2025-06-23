import { createClient } from "@/lib/supabase/server"

export interface LogAction {
  user_id?: string
  action: string
  details?: any
  ip_address?: string
  user_agent?: string
}

export class LoggingService {
  private static async getSupabase() {
    return await createClient()
  }

  /**
   * Enregistre une action utilisateur dans les logs
   */
  static async logUserAction({
    user_id,
    action,
    details = {},
    ip_address,
    user_agent
  }: LogAction) {
    try {
      const supabase = await this.getSupabase()
      
      const { error } = await supabase
        .from('user_actions_log')
        .insert({
          user_id,
          action,
          details,
          ip_address,
          user_agent
        })

      if (error) {
        console.error('Erreur lors de l\'enregistrement du log:', error)
      }
    } catch (error) {
      console.error('Erreur service logging:', error)
    }
  }

  /**
   * Récupère les logs avec pagination
   */
  static async getLogs(page = 1, limit = 50) {
    try {
      const supabase = await this.getSupabase()
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('user_actions_log')
        .select(`
          *,
          users (
            id,
            name,
            email,
            role
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        logs: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error)
      throw error
    }
  }

  /**
   * Récupère les logs d'un utilisateur spécifique
   */
  static async getUserLogs(userId: string, page = 1, limit = 20) {
    try {
      const supabase = await this.getSupabase()
      const offset = (page - 1) * limit

      const { data, error, count } = await supabase
        .from('user_actions_log')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw error

      return {
        logs: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des logs utilisateur:', error)
      throw error
    }
  }

  /**
   * Nettoie les anciens logs (garde les 90 derniers jours)
   */
  static async cleanOldLogs(daysToKeep = 90) {
    try {
      const supabase = await this.getSupabase()
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

      const { error } = await supabase
        .from('user_actions_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Erreur lors du nettoyage des logs:', error)
      throw error
    }
  }
}
