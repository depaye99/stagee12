
import { createClient } from "@/lib/supabase/client"
import type { DemandeWorkflow, DemandeWorkflowWithRelations, ApiResponse, WorkflowStep, WorkflowAction } from "@/lib/supabase/database.types"
import { BaseService } from "./base-service"

class WorkflowService extends BaseService<DemandeWorkflow> {
  constructor() {
    super("demandes_workflow")
  }

  async findByDemandeId(demandeId: string): Promise<ApiResponse<DemandeWorkflowWithRelations[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*, demandes(*), users(*)")
        .eq("demande_id", demandeId)
        .order("created_at", { ascending: true })

      if (error) throw error

      return {
        success: true,
        data: data as DemandeWorkflowWithRelations[],
        error: null,
      }
    } catch (error) {
      console.error("Error in findByDemandeId:", error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async addWorkflowStep(
    demandeId: string,
    step: WorkflowStep,
    userId: string,
    action: WorkflowAction,
    comments?: string
  ): Promise<ApiResponse<DemandeWorkflow>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert({
          demande_id: demandeId,
          step,
          user_id: userId,
          action,
          comments,
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as DemandeWorkflow,
        error: null,
      }
    } catch (error) {
      console.error("Error in addWorkflowStep:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getCurrentStep(demandeId: string): Promise<ApiResponse<WorkflowStep>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("step")
        .eq("demande_id", demandeId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data.step as WorkflowStep,
        error: null,
      }
    } catch (error) {
      console.error("Error in getCurrentStep:", error)
      return {
        success: false,
        data: "stagiaire",
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getNextStep(currentStep: WorkflowStep): WorkflowStep {
    const stepOrder: WorkflowStep[] = ["stagiaire", "tuteur", "rh", "finance", "termine"]
    const currentIndex = stepOrder.indexOf(currentStep)
    return stepOrder[currentIndex + 1] || "termine"
  }

  async canUserApprove(step: WorkflowStep, userRole: string): boolean {
    const permissions: Record<WorkflowStep, string[]> = {
      stagiaire: ["stagiaire"],
      tuteur: ["tuteur", "admin"],
      rh: ["rh", "admin"],
      finance: ["admin"], // Seuls les admins peuvent approuver les finances
      termine: [],
    }

    return permissions[step]?.includes(userRole) || false
  }

  async approveStep(
    demandeId: string,
    currentStep: WorkflowStep,
    userId: string,
    comments?: string
  ): Promise<ApiResponse<{ nextStep: WorkflowStep; workflow: DemandeWorkflow }>> {
    try {
      const nextStep = this.getNextStep(currentStep)

      // Ajouter l'étape d'approbation
      const workflowResult = await this.addWorkflowStep(
        demandeId,
        currentStep,
        userId,
        "approve",
        comments
      )

      if (!workflowResult.success) {
        throw new Error(workflowResult.error)
      }

      // Si ce n'est pas terminé, ajouter l'étape suivante
      if (nextStep !== "termine") {
        await this.addWorkflowStep(demandeId, nextStep, userId, "pending")
      }

      // Mettre à jour le statut de la demande
      let newStatus = "en_cours"
      if (nextStep === "termine") {
        newStatus = "approuvee"
      }

      await this.supabase
        .from("demandes")
        .update({ 
          statut: newStatus,
          date_reponse: nextStep === "termine" ? new Date().toISOString() : null,
          commentaire_reponse: nextStep === "termine" ? comments : null
        })
        .eq("id", demandeId)

      return {
        success: true,
        data: {
          nextStep,
          workflow: workflowResult.data!,
        },
        error: null,
      }
    } catch (error) {
      console.error("Error in approveStep:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async rejectStep(
    demandeId: string,
    currentStep: WorkflowStep,
    userId: string,
    comments: string
  ): Promise<ApiResponse<DemandeWorkflow>> {
    try {
      // Ajouter l'étape de rejet
      const workflowResult = await this.addWorkflowStep(
        demandeId,
        currentStep,
        userId,
        "reject",
        comments
      )

      if (!workflowResult.success) {
        throw new Error(workflowResult.error)
      }

      // Mettre à jour le statut de la demande
      await this.supabase
        .from("demandes")
        .update({ 
          statut: "rejetee",
          date_reponse: new Date().toISOString(),
          commentaire_reponse: comments
        })
        .eq("id", demandeId)

      return workflowResult
    } catch (error) {
      console.error("Error in rejectStep:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export const workflowService = new WorkflowService()
