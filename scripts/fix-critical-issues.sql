-- Script pour corriger les problèmes critiques de base de données

-- 1. Nettoyer et recréer les tables problématiques
DROP VIEW IF EXISTS stagiaires_complete;

-- 2. S'assurer que les tables de base existent
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'stagiaire',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stagiaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
    entreprise TEXT,
    poste TEXT,
    specialite TEXT,
    niveau TEXT,
    date_debut DATE,
    date_fin DATE,
    statut TEXT DEFAULT 'actif',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS demandes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    titre TEXT NOT NULL,
    description TEXT,
    statut TEXT DEFAULT 'en_attente',
    date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    date_reponse TIMESTAMP WITH TIME ZONE,
    commentaire_reponse TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL,
    type TEXT,
    taille INTEGER,
    url TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
    evaluateur_id UUID REFERENCES users(id) ON DELETE CASCADE,
    note_globale DECIMAL(4,2),
    competences_techniques DECIMAL(4,2),
    competences_relationnelles DECIMAL(4,2),
    autonomie DECIMAL(4,2),
    initiative DECIMAL(4,2),
    ponctualite DECIMAL(4,2),
    commentaires TEXT,
    points_forts TEXT,
    axes_amelioration TEXT,
    objectifs_futurs TEXT,
    date_evaluation DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Créer des index essentiels
CREATE INDEX IF NOT EXISTS idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX IF NOT EXISTS idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX IF NOT EXISTS idx_demandes_stagiaire_id ON demandes(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_stagiaire_id ON evaluations(stagiaire_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- 4. Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. Politiques RLS simplifiées
-- Users
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid() OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh')
    ));

-- Stagiaires
DROP POLICY IF EXISTS "Stagiaires access policy" ON stagiaires;
CREATE POLICY "Stagiaires access policy" ON stagiaires
    FOR SELECT USING (
        user_id = auth.uid() OR 
        tuteur_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
    );

-- Demandes
DROP POLICY IF EXISTS "Demandes access policy" ON demandes;
CREATE POLICY "Demandes access policy" ON demandes
    FOR SELECT USING (
        stagiaire_id IN (SELECT id FROM stagiaires WHERE user_id = auth.uid()) OR
        stagiaire_id IN (SELECT id FROM stagiaires WHERE tuteur_id = auth.uid()) OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
    );

-- Documents
DROP POLICY IF EXISTS "Documents access policy" ON documents;
CREATE POLICY "Documents access policy" ON documents
    FOR SELECT USING (
        user_id = auth.uid() OR 
        is_public = true OR 
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh', 'tuteur'))
    );

-- Evaluations
DROP POLICY IF EXISTS "Evaluations access policy" ON evaluations;
CREATE POLICY "Evaluations access policy" ON evaluations
    FOR SELECT USING (
        stagiaire_id IN (SELECT id FROM stagiaires WHERE user_id = auth.uid()) OR
        evaluateur_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'rh'))
    );

-- Notifications
DROP POLICY IF EXISTS "Notifications access policy" ON notifications;
CREATE POLICY "Notifications access policy" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- 6. Insérer des données de test si elles n'existent pas
INSERT INTO users (id, email, name, role) VALUES 
    ('651476b2-6f1b-40be-a1a3-6a854f690e76', 'admin@bridge-tech.fr', 'Admin Bridge', 'admin'),
    ('751476b2-6f1b-40be-a1a3-6a854f690e77', 'rh@bridge-tech.fr', 'RH Bridge', 'rh'),
    ('851476b2-6f1b-40be-a1a3-6a854f690e78', 'tuteur@bridge-tech.fr', 'Tuteur Bridge', 'tuteur'),
    ('951476b2-6f1b-40be-a1a3-6a854f690e79', 'stagiaire@bridge-tech.fr', 'Stagiaire Bridge', 'stagiaire')
ON CONFLICT (email) DO NOTHING;

-- Insérer un stagiaire de test
INSERT INTO stagiaires (id, user_id, tuteur_id, entreprise, poste, statut) VALUES 
    ('a51476b2-6f1b-40be-a1a3-6a854f690e80', '951476b2-6f1b-40be-a1a3-6a854f690e79', '851476b2-6f1b-40be-a1a3-6a854f690e78', 'Bridge Tech', 'Développeur Junior', 'actif')
ON CONFLICT (id) DO NOTHING;

-- Insérer quelques demandes de test
INSERT INTO demandes (stagiaire_id, type, titre, description, statut) VALUES 
    ('a51476b2-6f1b-40be-a1a3-6a854f690e80', 'conge', 'Demande de congé', 'Demande de congé pour raisons personnelles', 'en_attente'),
    ('a51476b2-6f1b-40be-a1a3-6a854f690e80', 'materiel', 'Demande de matériel', 'Besoin d\'un ordinateur portable', 'approuvee')
ON CONFLICT DO NOTHING;

-- Insérer quelques notifications de test
INSERT INTO notifications (user_id, titre, message, type) VALUES 
    ('951476b2-6f1b-40be-a1a3-6a854f690e79', 'Bienvenue', 'Bienvenue dans votre espace stagiaire', 'info'),
    ('851476b2-6f1b-40be-a1a3-6a854f690e78', 'Nouveau stagiaire', 'Un nouveau stagiaire vous a été assigné', 'info')
ON CONFLICT DO NOTHING;
