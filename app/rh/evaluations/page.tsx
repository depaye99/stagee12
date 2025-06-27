"use client"

import { useState } from "react"

interface Evaluation {
  id: string
  stagiaire_id: string
  evaluateur_id: string
  type: "mi_parcours" | "finale" | "auto_evaluation"
  note_globale?: number
  competences_techniques?: number
  competences_relationnelles?: number
  autonomie?: number
  commentaires?: string
  date_evaluation: string
  created_at: string
  stagiaires?: {
    users: {
      name: string
      email: string
    }
  }
  evaluateur?: {
    name: string
    email: string
  }
}

export default function RHEvaluationsPage() {
  const [user, setUser] = useState<any>(null)
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)

  // ** rest of code here **
}
