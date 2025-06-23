import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()

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

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()

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

    const body = await request.json()
    const { email, password, name, role, phone, department, position } = body

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 })
    }

    // Créer l'utilisateur dans Supabase Auth en tant qu'admin
    const { data: authData, error: authError2 } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmer l'email automatiquement
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
      return NextResponse.json({ error: authError2.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Utilisateur non créé" }, { status: 400 })
    }

    // Créer le profil utilisateur dans notre table
    const { data: newUser, error: profileError } = await supabase
      .from("users")
      .insert([
        {
          id: authData.user.id,
          email,
          name,
          role,
          phone: phone || null,
          department: department || null,
          position: position || null,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (profileError) {
      console.error("Erreur création profil:", profileError)
      // Supprimer l'utilisateur auth si la création du profil échoue
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Erreur lors de la création du profil" }, { status: 500 })
    }

    // Si c'est un stagiaire, créer l'entrée dans la table stagiaires
    if (role === "stagiaire") {
      try {
        // Assigner automatiquement un tuteur
        const { data: tuteurs } = await supabase
          .from("users")
          .select(`
            id, name,
            stagiaires_count:stagiaires(count)
          `)
          .eq("role", "tuteur")
          .eq("is_active", true)

        let tuteurId = null
        if (tuteurs && tuteurs.length > 0) {
          // Trouver le tuteur avec le moins de stagiaires
          const tuteurAvecMoinsDeStages = tuteurs.reduce((prev, current) => {
            const prevCount = prev.stagiaires_count?.[0]?.count || 0
            const currentCount = current.stagiaires_count?.[0]?.count || 0
            return currentCount < prevCount ? current : prev
          })
          tuteurId = tuteurAvecMoinsDeStages.id
        }

        const { error: stagiaireError } = await supabase.from("stagiaires").insert([
          {
            user_id: authData.user.id,
            entreprise: "Bridge Technologies Solutions",
            poste: "Stagiaire",
            tuteur_id: tuteurId,
            statut: "actif",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (stagiaireError) {
          console.error("Erreur création stagiaire:", stagiaireError)
          // Ne pas faire échouer la création si l'entrée stagiaire échoue
        }
      } catch (error) {
        console.error("Erreur lors de la création de l'entrée stagiaire:", error)
      }
    }

    return NextResponse.json({
      message: "Utilisateur créé avec succès",
      user: newUser,
    })
  } catch (error) {
    console.error("Erreur API:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
