import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(6)
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { token, password } = resetPasswordSchema.parse(body)

    // Vérifier et utiliser le token pour réinitialiser le mot de passe
    const { error } = await supabase.auth.updateUser({
      password: password
    })

    if (error) {
      console.error("Erreur reset password:", error)
      
      if (error.message.includes("Invalid")) {
        return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 400 })
      }
      
      return NextResponse.json({ error: "Erreur lors de la réinitialisation" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Mot de passe réinitialisé avec succès" 
    })

  } catch (error) {
    console.error("Erreur reset password:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
