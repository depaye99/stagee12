import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
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

    // Récupérer tous les utilisateurs
    const { data: users, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error)
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Vérifier l'authentification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Erreur d'authentification:", authError)
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    // Vérifier le rôle admin
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      console.error("Utilisateur non admin:", profile)
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const body = await request.json()
    console.log("Données reçues:", body)

    const { email, password, name, role, phone, department, position } = body

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Créer l'utilisateur dans Supabase Auth en tant qu'admin
    console.log("Création utilisateur auth pour:", email)
    const { data: authData, error: authError2 } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
        phone,
        department,
        position,
      },
    })

    if (authError2) {
      console.error("Erreur création auth:", authError2)
      return NextResponse.json({ error: `Erreur auth: ${authError2.message}` }, { status: 400 })
    }

    if (!authData.user) {
      console.error("Aucun utilisateur retourné par auth")
      return NextResponse.json({ error: "Utilisateur non créé dans auth" }, { status: 400 })
    }

    console.log("Utilisateur auth créé:", authData.user.id)

    // Créer le profil utilisateur dans notre table
    const userData = {
      id: authData.user.id,
      email,
      name,
      role,
      phone: phone || null,
      department: department || null,
      position: position || null,
      is_active: true,
    }

    console.log("Création profil utilisateur:", userData)

    const { data: newUser, error: profileError } = await supabase.from("users").insert([userData]).select().single()

    if (profileError) {
      console.error("Erreur création profil:", profileError)
      // Supprimer l'utilisateur auth si la création du profil échoue
      try {
        await supabase.auth.admin.deleteUser(authData.user.id)
      } catch (deleteError) {
        console.error("Erreur suppression utilisateur auth:", deleteError)
      }
      return NextResponse.json({ error: `Erreur profil: ${profileError.message}` }, { status: 500 })
    }

    console.log("Profil utilisateur créé:", newUser)

    // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
    if (role === "stagiaire") {
      try {
        console.log("Création entrée stagiaire pour:", authData.user.id)

        // Trouver un tuteur disponible
        const { data: tuteurs, error: tuteurError } = await supabase
          .from("users")
          .select("id, name")
          .eq("role", "tuteur")
          .eq("is_active", true)
          .limit(1)

        if (tuteurError) {
          console.error("Erreur recherche tuteur:", tuteurError)
        }

        const tuteurId = tuteurs && tuteurs.length > 0 ? tuteurs[0].id : null
        console.log("Tuteur assigné:", tuteurId)

        const { data: stagiaireData, error: stagiaireError } = await supabase
          .from("stagiaires")
          .insert([
            {
              user_id: authData.user.id,
              entreprise: "Bridge Technologies Solutions",
              poste: "Stagiaire",
              tuteur_id: tuteurId,
              statut: "actif",
            },
          ])
          .select()
          .single()

        if (stagiaireError) {
          console.error("Erreur création stagiaire:", stagiaireError)
          // Ne pas faire échouer la création si l'entrée stagiaire échoue
        } else {
          console.log("Entrée stagiaire créée:", stagiaireData)
        }
      } catch (error) {
        console.error("Exception lors de la création de l'entrée stagiaire:", error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: newUser,
    })
  } catch (error) {
    console.error("Erreur API complète:", error)
    return NextResponse.json(
      { error: `Erreur serveur: ${error instanceof Error ? error.message : "Inconnue"}` },
      { status: 500 },
    )
  }
}
