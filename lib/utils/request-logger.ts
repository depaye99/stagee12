import { type NextRequest } from "next/server"
import { LoggingService } from "@/lib/services/logging-service"

export interface RequestLogOptions {
  action: string
  details?: any
  userId?: string
}

/**
 * Utilitaire pour logger les requêtes HTTP
 */
export async function logRequest(
  request: NextRequest, 
  { action, details = {}, userId }: RequestLogOptions
) {
  try {
    // Extraire les informations de la requête
    const ip_address = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown'
    
    const user_agent = request.headers.get('user-agent') || 'unknown'
    
    // Ajouter des détails sur la requête
    const requestDetails = {
      ...details,
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString()
    }

    await LoggingService.logUserAction({
      user_id: userId,
      action,
      details: requestDetails,
      ip_address,
      user_agent
    })
  } catch (error) {
    console.error('Erreur lors du logging de la requête:', error)
  }
}

/**
 * Utilitaire pour logger les actions d'authentification
 */
export async function logAuthAction(
  request: NextRequest,
  action: 'login' | 'logout' | 'register' | 'login_failed',
  userId?: string,
  details: any = {}
) {
  await logRequest(request, {
    action: `auth_${action}`,
    details: {
      ...details,
      auth_action: action
    },
    userId
  })
}

/**
 * Utilitaire pour logger les actions de gestion des utilisateurs
 */
export async function logUserManagementAction(
  request: NextRequest,
  action: 'create_user' | 'update_user' | 'delete_user' | 'assign_role',
  actorId: string,
  targetUserId?: string,
  details: any = {}
) {
  await logRequest(request, {
    action: `user_management_${action}`,
    details: {
      ...details,
      target_user_id: targetUserId,
      management_action: action
    },
    userId: actorId
  })
}

/**
 * Utilitaire pour logger les actions sur les demandes
 */
export async function logDemandeAction(
  request: NextRequest,
  action: 'create' | 'update' | 'approve' | 'reject' | 'delete',
  userId: string,
  demandeId: string,
  details: any = {}
) {
  await logRequest(request, {
    action: `demande_${action}`,
    details: {
      ...details,
      demande_id: demandeId,
      demande_action: action
    },
    userId
  })
}

/**
 * Utilitaire pour logger les actions sur les stagiaires
 */
export async function logStagiaireAction(
  request: NextRequest,
  action: 'create' | 'update' | 'assign_tuteur' | 'delete',
  userId: string,
  stagiaireId: string,
  details: any = {}
) {
  await logRequest(request, {
    action: `stagiaire_${action}`,
    details: {
      ...details,
      stagiaire_id: stagiaireId,
      stagiaire_action: action
    },
    userId
  })
}
