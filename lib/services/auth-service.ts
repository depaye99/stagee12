import { createClient } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/supabase/database.types"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name: string
  phone?: string
  address?: string
  department?: string
  position?: string
  avatar_url?: string
  is_active?: boolean
  email_confirmed?: boolean
}

class AuthService {
  private supabase = createClient()

  async signIn(
    email: string,
    password: string,
  ): Promise<{
    user: AuthUser | null
    error: Error | null
  }> {
    try {
      // First, try to sign in with Supabase Auth
      const { data: authData, error: authError } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("Supabase auth error:", authError)

        // Provide helpful error messages
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error(
            `Identifiants invalides pour ${email}. ` +
              `Vérifiez votre email et mot de passe. ` +
              `Si vous venez de créer votre compte, assurez-vous que votre email est confirmé.`,
          )
        }

        if (authError.message.includes("Email not confirmed")) {
          throw new Error(
            `Email non confirmé pour ${email}. ` +
              `Vérifiez votre boîte mail ou utilisez l'outil de confirmation manuelle en mode développement.`,
          )
        }

        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("No user returned from authentication")
      }

      // Try to get user profile from our users table
      let profile = await this.getUserProfile(authData.user.id)

      // If profile doesn't exist, create it from auth user data
      if (!profile) {
        console.log("User profile not found, creating from auth data...")
        profile = await this.createUserProfileSafe(authData.user)
      }

      // Update last login (don't throw if this fails)
      try {
        await this.updateLastLogin(authData.user.id)
      } catch (error) {
        console.warn("Failed to update last login:", error)
      }

      return { user: profile, error: null }
    } catch (error) {
      console.error("Sign in error:", error)
      return {
        user: null,
        error: error instanceof Error ? error : new Error("Unknown authentication error"),
      }
    }
  }

  async signUp(
    email: string,
    password: string,
    userData: {
      name: string
      role: UserRole
      phone?: string
      address?: string
      department?: string
      position?: string
    },
  ): Promise<{
    user: AuthUser | null
    error: Error | null
  }> {
    try {
      // Try to sign up with Supabase
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role,
            phone: userData.phone,
            address: userData.address,
            department: userData.department,
            position: userData.position,
          },
        },
      })

      if (error) {
        console.error("Supabase signup error:", error)
        throw error
      }

      if (!data.user) {
        throw new Error("No user returned from registration")
      }

      // Create user profile in our users table safely
      const profile = await this.createUserProfileSafe(data.user, userData)

      return { user: profile, error: null }
    } catch (error) {
      console.error("Sign up error:", error)
      return {
        user: null,
        error: error instanceof Error ? error : new Error("Unknown registration error"),
      }
    }
  }

  private async createUserProfileSafe(authUser: any, userData?: any): Promise<AuthUser> {
    try {
      // Start with basic required fields only
      const basicProfile = {
        id: authUser.id,
        email: authUser.email!,
        name: userData?.name || authUser.user_metadata?.name || authUser.email!.split("@")[0],
        role: ((userData?.role || authUser.user_metadata?.role) as UserRole) || "stagiaire",
      }

      // Try to insert with basic fields first
      const { data: createdProfile, error: insertError } = await this.supabase
        .from("users")
        .insert([basicProfile])
        .select()
        .single()

      if (insertError) {
        console.error("Basic profile creation failed:", insertError)
        // Return a basic profile even if database insert fails
        return {
          id: authUser.id,
          email: authUser.email!,
          name: basicProfile.name,
          role: basicProfile.role,
          email_confirmed: !!authUser.email_confirmed_at,
        }
      }

      // Try to update with additional fields if they exist
      if (userData?.phone || userData?.address || userData?.department || userData?.position) {
        try {
          const updateData: any = {}
          if (userData.phone) updateData.phone = userData.phone
          if (userData.address) updateData.address = userData.address
          if (userData.department) updateData.department = userData.department
          if (userData.position) updateData.position = userData.position

          await this.supabase.from("users").update(updateData).eq("id", authUser.id)
        } catch (updateError) {
          console.warn("Failed to update additional profile fields:", updateError)
        }
      }

      return {
        id: createdProfile.id,
        email: createdProfile.email,
        role: createdProfile.role,
        name: createdProfile.name,
        phone: createdProfile.phone,
        address: createdProfile.address,
        department: createdProfile.department,
        position: createdProfile.position,
        avatar_url: createdProfile.avatar_url,
        is_active: createdProfile.is_active,
        email_confirmed: !!authUser.email_confirmed_at,
      }
    } catch (error) {
      console.error("Profile creation exception:", error)
      // Return a basic profile from auth data
      return {
        id: authUser.id,
        email: authUser.email!,
        role: ((userData?.role || authUser.user_metadata?.role) as UserRole) || "stagiaire",
        name: userData?.name || authUser.user_metadata?.name || authUser.email!.split("@")[0],
        phone: userData?.phone || authUser.user_metadata?.phone,
        email_confirmed: !!authUser.email_confirmed_at,
      }
    }
  }

  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error("Sign out error:", error)
      return {
        error: error instanceof Error ? error : new Error("Unknown error"),
      }
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()
      if (error) throw error

      if (!user) return null

      return await this.getUserProfile(user.id)
    } catch (error) {
      console.error("Get current user error:", error)
      return null
    }
  }

  async getUserProfile(userId: string): Promise<AuthUser | null> {
    try {
      const { data: profile, error } = await this.supabase.from("users").select("*").eq("id", userId).single()

      if (error) {
        if (error.code === "PGRST116") {
          // No rows returned
          return null
        }
        if (error.code === "42P01") {
          // Table doesn't exist
          console.warn("Users table doesn't exist yet")
          return null
        }
        throw error
      }

      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name,
        phone: profile.phone,
        address: profile.address,
        department: profile.department,
        position: profile.position,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active,
        email_confirmed: true, // If they can login, email is confirmed
      }
    } catch (error) {
      console.error("Get user profile error:", error)
      return null
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    try {
      // Try to update, but don't fail if columns don't exist
      await this.supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    } catch (error) {
      console.warn("Update last login failed (this is OK if columns don't exist):", error)
    }
  }
}

// Export de l'instance du service
export const authService = new AuthService()
