-- Mise à jour de la table demandes pour supporter les nouvelles fonctionnalités
ALTER TABLE demandes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS date_debut DATE,
ADD COLUMN IF NOT EXISTS duree_mois INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}';

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_demandes_user_id ON demandes(user_id);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON demandes(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_created_at ON demandes(created_at);

-- Politique de sécurité pour les demandes
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir et modifier leurs propres demandes
CREATE POLICY IF NOT EXISTS "Users can view own demandes" ON demandes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own demandes" ON demandes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own demandes" ON demandes
    FOR UPDATE USING (auth.uid() = user_id);

-- Les admins et RH peuvent voir toutes les demandes
CREATE POLICY IF NOT EXISTS "Admins can view all demandes" ON demandes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'rh', 'tuteur')
        )
    );
