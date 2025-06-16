import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format") || "csv"
    const type = searchParams.get("type") || "demandes"

    let data: any[] = []
    let headers: string[] = []

    switch (type) {
      case "demandes":
        const { data: demandes } = await supabase.from("demandes").select(`
            *,
            stagiaire:stagiaires(
              *,
              user:users(first_name, last_name, email)
            )
          `)

        data = demandes || []
        headers = ["ID", "Titre", "Type", "Statut", "Date création", "Stagiaire", "Email"]
        break

      case "stagiaires":
        const { data: stagiaires } = await supabase.from("stagiaires").select(`
            *,
            user:users(first_name, last_name, email),
            tuteur:users!tuteur_id(first_name, last_name)
          `)

        data = stagiaires || []
        headers = ["ID", "Nom", "Prénom", "Email", "Entreprise", "Poste", "Tuteur", "Statut"]
        break
    }

    if (format === "csv") {
      const csvContent = generateCSV(data, headers, type)

      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}_export.csv"`,
        },
      })
    }

    return NextResponse.json({ data, headers })
  } catch (error) {
    console.error("Erreur export:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

function generateCSV(data: any[], headers: string[], type: string): string {
  const csvHeaders = headers.join(",")

  const csvRows = data.map((item) => {
    switch (type) {
      case "demandes":
        return [
          item.id,
          `"${item.titre}"`,
          item.type,
          item.statut,
          new Date(item.created_at).toLocaleDateString(),
          `"${item.stagiaire?.user?.first_name} ${item.stagiaire?.user?.last_name}"`,
          item.stagiaire?.user?.email,
        ].join(",")

      case "stagiaires":
        return [
          item.id,
          `"${item.user?.last_name}"`,
          `"${item.user?.first_name}"`,
          item.user?.email,
          `"${item.entreprise || ""}"`,
          `"${item.poste || ""}"`,
          `"${item.tuteur?.first_name} ${item.tuteur?.last_name}"`,
          item.statut,
        ].join(",")

      default:
        return ""
    }
  })

  return [csvHeaders, ...csvRows].join("\n")
}
