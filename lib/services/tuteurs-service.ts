
import { createClient } from "@/lib/supabase/client"
import type { Tuteur, TuteurWithUser, ApiResponse, PaginatedResponse, FindOptions } from "@/lib/supabase/database.types"
import { BaseService } from "./base-service"

class TuteursService extends BaseService<Tuteur> {
  constructor() {
    super("tuteurs")
  }

  async findWithUser(id: string): Promise<ApiResponse<TuteurWithUser>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*, users!user_id(*)")
        .eq("id", id)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as TuteurWithUser,
        error: null,
      }
    } catch (error) {
      console.error("Error in findWithUser:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async findByUserId(userId: string): Promise<ApiResponse<TuteurWithUser>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select("*, users!user_id(*)")
        .eq("user_id", userId)
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as TuteurWithUser,
        error: null,
      }
    } catch (error) {
      console.error("Error in findByUserId:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async findAllWithUsers(options?: FindOptions): Promise<PaginatedResponse<TuteurWithUser>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select("*, users!user_id(*)", { count: "exact" })

      // Apply filters
      if (options?.filters) {
        const { filters } = options
        if (filters.search) {
          query = query.or(`specialite.ilike.%${filters.search}%,users.name.ilike.%${filters.search}%`)
        }
      }

      // Apply sorting
      if (options?.sort) {
        const { field, direction } = options.sort
        query = query.order(field, { ascending: direction === "asc" })
      } else {
        query = query.order("created_at", { ascending: false })
      }

      // Apply pagination
      const page = options?.page || 1
      const limit = options?.limit || 10
      const offset = (page - 1) * limit

      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      const totalPages = Math.ceil((count || 0) / limit)

      return {
        success: true,
        data: data as TuteurWithUser[],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
        },
        error: null,
      }
    } catch (error) {
      console.error("Error in findAllWithUsers:", error)
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async getStagiairesCount(userId: string): Promise<ApiResponse<number>> {
    try {
      const { count, error } = await this.supabase
        .from("stagiaires")
        .select("*", { count: "exact", head: true })
        .eq("tuteur_id", userId)
        .eq("statut", "actif")

      if (error) throw error

      return {
        success: true,
        data: count || 0,
        error: null,
      }
    } catch (error) {
      console.error("Error in getStagiairesCount:", error)
      return {
        success: false,
        data: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async updateSpecialite(id: string, specialite: string): Promise<ApiResponse<Tuteur>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({ specialite, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Tuteur,
        error: null,
      }
    } catch (error) {
      console.error("Error in updateSpecialite:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async updateMaxStagiaires(id: string, maxStagiaires: number): Promise<ApiResponse<Tuteur>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({ max_stagiaires: maxStagiaires, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        data: data as Tuteur,
        error: null,
      }
    } catch (error) {
      console.error("Error in updateMaxStagiaires:", error)
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

export const tuteurService = new TuteursService()
