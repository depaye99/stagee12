import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { notificationsService } from "@/lib/services/notifications-service"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const unreadOnly = searchParams.get("unread") === "true"

    if (unreadOnly) {
      const count = await notificationsService.getUnreadCount(session.user.id)
      return NextResponse.json({ count })
    }

    const notifications = await notificationsService.getByUserId(session.user.id, limit)
    return NextResponse.json({ notifications })
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error)
    return NextResponse.json({ error: "Erreur lors de la récupération des notifications" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = await request.json()
    const { titre, message, type, user_id } = body

    const notification = await notificationsService.create({
      user_id: user_id || session.user.id,
      titre,
      message,
      type: type || "info",
      lu: false,
      date: new Date().toISOString(),
    })

    return NextResponse.json({ notification })
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error)
    return NextResponse.json({ error: "Erreur lors de la création de la notification" }, { status: 500 })
  }
}
