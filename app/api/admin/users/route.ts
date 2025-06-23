import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { settingsService } from "@/lib/services/settings-service"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { nom_complet, email, role, telephone, departement, poste, mot_de_passe } = body

    console.log("🔄 Création d'utilisateur avec les données:", {
      nom_complet,
      email,
      role,
      telephone,
      departement,
      poste,
    })

    // **UTILISATION DES PARAMÈTRES SYSTÈME** - Assignation automatique
    const autoAssignTuteur = await settingsService.getSetting("auto_assign_tuteur")
    const maxStagiairesPerTuteur = await settingsService.getSetting("max_stagiaires_per_tuteur")

    console.log("⚙️ Paramètres système:", { autoAssignTuteur, maxStagiairesPerTuteur })

    // Créer l'utilisateur dans Supabase Auth
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: mot_de_passe,
      email_confirm: true,
      user_metadata: {
        nom_complet,
        role,
      },
    })

    if (createError) {
      console.error("❌ Erreur création auth:", createError)
      throw createError
    }

    console.log("✅ Utilisateur auth créé:", authUser.user?.id)

    // Créer l'entrée dans la table users
    const { data: newUser, error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user!.id,
        nom_complet,
        email,
        role,
        telephone,
        departement,
        poste,
        statut: "actif",
      })
      .select()
      .single()

    if (userError) {
      console.error("❌ Erreur création user:", userError)
      // Supprimer l'utilisateur auth si erreur
      await supabase.auth.admin.deleteUser(authUser.user!.id)
      throw userError
    }

    console.log("✅ Utilisateur créé dans users:", newUser.id)

    // **IMPACT RÉEL DES PARAMÈTRES** - Si c'est un stagiaire ET assignation auto activée
    if (role === "stagiaire" && autoAssignTuteur) {
      console.log("🎯 Assignation automatique de tuteur activée")

      // Trouver le tuteur avec le moins de stagiaires (respectant la limite)
      const { data: tuteurs, error: tuteursError } = await supabase
        .from("users")
        .select(`
          id, nom_complet,
          stagiaires:stagiaires(count)
        `)
        .eq("role", "tuteur")
        .eq("statut", "actif")

      if (tuteursError) {
        console.error("❌ Erreur récupération tuteurs:", tuteursError)
      } else {
        // Filtrer les tuteurs qui n'ont pas atteint la limite
        const tuteursDisponibles = tuteurs.filter((tuteur: any) => {
          const nombreStagiaires = tuteur.stagiaires?.[0]?.count || 0
          return nombreStagiaires < maxStagiairesPerTuteur
        })

        if (tuteursDisponibles.length > 0) {
          // Prendre le tuteur avec le moins de stagiaires
          const tuteurAssigne = tuteursDisponibles.reduce((min: any, current: any) => {
            const minCount = min.stagiaires?.[0]?.count || 0
            const currentCount = current.stagiaires?.[0]?.count || 0
            return currentCount < minCount ? current : min
          })

          console.log("👨‍🏫 Tuteur assigné:", tuteurAssigne.nom_complet)

          // Créer l'entrée stagiaire avec tuteur assigné
          const stageDurationMonths = await settingsService.getSetting("stage_duration_months")
          const dateDebut = new Date()
          const dateFin = new Date()
          dateFin.setMonth(dateFin.getMonth() + stageDurationMonths)

          const { error: stagiaireError } = await supabase.from("stagiaires").insert({
            user_id: authUser.user!.id,
            tuteur_id: tuteurAssigne.id,
            entreprise: "Bridge Technologies Solutions", // Fixe comme demandé
            poste: "Stagiaire", // Fixe comme demandé
            date_debut: dateDebut.toISOString(),
            date_fin: dateFin.toISOString(),
            statut: "actif",
          })

          if (stagiaireError) {
            console.error("❌ Erreur création stagiaire:", stagiaireError)
          } else {
            console.log("✅ Stagiaire créé avec tuteur assigné automatiquement")
          }
        } else {
          console.log("⚠️ Aucun tuteur disponible (limite atteinte)")
        }
      }
    }

    // Invalider le cache des paramètres pour les prochaines requêtes
    settingsService.invalidateCache()

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès",
      data: newUser,
    })
  } catch (error: any) {
    console.error("❌ Erreur complète:", error)
    return NextResponse.json(
      {
        error: "Erreur lors de la création de l'utilisateur",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  try {
    const supabase = await createClient()

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

    const { data: users, error } = await supabase
      .from("users")
      .select(`
        *,
        stagiaires(id, tuteur_id, entreprise, poste, statut)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
