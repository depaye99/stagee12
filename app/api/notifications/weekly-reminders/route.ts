import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Récupérer tous les stagiaires actifs
    const { data: stagiaires, error: stagiaireError } = await supabase
      .from("stagiaires")
      .select(`
        id,
        user_id,
        users!user_id(name, email),
        demandes(id, type, statut, titre, created_at)
      `)
      .eq("statut", "actif")

    if (stagiaireError) throw stagiaireError

    const notifications = []

    for (const stagiaire of stagiaires || []) {
      // Notification sur les évaluations récentes
      const { data: recentEvaluations } = await supabase
        .from("evaluations")
        .select("id, type, date_evaluation, note_globale")
        .eq("stagiaire_id", stagiaire.id)
        .gte("date_evaluation", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order("date_evaluation", { ascending: false })

      if (recentEvaluations && recentEvaluations.length > 0) {
        const lastEvaluation = recentEvaluations[0]
        notifications.push({
          user_id: stagiaire.user_id,
          titre: "Résumé hebdomadaire - Nouvelles évaluations",
          message: `Vous avez reçu ${recentEvaluations.length} nouvelle(s) évaluation(s) cette semaine. Dernière note: ${lastEvaluation.note_globale || 'Non notée'}/20`,
          type: "info",
          related_type: "evaluation",
          related_id: lastEvaluation.id,
          action_url: "/stagiaire/evaluations",
          action_label: "Voir mes évaluations",
          priority: "normal",
          category: "weekly_summary",
        })
      }

      // Notification sur l'état des demandes
      const demandesEnAttente = stagiaire.demandes?.filter(d => d.statut === "en_attente") || []
      const demandesApprouvees = stagiaire.demandes?.filter(d => d.statut === "approuvee") || []
      const demandesRejetees = stagiaire.demandes?.filter(d => d.statut === "rejetee") || []

      if (demandesEnAttente.length > 0 || demandesApprouvees.length > 0 || demandesRejetees.length > 0) {
        let message = "État de vos demandes: "
        const details = []
        
        if (demandesEnAttente.length > 0) {
          details.push(`${demandesEnAttente.length} en attente`)
        }
        if (demandesApprouvees.length > 0) {
          details.push(`${demandesApprouvees.length} approuvée(s)`)
        }
        if (demandesRejetees.length > 0) {
          details.push(`${demandesRejetees.length} rejetée(s)`)
        }

        message += details.join(", ")

        notifications.push({
          user_id: stagiaire.user_id,
          titre: "Résumé hebdomadaire - État des demandes",
          message: message,
          type: demandesRejetees.length > 0 ? "warning" : "info",
          related_type: "demande",
          action_url: "/stagiaire/demandes",
          action_label: "Voir mes demandes",
          priority: "normal",
          category: "weekly_summary",
        })
      }

      // Notification de motivation/encouragement
      if (recentEvaluations && recentEvaluations.length > 0) {
        const avgScore = recentEvaluations
          .filter(e => e.note_globale)
          .reduce((sum, e) => sum + e.note_globale, 0) / recentEvaluations.filter(e => e.note_globale).length

        let motivationMessage = ""
        if (avgScore >= 16) {
          motivationMessage = "Excellent travail cette semaine ! Continuez sur cette lancée."
        } else if (avgScore >= 12) {
          motivationMessage = "Bon travail cette semaine ! Quelques améliorations peuvent vous aider à progresser."
        } else {
          motivationMessage = "Cette semaine peut être une opportunité d'apprentissage. N'hésitez pas à échanger avec votre tuteur."
        }

        notifications.push({
          user_id: stagiaire.user_id,
          titre: "Message hebdomadaire",
          message: motivationMessage,
          type: "info",
          priority: "low",
          category: "motivation",
        })
      }
    }

    // Insérer toutes les notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from("notifications")
        .insert(notifications)

      if (insertError) throw insertError
    }

    return NextResponse.json({
      success: true,
      message: `${notifications.length} notifications créées`,
      count: notifications.length,
    })
  } catch (error) {
    console.error("Erreur lors de la création des rappels hebdomadaires:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
