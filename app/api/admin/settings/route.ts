import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer tous les paramètres système
    const { data: settings, error } = await supabase.from("system_settings").select("key, value")

    if (error) {
      throw error
    }

    // Transformer en objet
    const settingsObject = settings.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    return NextResponse.json({ success: true, data: settingsObject })
  } catch (error) {
    console.error("Erreur lors de la récupération des paramètres:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const settings = await request.json()

    // Mettre à jour chaque paramètre
    for (const [key, value] of Object.entries(settings)) {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ key, value: JSON.stringify(value) }, { onConflict: "key" })

      if (error) {
        throw error
      }
    }

    return NextResponse.json({ success: true, message: "Paramètres mis à jour avec succès" })
  } catch (error) {
    console.error("Erreur lors de la mise à jour des paramètres:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
