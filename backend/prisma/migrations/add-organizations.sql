-- Migration pour ajouter le système multi-tenant

-- Créer la table des organisations
CREATE TABLE organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- URL-friendly name (ex: "ecole-marie-curie")
  domain TEXT, -- domaine personnalisé optionnel
  logo_url TEXT,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  subscription_plan TEXT DEFAULT 'basic', -- basic, pro, enterprise
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ajouter organization_id à toutes les tables existantes
ALTER TABLE users ADD COLUMN organization_id TEXT;
ALTER TABLE locations ADD COLUMN organization_id TEXT;
ALTER TABLE tasks ADD COLUMN organization_id TEXT;
ALTER TABLE cleaning_templates ADD COLUMN organization_id TEXT;
ALTER TABLE planning_templates ADD COLUMN organization_id TEXT;

-- Créer une organisation par défaut pour les données existantes
INSERT INTO organizations (id, name, slug, contact_email, is_active) 
VALUES ('org_default', 'Mon Établissement', 'mon-etablissement', 'admin@monétablissement.com', TRUE);

-- Assigner toutes les données existantes à l'organisation par défaut
UPDATE users SET organization_id = 'org_default' WHERE organization_id IS NULL;
UPDATE locations SET organization_id = 'org_default' WHERE organization_id IS NULL;
UPDATE tasks SET organization_id = 'org_default' WHERE organization_id IS NULL;
UPDATE cleaning_templates SET organization_id = 'org_default' WHERE organization_id IS NULL;
UPDATE planning_templates SET organization_id = 'org_default' WHERE organization_id IS NULL;

-- Rendre organization_id obligatoire après migration
-- (à faire dans une migration séparée après vérification)
-- ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE locations ALTER COLUMN organization_id SET NOT NULL;
-- ALTER TABLE tasks ALTER COLUMN organization_id SET NOT NULL;