import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User, AuthError } from '@supabase/supabase-js'
import { UserRole } from '../supabase/database.types'

export interface AuthUser extends User {
  role?: UserRole
  profile?: {
    name: string
    department?: string
    position?: string
    avatar_url?: string
  }
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { UserRole } from '@/lib/supabase/database.types'

interface AuthUser extends User {
  role: UserRole
  profile: {
    name: string
    department?: string
    position?: string
    avatar_url?: string
  }
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

class AuthService {
  private supabase = createClient()
  private listeners: Set<(state: AuthState) => void> = new Set()
  private currentState: AuthState = {
    user: null,
    loading: true,
    error: null
  }

  constructor() {
    this.initializeAuth()
  }

  private async initializeAuth() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        this.updateState({ user: null, loading: false, error: error.message })
        return
      }

      if (session?.user) {
        const userWithProfile = await this.fetchUserProfile(session.user)
        this.updateState({ user: userWithProfile, loading: false, error: null })
      } else {
        this.updateState({ user: null, loading: false, error: null })
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userWithProfile = await this.fetchUserProfile(session.user)
          this.updateState({ user: userWithProfile, loading: false, error: null })
        } else if (event === 'SIGNED_OUT') {
          this.updateState({ user: null, loading: false, error: null })
        }
      })
    } catch (error) {
      this.updateState({ 
        user: null, 
        loading: false, 
        error: error instanceof Error ? error.message : 'Authentication error'
      })
    }
  }

  private async fetchUserProfile(user: User): Promise<AuthUser> {
    try {
      const { data: profile, error } = await this.supabase
        .from('users')
        .select('name, role, department, position, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        console.warn('Failed to fetch user profile:', error)
        return {
          ...user,
          role: 'stagiaire',
          profile: { name: user.email || 'Unknown User' }
        }
      }

      return {
        ...user,
        role: profile.role as UserRole,
        profile: {
          name: profile.name,
          department: profile.department,
          position: profile.position,
          avatar_url: profile.avatar_url
        }
      }
    } catch (error) {
      console.warn('Error fetching user profile:', error)
      return {
        ...user,
        role: 'stagiaire',
        profile: { name: user.email || 'Unknown User' }
      }
    }
  }

  private updateState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState }
    this.listeners.forEach(listener => listener(this.currentState))
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.currentState)

    return () => {
      this.listeners.delete(listener)
    }
  }

  public getCurrentState(): AuthState {
    return { ...this.currentState }
  }

  public async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ loading: true, error: null })

      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        this.updateState({ loading: false, error: error.message })
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed'
      this.updateState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  public async signUp(email: string, password: string, userData: {
    name: string
    role: UserRole
    department?: string
    position?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      this.updateState({ loading: true, error: null })

      const { data, error: signUpError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          }
        }
      })

      if (signUpError) {
        this.updateState({ loading: false, error: signUpError.message })
        return { success: false, error: signUpError.message }
      }

      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await this.supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email!,
            name: userData.name,
            role: userData.role,
            department: userData.department,
            position: userData.position
          })

        if (profileError) {
          console.warn('Failed to create user profile:', profileError)
        }
      }

      this.updateState({ loading: false, error: null })
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed'
      this.updateState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  public async signOut(): Promise<void> {
    try {
      this.updateState({ loading: true, error: null })
      await this.supabase.auth.signOut()
      this.updateState({ user: null, loading: false, error: null })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed'
      this.updateState({ loading: false, error: errorMessage })
    }
  }

  public async updateProfile(updates: {
    name?: string
    department?: string
    position?: string
    phone?: string
    address?: string
  }): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.currentState.user) {
        return { success: false, error: 'User not authenticated' }
      }

      this.updateState({ loading: true, error: null })

      const { error } = await this.supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentState.user.id)

      if (error) {
        this.updateState({ loading: false, error: error.message })
        return { success: false, error: error.message }
      }

      // Refresh user profile
      const updatedUser = await this.fetchUserProfile(this.currentState.user)
      this.updateState({ user: updatedUser, loading: false, error: null })

      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed'
      this.updateState({ loading: false, error: errorMessage })
      return { success: false, error: errorMessage }
    }
  }

  public hasRole(role: UserRole): boolean {
    return this.currentState.user?.role === role || this.currentState.user?.role === 'admin'
  }

  public canAccess(requiredRole: UserRole): boolean {
    const userRole = this.currentState.user?.role
    if (!userRole) return false

    // Admin can access everything
    if (userRole === 'admin') return true

    // User can access their own role's resources
    return userRole === requiredRole
  }
}

export const authService = new AuthService()
