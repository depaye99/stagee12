import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("🔍 API Admin Users POST - Début de la requête")

    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.log("❌ Pas de session utilisateur:", sessionError?.message)
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que l'utilisateur est admin
    const { data: adminProfile, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (adminError || !adminProfile || adminProfile.role !== "admin") {
      console.log("❌ Utilisateur non autorisé:", adminProfile?.role)
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    const { email, password, name, role, phone, department, position } = body

    console.log("📝 Données reçues:", { email, name, role, department })

    // Validation des données
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "Email, mot de passe, nom et rôle sont obligatoires" },
        { status: 400 },
      )
    }

    // Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("❌ Erreur création auth:", authError)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la création du compte: ${authError.message}` },
        { status: 400 },
      )
    }

    if (!authUser.user) {
      return NextResponse.json({ success: false, error: "Erreur lors de la création du compte" }, { status: 400 })
    }

    // Créer le profil utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        email,
        name,
        role,
        phone: phone || null,
        department: department || null,
        position: position || null,
        is_active: true,
      })
      .select()
      .single()

    if (profileError) {
      console.error("❌ Erreur création profil:", profileError)

      // Supprimer l'utilisateur auth en cas d'erreur
      await supabase.auth.admin.deleteUser(authUser.user.id)

      return NextResponse.json(
        { success: false, error: `Erreur lors de la création du profil: ${profileError.message}` },
        { status: 400 },
      )
    }

    console.log("✅ Utilisateur créé avec succès:", userProfile.id)

    return NextResponse.json({
      success: true,
      data: userProfile,
    })
  } catch (error: any) {
    console.error("💥 Erreur API Admin Users POST:", error)
    return NextResponse.json({ success: false, error: `Erreur interne du serveur: ${error.message}` }, { status: 500 })
  }
}

export async function GET() {
  try {
    console.log("🔍 API Admin Users - Début de la requête")

    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      console.log("❌ Pas de session utilisateur:", sessionError?.message)
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    console.log("✅ Session trouvée pour:", session.user.email)

    // Vérifier que l'utilisateur est admin
    const { data: adminProfile, error: adminError } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (adminError) {
      console.error("❌ Erreur récupération profil admin:", adminError)
      return NextResponse.json({ success: false, error: "Erreur de vérification des permissions" }, { status: 500 })
    }

    if (!adminProfile || adminProfile.role !== "admin") {
      console.log("❌ Utilisateur non autorisé:", adminProfile?.role)
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    console.log("✅ Utilisateur admin confirmé")

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        name,
        role,
        phone,
        department,
        position,
        is_active,
        created_at,
        last_login
      `)
      .order("created_at", { ascending: false })

    if (usersError) {
      console.error("❌ Erreur lors de la récupération des utilisateurs:", usersError)
      return NextResponse.json(
        { success: false, error: `Erreur lors de la récupération des utilisateurs: ${usersError.message}` },
        { status: 500 },
      )
    }

    console.log("✅ Utilisateurs récupérés:", users?.length || 0)

    return NextResponse.json({
      success: true,
      data: users || [],
    })
  } catch (error: any) {
    console.error("💥 Erreur API Admin Users:", error)
    return NextResponse.json({ success: false, error: `Erreur interne du serveur: ${error.message}` }, { status: 500 })
  }
}