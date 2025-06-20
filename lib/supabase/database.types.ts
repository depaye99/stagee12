
// Types de base pour les rôles utilisateur
export type UserRole = "admin" | "rh" | "tuteur" | "stagiaire"

// Types de statut pour les demandes
export type DemandeStatus = "en_attente" | "approuvee" | "rejetee" | "en_cours" | "terminee"

// Types de demandes
export type DemandeType = "stage_academique" | "stage_professionnel" | "conge" | "prolongation" | "attestation"

// Types pour le workflow
export type WorkflowStep = "stagiaire" | "tuteur" | "rh" | "finance" | "termine"
export type WorkflowAction = "approve" | "reject" | "request_changes" | "pending"

// Interface User - mise à jour selon le script SQL
export interface User {
  id: string
  email: string
  name: string
  first_name?: string
  last_name?: string
  role: UserRole
  phone?: string
  address?: string
  department?: string
  position?: string
  avatar_url?: string
  company: string
  is_active: boolean
  last_login?: string
  created_at: string
  updated_at: string
}

// Interface UserProfile (pour les données publiques)
export interface UserProfile {
  id: string
  name: string
  first_name?: string
  last_name?: string
  role: UserRole
  department?: string
  position?: string
  avatar_url?: string
  company: string
}

// Interface Tuteur - nouvelle table
export interface Tuteur {
  id: string
  user_id: string
  specialite?: string
  max_stagiaires: number
  created_at: string
  updated_at: string
}

// Interface Tuteur avec relations
export interface TuteurWithUser extends Tuteur {
  users?: User
}

// Interface Stagiaire
export interface Stagiaire {
  id: string
  user_id: string
  tuteur_id?: string
  entreprise?: string
  poste?: string
  date_debut?: string
  date_fin?: string
  statut: "actif" | "termine" | "suspendu"
  notes?: string
  created_at: string
  updated_at: string
}

// Interface Stagiaire avec relations
export interface StagiaireWithUser extends Stagiaire {
  users?: User
  tuteur?: User
}

// Interface Demande
export interface Demande {
  id: string
  stagiaire_id: string
  tuteur_id?: string
  type: DemandeType
  titre: string
  description?: string
  statut: DemandeStatus
  date_demande: string
  date_reponse?: string
  commentaire_reponse?: string
  documents_requis?: string[]
  created_at: string
  updated_at: string
}

// Interface Demande avec relations
export interface DemandeWithRelations extends Demande {
  stagiaires?: StagiaireWithUser
  tuteur?: User
}

// Interface DemandeWorkflow - nouvelle table
export interface DemandeWorkflow {
  id: string
  demande_id: string
  step: WorkflowStep
  user_id: string
  action: WorkflowAction
  comments?: string
  created_at: string
}

// Interface DemandeWorkflow avec relations
export interface DemandeWorkflowWithRelations extends DemandeWorkflow {
  demandes?: Demande
  users?: User
}

// Interface Document - mise à jour
export interface Document {
  id: string
  nom: string
  type: string
  taille: number
  url: string
  chemin?: string
  statut?: string
  user_id: string
  demande_id?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

// Interface Document avec relations
export interface DocumentWithRelations extends Document {
  users?: User
  demandes?: Demande
}

// Interface FileUpload - nouvelle table
export interface FileUpload {
  id: string
  name: string
  type: string
  size: number
  url: string
  user_id: string
  demande_id: string
  created_at: string
}

// Interface FileUpload avec relations
export interface FileUploadWithRelations extends FileUpload {
  users?: User
  demandes?: Demande
}

// Interface Evaluation - mise à jour avec DECIMAL
export interface Evaluation {
  id: string
  stagiaire_id: string
  evaluateur_id: string
  type: "mi_parcours" | "finale" | "auto_evaluation"
  note_globale?: number
  competences_techniques?: number
  competences_relationnelles?: number
  autonomie?: number
  commentaires?: string
  date_evaluation: string
  created_at: string
  updated_at: string
}

// Interface Evaluation avec relations
export interface EvaluationWithRelations extends Evaluation {
  stagiaires?: StagiaireWithUser
  evaluateur?: User
}

// Interface Notification
export interface Notification {
  id: string
  user_id: string
  titre: string
  message: string
  type: "info" | "success" | "warning" | "error"
  lu: boolean
  date: string
  created_at: string
}

// Interface Notification avec relations
export interface NotificationWithRelations extends Notification {
  users?: User
}

// Interface Template
export interface Template {
  id: string
  nom: string
  type: "email" | "document" | "rapport"
  contenu: string
  variables: string[]
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

// Interface Template avec relations
export interface TemplateWithRelations extends Template {
  creator?: User
}

// Interface SystemSettings - nouvelle table
export interface SystemSettings {
  id: number
  app_name: string
  app_description: string
  company_name: string
  max_file_size: number
  allowed_file_types: string[]
  email_notifications: boolean
  auto_approve_requests: boolean
  backup_enabled: boolean
  maintenance_mode: boolean
  created_at: string
  updated_at: string
}

// Interface UserActionsLog - nouvelle table
export interface UserActionsLog {
  id: string
  user_id?: string
  action: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Interface UserActionsLog avec relations
export interface UserActionsLogWithRelations extends UserActionsLog {
  users?: User
}

// Types pour les statistiques du dashboard
export interface DashboardStats {
  users_total: number
  stagiaires_total: number
  tuteurs_total: number
  demandes_total: number
  demandes_en_attente: number
  demandes_approuvees: number
  documents_total: number
  evaluations_total: number
}

// Types Bridge Technologies spécifiques
export interface BridgeStats {
  stagiaires_actifs: number
  tuteurs_actifs: number
  rh_actifs: number
  admin_actifs: number
  total_employees_actifs: number
  total_employees: number
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Types pour les options de filtrage et tri
export interface FilterOptions {
  status?: string
  type?: string
  department?: string
  role?: UserRole
  company?: string
  dateRange?: {
    start: string
    end: string
  }
  search?: string
}

export interface SortOptions {
  field: string
  direction: "asc" | "desc"
}

// Types pour les options de recherche
export interface FindOptions {
  page?: number
  limit?: number
  filters?: FilterOptions
  sort?: SortOptions
  include?: string[]
}

// Types pour les métadonnées
export interface Metadata {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// Database type pour Supabase - mise à jour complète
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<User, "id" | "created_at">>
      }
      tuteurs: {
        Row: Tuteur
        Insert: Omit<Tuteur, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Tuteur, "id" | "created_at">>
      }
      stagiaires: {
        Row: Stagiaire
        Insert: Omit<Stagiaire, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Stagiaire, "id" | "created_at">>
      }
      demandes: {
        Row: Demande
        Insert: Omit<Demande, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Demande, "id" | "created_at">>
      }
      demandes_workflow: {
        Row: DemandeWorkflow
        Insert: Omit<DemandeWorkflow, "id" | "created_at">
        Update: Partial<Omit<DemandeWorkflow, "id" | "created_at">>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Document, "id" | "created_at">>
      }
      file_uploads: {
        Row: FileUpload
        Insert: Omit<FileUpload, "id" | "created_at">
        Update: Partial<Omit<FileUpload, "id" | "created_at">>
      }
      evaluations: {
        Row: Evaluation
        Insert: Omit<Evaluation, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Evaluation, "id" | "created_at">>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, "id" | "created_at">
        Update: Partial<Omit<Notification, "id" | "created_at">>
      }
      templates: {
        Row: Template
        Insert: Omit<Template, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Template, "id" | "created_at">>
      }
      system_settings: {
        Row: SystemSettings
        Insert: Omit<SystemSettings, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<SystemSettings, "id" | "created_at">>
      }
      user_actions_log: {
        Row: UserActionsLog
        Insert: Omit<UserActionsLog, "id" | "created_at">
        Update: Partial<Omit<UserActionsLog, "id" | "created_at">>
      }
    }
    Views: {
      bridge_stats: {
        Row: BridgeStats
      }
      dashboard_stats: {
        Row: {
          stagiaires_actifs: number
          demandes_en_attente: number
          demandes_approuvees: number
          demandes_rejetees: number
          documents_total: number
          evaluations_total: number
        }
      }
    }
    Functions: {
      get_bridge_dashboard_stats: {
        Args: {}
        Returns: DashboardStats[]
      }
    }
    Enums: {
      user_role: UserRole
      demande_status: DemandeStatus
      demande_type: DemandeType
      workflow_step: WorkflowStep
      workflow_action: WorkflowAction
    }
  }
}
