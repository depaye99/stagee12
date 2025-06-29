import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    const { email } = forgotPasswordSchema.parse(body)

    // Vérifier que l'utilisateur existe
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single()

    if (userError || !user) {
      // Pour des raisons de sécurité, on ne révèle pas si l'email existe
      return NextResponse.json({ 
        message: "Si cette adresse email existe, un lien de réinitialisation a été envoyé" 
      })
    }

    // Utiliser la fonction de réinitialisation de Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`
    })

    if (error) {
      console.error("Erreur reset password:", error)
      return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Si cette adresse email existe, un lien de réinitialisation a été envoyé" 
    })

  } catch (error) {
    console.error("Erreur forgot password:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
