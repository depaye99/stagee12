import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 })
    }

    // Récupérer l'utilisateur
    const { data: userData, error } = await supabase.from("users").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Erreur Supabase:", error)
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: userData })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 })
    }

    const body = await request.json()

    // Mettre à jour l'utilisateur
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (error) {
      console.error("Erreur mise à jour:", error)
      return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updatedUser })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Vérifier que l'ID est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(params.id)) {
      return NextResponse.json({ error: "ID utilisateur invalide" }, { status: 400 })
    }

    // Supprimer d'abord les entrées liées
    await supabase.from("stagiaires").delete().eq("user_id", params.id)
    await supabase.from("demandes").delete().eq("stagiaire_id", params.id)
    await supabase.from("notifications").delete().eq("user_id", params.id)

    // Supprimer l'utilisateur de notre table
    const { error: deleteError } = await supabase.from("users").delete().eq("id", params.id)

    if (deleteError) {
      console.error("Erreur suppression:", deleteError)
      return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
    }

    // Supprimer l'utilisateur de Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(params.id)
    } catch (authDeleteError) {
      console.warn("Erreur suppression auth (peut être normal):", authDeleteError)
    }

    return NextResponse.json({ success: true, message: "Utilisateur supprimé avec succès" })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
