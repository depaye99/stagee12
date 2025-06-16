import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const { data: currentUser } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (!currentUser || currentUser.role !== "tuteur") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 })
    }

    // Récupérer les stagiaires du tuteur
    const { data: stagiaires, error } = await supabase
      .from("stagiaires")
      .select(`
        *,
        users!user_id(name, email, phone)
      `)
      .eq("tuteur_id", session.user.id)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: stagiaires })
  } catch (error) {
    console.error("Erreur lors de la récupération des stagiaires:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
