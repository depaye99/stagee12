export const languages = {
  fr: {
    name: "Français",
    flag: "🇫🇷",
    translations: {
      // Navigation
      home: "Accueil",
      contacts: "Contacts",
      company: "L'entreprise",
      services: "Services",
      profile: "Mon profil",
      logout: "Déconnexion",

      // Dashboard
      welcome: "Bonjour",
      dashboard: "Tableau de bord",
      activities: "Ceci est votre tableau de bord qui recense l'ensemble de vos activités",

      // Stagiaires
      activeInterns: "Stagiaires actifs",
      currentInterns: "Stagiaire actuellement en entreprise",
      pendingRequests: "Nombre de demande en cours",
      pendingResponse: "Demande en attente de réponse",

      // Demandes
      requests: "Demandes",
      requestTracking: "Suivis des demandes",
      makeRequest: "Effectuer une demande",
      requestDetails: "Détails de la demande",

      // Statuts
      pending: "En attente",
      approved: "Validé",
      rejected: "Refusé",

      // Documents
      documents: "Documents",
      myDocuments: "Mes documents",

      // Notifications
      notification: "Notification",
      newRequestRegistered: "Une nouvelle demande à été enregistré",
      requestSentSuccessfully: "Votre demande à été envoyé avec succès",

      // Buttons
      submit: "Envoyer",
      cancel: "Annuler",
      save: "Enregistrer",
      edit: "Modifier",
      delete: "Supprimer",
      download: "Télécharger",
      upload: "Télécharger",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",

      // Forms
      email: "Email",
      password: "Mot de passe",
      name: "Nom",
      firstName: "Prénom",
      phone: "Téléphone",
      address: "Adresse",

      // Time
      date: "Date",
      startDate: "Date de début",
      endDate: "Date de fin",
      duration: "Durée",
      period: "Période",

      // Types
      academicInternship: "Stage académique",
      professionalInternship: "Stage professionnel",
      leave: "Congé",
      extension: "Prolongation",
      certificate: "Attestation",
    },
  },
  en: {
    name: "English",
    flag: "🇺🇸",
    translations: {
      // Navigation
      home: "Home",
      contacts: "Contacts",
      company: "Company",
      services: "Services",
      profile: "My Profile",
      logout: "Logout",

      // Dashboard
      welcome: "Hello",
      dashboard: "Dashboard",
      activities: "This is your dashboard that lists all your activities",

      // Stagiaires
      activeInterns: "Active Interns",
      currentInterns: "Interns currently in company",
      pendingRequests: "Pending Requests",
      pendingResponse: "Requests awaiting response",

      // Demandes
      requests: "Requests",
      requestTracking: "Request Tracking",
      makeRequest: "Make a Request",
      requestDetails: "Request Details",

      // Statuts
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",

      // Documents
      documents: "Documents",
      myDocuments: "My Documents",

      // Notifications
      notification: "Notification",
      newRequestRegistered: "A new request has been registered",
      requestSentSuccessfully: "Your request has been sent successfully",

      // Buttons
      submit: "Submit",
      cancel: "Cancel",
      save: "Save",
      edit: "Edit",
      delete: "Delete",
      download: "Download",
      upload: "Upload",
      search: "Search",
      filter: "Filter",
      export: "Export",

      // Forms
      email: "Email",
      password: "Password",
      name: "Name",
      firstName: "First Name",
      phone: "Phone",
      address: "Address",

      // Time
      date: "Date",
      startDate: "Start Date",
      endDate: "End Date",
      duration: "Duration",
      period: "Period",

      // Types
      academicInternship: "Academic Internship",
      professionalInternship: "Professional Internship",
      leave: "Leave",
      extension: "Extension",
      certificate: "Certificate",
    },
  },
}

export type Language = keyof typeof languages
export type TranslationKey = keyof typeof languages.fr.translations

export const useTranslation = (lang: Language = "fr") => {
  const t = (key: TranslationKey): string => {
    return languages[lang]?.translations[key] || languages.fr.translations[key] || key
  }

  return { t, language: lang }
}
