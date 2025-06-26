
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { z } from "zod"

const verifyEmailSchema = z.object({
  email: z.string().email("Email invalide"),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { email } = verifyEmailSchema.parse(body)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify-email?confirmed=true`
      }
    })

    if (error) {
      console.error("Erreur resend verification:", error)
      return NextResponse.json({ error: "Erreur lors de l'envoi" }, { status: 400 })
    }

    return NextResponse.json({ 
      message: "Email de vérification renvoyé" 
    })

  } catch (error) {
    console.error("Erreur verify email:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: "Données invalides", 
        details: error.errors 
      }, { status: 400 })
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const confirmed = searchParams.get("confirmed")

    if (confirmed === "true") {
      return NextResponse.redirect(new URL("/auth/login?verified=true", request.url))
    }

    return NextResponse.json({ message: "Vérification en attente" })

  } catch (error) {
    console.error("Erreur GET verify email:", error)
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 })
  }
}
