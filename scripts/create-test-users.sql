-- Créer des utilisateurs de test pour chaque rôle
-- Ces utilisateurs peuvent être utilisés pour tester l'application

-- Insérer les utilisateurs de test (les IDs doivent correspondre à ceux créés dans Supabase Auth)
INSERT INTO users (id, email, name, role, first_name, last_name, phone, is_active, created_at, updated_at)
VALUES 
  -- Admin
  ('00000000-0000-0000-0000-000000000001', 'admin@test.com', 'Administrateur Test', 'admin', 'Admin', 'Test', '+33123456789', true, NOW(), NOW()),
  
  -- RH
  ('00000000-0000-0000-0000-000000000002', 'rh@test.com', 'RH Test', 'rh', 'RH', 'Test', '+33123456790', true, NOW(), NOW()),
  
  -- Tuteur
  ('00000000-0000-0000-0000-000000000003', 'tuteur@test.com', 'Tuteur Test', 'tuteur', 'Tuteur', 'Test', '+33123456791', true, NOW(), NOW()),
  
  -- Stagiaire
  ('00000000-0000-0000-0000-000000000004', 'stagiaire@test.com', 'Stagiaire Test', 'stagiaire', 'Stagiaire', 'Test', '+33123456792', true, NOW(), NOW())

ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Afficher les utilisateurs créés
SELECT id, email, name, role FROM users WHERE email LIKE '%@test.com';
