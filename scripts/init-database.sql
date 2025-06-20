-- =====================================================
-- SCRIPT DE PRODUCTION - BRIDGE TECHNOLOGIES
-- Système de Gestion des Stagiaires
-- Version: 1.0
-- Date: 2024
-- =====================================================

-- Nettoyage initial (si nécessaire)
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS demandes_workflow CASCADE;
DROP TABLE IF EXISTS demandes CASCADE;
DROP TABLE IF EXISTS stagiaires CASCADE;
DROP TABLE IF EXISTS tuteurs CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS user_actions_log CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des utilisateurs (employés Bridge Technologies uniquement)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'stagiaire' CHECK (role IN ('admin', 'rh', 'tuteur', 'stagiaire')),
  phone VARCHAR(20),
  address TEXT,
  department VARCHAR(100),
  position VARCHAR(100),
  avatar_url TEXT,
  company VARCHAR(100) DEFAULT 'Bridge Technologies' NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contraintes
  CONSTRAINT users_email_unique UNIQUE (email),
  CONSTRAINT check_company CHECK (company = 'Bridge Technologies')
);

-- Table des tuteurs
CREATE TABLE tuteurs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialite TEXT,
  max_stagiaires INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des stagiaires
CREATE TABLE stagiaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entreprise VARCHAR(255) DEFAULT 'Bridge Technologies',
  poste VARCHAR(255),
  date_debut DATE,
  date_fin DATE,
  statut VARCHAR(50) DEFAULT 'actif' CHECK (statut IN ('actif', 'termine', 'suspendu')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des demandes
CREATE TABLE demandes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
  tuteur_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('stage_academique', 'stage_professionnel', 'conge', 'prolongation', 'attestation')),
  titre VARCHAR(255) NOT NULL,
  description TEXT,
  statut VARCHAR(50) DEFAULT 'en_attente' CHECK (statut IN ('en_attente', 'approuvee', 'rejetee', 'en_cours', 'terminee')),
  date_demande TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date_reponse TIMESTAMP WITH TIME ZONE,
  commentaire_reponse TEXT,
  documents_requis TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table du workflow des demandes
CREATE TABLE demandes_workflow (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demande_id UUID REFERENCES demandes(id) ON DELETE CASCADE,
  step VARCHAR(50) NOT NULL CHECK (step IN ('stagiaire', 'tuteur', 'rh', 'finance', 'termine')),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes', 'pending')),
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des documents
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  taille BIGINT NOT NULL,
  url TEXT NOT NULL,
  chemin VARCHAR(500),
  statut VARCHAR(50) DEFAULT 'actif',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  demande_id UUID REFERENCES demandes(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des uploads de fichiers
CREATE TABLE file_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  size BIGINT NOT NULL,
  url TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  demande_id UUID REFERENCES demandes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des évaluations
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stagiaire_id UUID REFERENCES stagiaires(id) ON DELETE CASCADE,
  evaluateur_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('mi_parcours', 'finale', 'auto_evaluation')),
  note_globale DECIMAL(3,2),
  competences_techniques DECIMAL(3,2),
  competences_relationnelles DECIMAL(3,2),
  autonomie DECIMAL(3,2),
  commentaires TEXT,
  date_evaluation DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  titre VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  lu BOOLEAN DEFAULT false,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des templates
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'document', 'rapport')),
  contenu TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table des paramètres système
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  app_name VARCHAR(255) DEFAULT 'Bridge Technologies - Gestion Stagiaires',
  app_description TEXT DEFAULT 'Système de gestion des stagiaires Bridge Technologies',
  company_name VARCHAR(255) DEFAULT 'Bridge Technologies',
  max_file_size BIGINT DEFAULT 10485760, -- 10MB
  allowed_file_types TEXT[] DEFAULT ARRAY['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  email_notifications BOOLEAN DEFAULT true,
  auto_approve_requests BOOLEAN DEFAULT false,
  backup_enabled BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table de log des actions utilisateurs
CREATE TABLE user_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CRÉATION DES INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index sur les emails des utilisateurs
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company ON users(company);
CREATE INDEX idx_users_active ON users(is_active);

-- Index sur les tuteurs
CREATE INDEX idx_tuteurs_user_id ON tuteurs(user_id);

-- Index sur les stagiaires
CREATE INDEX idx_stagiaires_user_id ON stagiaires(user_id);
CREATE INDEX idx_stagiaires_tuteur_id ON stagiaires(tuteur_id);
CREATE INDEX idx_stagiaires_statut ON stagiaires(statut);

-- Index sur les demandes
CREATE INDEX idx_demandes_stagiaire_id ON demandes(stagiaire_id);
CREATE INDEX idx_demandes_tuteur_id ON demandes(tuteur_id);
CREATE INDEX idx_demandes_statut ON demandes(statut);
CREATE INDEX idx_demandes_type ON demandes(type);
CREATE INDEX idx_demandes_date ON demandes(date_demande);

-- Index sur le workflow
CREATE INDEX idx_workflow_demande_id ON demandes_workflow(demande_id);
CREATE INDEX idx_workflow_user_id ON demandes_workflow(user_id);
CREATE INDEX idx_workflow_step ON demandes_workflow(step);

-- Index sur les documents
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_demande_id ON documents(demande_id);
CREATE INDEX idx_documents_type ON documents(type);

-- Index sur les évaluations
CREATE INDEX idx_evaluations_stagiaire_id ON evaluations(stagiaire_id);
CREATE INDEX idx_evaluations_evaluateur_id ON evaluations(evaluateur_id);
CREATE INDEX idx_evaluations_type ON evaluations(type);

-- Index sur les notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_lu ON notifications(lu);
CREATE INDEX idx_notifications_date ON notifications(date);

-- =====================================================
-- 3. CRÉATION DES VUES POUR FACILITER LES REQUÊTES
-- =====================================================

-- Vue pour les statistiques Bridge Technologies
CREATE OR REPLACE VIEW bridge_stats AS
SELECT 
    COUNT(CASE WHEN role = 'stagiaire' AND is_active = true THEN 1 END) as stagiaires_actifs,
    COUNT(CASE WHEN role = 'tuteur' AND is_active = true THEN 1 END) as tuteurs_actifs,
    COUNT(CASE WHEN role = 'rh' AND is_active = true THEN 1 END) as rh_actifs,
    COUNT(CASE WHEN role = 'admin' AND is_active = true THEN 1 END) as admin_actifs,
    COUNT(CASE WHEN is_active = true THEN 1 END) as total_employees_actifs,
    COUNT(*) as total_employees
FROM users 
WHERE company = 'Bridge Technologies';

-- Vue pour les statistiques du dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM stagiaires WHERE statut = 'actif') as stagiaires_actifs,
    (SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente') as demandes_en_attente,
    (SELECT COUNT(*) FROM demandes WHERE statut = 'approuvee') as demandes_approuvees,
    (SELECT COUNT(*) FROM demandes WHERE statut = 'rejetee') as demandes_rejetees,
    (SELECT COUNT(*) FROM documents) as documents_total,
    (SELECT COUNT(*) FROM evaluations) as evaluations_total;

-- =====================================================
-- 4. CRÉATION DES FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir les statistiques complètes du dashboard Bridge Technologies
CREATE OR REPLACE FUNCTION get_bridge_dashboard_stats()
RETURNS TABLE (
    users_total BIGINT,
    stagiaires_total BIGINT,
    tuteurs_total BIGINT,
    demandes_total BIGINT,
    demandes_en_attente BIGINT,
    demandes_approuvees BIGINT,
    documents_total BIGINT,
    evaluations_total BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users WHERE company = 'Bridge Technologies')::BIGINT,
        (SELECT COUNT(*) FROM stagiaires)::BIGINT,
        (SELECT COUNT(*) FROM tuteurs)::BIGINT,
        (SELECT COUNT(*) FROM demandes)::BIGINT,
        (SELECT COUNT(*) FROM demandes WHERE statut = 'en_attente')::BIGINT,
        (SELECT COUNT(*) FROM demandes WHERE statut = 'approuvee')::BIGINT,
        (SELECT COUNT(*) FROM documents)::BIGINT,
        (SELECT COUNT(*) FROM evaluations)::BIGINT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. INSERTION DES DONNÉES INITIALES
-- =====================================================

-- Insérer les paramètres système par défaut
INSERT INTO system_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. CRÉATION DES UTILISATEURS DE TEST (OPTIONNEL)
-- =====================================================

-- Utilisateur Admin
INSERT INTO users (id, email, name, first_name, last_name, role, department, position, company) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@bridgetech.fr',
    'Admin Bridge',
    'Admin',
    'Bridge',
    'admin',
    'Direction',
    'Administrateur Système',
    'Bridge Technologies'
) ON CONFLICT (email) DO NOTHING;

-- Utilisateur RH
INSERT INTO users (id, email, name, first_name, last_name, role, department, position, company) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'rh@bridgetech.fr',
    'RH Manager',
    'Sarah',
    'Martin',
    'rh',
    'Ressources Humaines',
    'Responsable RH',
    'Bridge Technologies'
) ON CONFLICT (email) DO NOTHING;

-- Utilisateur Tuteur
INSERT INTO users (id, email, name, first_name, last_name, role, department, position, company) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'tuteur@bridgetech.fr',
    'Jean Dupont',
    'Jean',
    'Dupont',
    'tuteur',
    'Développement',
    'Lead Developer',
    'Bridge Technologies'
) ON CONFLICT (email) DO NOTHING;

-- Ajouter le tuteur dans la table tuteurs
INSERT INTO tuteurs (user_id, specialite, max_stagiaires) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    'Développement Web & Mobile',
    8
) ON CONFLICT (user_id) DO NOTHING;

-- Utilisateur Stagiaire
INSERT INTO users (id, email, name, first_name, last_name, role, department, position, company) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    'stagiaire@bridgetech.fr',
    'Marie Legrand',
    'Marie',
    'Legrand',
    'stagiaire',
    'Développement',
    'Stagiaire Développeur',
    'Bridge Technologies'
) ON CONFLICT (email) DO NOTHING;

-- Ajouter le stagiaire dans la table stagiaires
INSERT INTO stagiaires (user_id, tuteur_id, entreprise, poste, date_debut, date_fin, statut) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    'Bridge Technologies',
    'Stagiaire Développeur Frontend',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '6 months',
    'actif'
) ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- 7. CONFIGURATION DES PERMISSIONS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tuteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE stagiaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politique pour les utilisateurs : peuvent voir tous les profils publics
CREATE POLICY "Users can view all profiles" ON users
    FOR SELECT USING (true);

-- Politique pour les utilisateurs : peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id);

-- Politique pour les tuteurs : les tuteurs et admins peuvent voir tous les tuteurs
CREATE POLICY "Tuteurs visible by tuteurs and admins" ON tuteurs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role IN ('tuteur', 'admin', 'rh')
        )
    );

-- Politique pour les stagiaires : peuvent voir leurs propres données et les tuteurs/admins peuvent voir tous
CREATE POLICY "Stagiaires policy" ON stagiaires
    FOR SELECT USING (
        user_id = auth.uid()::text 
        OR tuteur_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role IN ('admin', 'rh')
        )
    );

-- Politique pour les demandes
CREATE POLICY "Demandes policy" ON demandes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM stagiaires s
            WHERE s.id = demandes.stagiaire_id 
            AND (s.user_id = auth.uid()::text OR s.tuteur_id = auth.uid()::text)
        )
        OR tuteur_id = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role IN ('admin', 'rh')
        )
    );

-- Politique pour les documents
CREATE POLICY "Documents policy" ON documents
    FOR ALL USING (
        user_id = auth.uid()::text
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid()::text 
            AND role IN ('admin', 'rh', 'tuteur')
        )
    );

-- Politique pour les notifications
CREATE POLICY "Notifications policy" ON notifications
    FOR ALL USING (user_id = auth.uid()::text);

-- =====================================================
-- 8. TRIGGERS POUR LA MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Fonction générique pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur toutes les tables avec updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tuteurs_updated_at BEFORE UPDATE ON tuteurs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stagiaires_updated_at BEFORE UPDATE ON stagiaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demandes_updated_at BEFORE UPDATE ON demandes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SCRIPT TERMINÉ
-- =====================================================

-- Vérification finale
SELECT 'Bridge Technologies Database Setup Complete!' as status;
SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
