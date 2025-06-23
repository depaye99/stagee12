import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { LoggingService } from "@/lib/services/logging-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les paramètres de pagination
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('user_id')

    let result
    if (userId) {
      result = await LoggingService.getUserLogs(userId, page, limit)
    } else {
      result = await LoggingService.getLogs(page, limit)
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des logs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification et les permissions
    const {
      data: { session },
    } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: currentUser } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    const { daysToKeep = 90 } = await request.json()

    await LoggingService.cleanOldLogs(daysToKeep)

    return NextResponse.json({
      success: true,
      message: `Logs antérieurs à ${daysToKeep} jours supprimés`
    })
  } catch (error) {
    console.error("Erreur lors du nettoyage des logs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
