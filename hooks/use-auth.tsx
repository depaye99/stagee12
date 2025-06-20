'use client'

import { useEffect, useState } from 'react'
import { authService, AuthState } from '@/lib/services/auth-service'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => authService.getCurrentState())

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState)
    return unsubscribe
  }, [])

  return {
    user: authState.user,
    loading: authState.loading,
    error: authState.error,
    signIn: authService.signIn.bind(authService),
    signUp: authService.signUp.bind(authService),
    signOut: authService.signOut.bind(authService),
    updateProfile: authService.updateProfile.bind(authService),
    hasRole: authService.hasRole.bind(authService),
    canAccess: authService.canAccess.bind(authService),
    isAuthenticated: !!authState.user
  }
}
