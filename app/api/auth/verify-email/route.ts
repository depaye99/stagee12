import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const verifyEmailSchema = z.object({
  token: z.string().optional(),
  email: z.string().email().optional(),
  resend: z.boolean().optional()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { token, email, resend } = verifyEmailSchema.parse(body)

    if (resend && email) {
      // Renvoyer l'email de vérification
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        console.error("Erreur resend verification:", error)
        return NextResponse.json({ error: "Erreur lors du renvoi" }, { status: 500 })
      }

      return NextResponse.json({ 
        message: "Email de vérification renvoyé" 
      })
    }

    if (token) {
      // Vérifier le token
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email'
      })

      if (error) {
        console.error("Erreur verify email:", error)
        
        if (error.message.includes("expired")) {
          return NextResponse.json({ error: "Token expiré" }, { status: 400 })
        }
        
        if (error.message.includes("invalid")) {
          return NextResponse.json({ error: "Token invalide" }, { status: 400 })
        }
        
        return NextResponse.json({ error: "Erreur lors de la vérification" }, { status: 500 })
      }

      return NextResponse.json({ 
        message: "Email vérifié avec succès" 
      })
    }

    return NextResponse.json({ error: "Token ou email requis" }, { status: 400 })

  } catch (error) {
    console.error("Erreur verify email:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
