
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalide"),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { email } = forgotPasswordSchema.parse(body)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    })

    if (error) {
      console.error("Erreur reset password:", error)
      return NextResponse.json({ error: "Erreur lors de l'envoi de l'email" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Un email de récupération a été envoyé" 
    })

  } catch (error) {
    console.error("Erreur forgot password:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
