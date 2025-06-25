import { BackButton } from "@/components/ui/back-button"

export default function NewUserPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <BackButton href="/admin/users" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Nouvel utilisateur</h1>
            <p className="text-gray-600">Créer un nouveau compte utilisateur</p>
          </div>
        </div>
      </div>

      {/* Formulaire de création d'utilisateur */}
      <div className="bg-white shadow rounded-lg p-8">
        <h2 className="text-xl font-semibold mb-4">Informations de l'utilisateur</h2>
        {/* Ajoutez ici le formulaire de création d'utilisateur */}
        <p>Formulaire de création d'utilisateur à implémenter.</p>
      </div>
    </div>
  )
}
