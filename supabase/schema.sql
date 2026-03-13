-- ============================================
-- ARIA Conciergerie OS — Schéma Supabase
-- ============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TRIGGER HELPER : updated_at automatique
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ORGANIZATIONS (multi-tenant)
-- ============================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER tr_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- USERS (membres de l'équipe)
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'VIEWER' CHECK (role IN ('OWNER', 'MANAGER', 'AGENT_MENAGE', 'VIEWER')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER tr_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- OWNERS (propriétaires de biens)
-- ============================================
CREATE TABLE owners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  iban TEXT,
  communication_profile TEXT NOT NULL DEFAULT 'SUMMARY' CHECK (communication_profile IN ('DETAILED', 'SUMMARY', 'URGENT_ONLY')),
  legal JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_owners_organization ON owners(organization_id);

CREATE TRIGGER tr_owners_updated_at
  BEFORE UPDATE ON owners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PROPERTIES (logements gérés)
-- ============================================
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zipcode TEXT NOT NULL,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  type TEXT NOT NULL DEFAULT 'APARTMENT' CHECK (type IN ('STUDIO', 'APARTMENT', 'HOUSE', 'VILLA')),
  capacity INT NOT NULL DEFAULT 2,
  bedrooms INT NOT NULL DEFAULT 1,
  beds INT NOT NULL DEFAULT 1,
  bathrooms INT NOT NULL DEFAULT 1,
  surface_m2 NUMERIC,
  access_instructions TEXT,
  access_code TEXT,
  wifi_name TEXT,
  wifi_password TEXT,
  rules TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',
  platforms JSONB DEFAULT '{}',
  ical_airbnb TEXT,
  ical_booking TEXT,
  pricing JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_properties_organization ON properties(organization_id);
CREATE INDEX idx_properties_owner ON properties(owner_id);
CREATE INDEX idx_properties_status ON properties(status);

CREATE TRIGGER tr_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RESERVATIONS
-- ============================================
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL DEFAULT 'MANUAL' CHECK (platform IN ('AIRBNB', 'BOOKING', 'VRBO', 'DIRECT', 'MANUAL')),
  platform_reservation_id TEXT,
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  guest_count INT NOT NULL DEFAULT 1,
  checkin_date DATE NOT NULL,
  checkout_date DATE NOT NULL,
  checkin_time TIME DEFAULT '15:00',
  checkout_time TIME DEFAULT '11:00',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED')),
  amount_gross NUMERIC DEFAULT 0,
  amount_net NUMERIC DEFAULT 0,
  platform_fee NUMERIC DEFAULT 0,
  concierge_fee NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_organization ON reservations(organization_id);
CREATE INDEX idx_reservations_property ON reservations(property_id);
CREATE INDEX idx_reservations_dates ON reservations(checkin_date, checkout_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_platform ON reservations(platform);

CREATE TRIGGER tr_reservations_updated_at
  BEFORE UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- MESSAGES (voyageurs)
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'AIRBNB', 'BOOKING', 'WHATSAPP')),
  content TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  automated BOOLEAN NOT NULL DEFAULT FALSE,
  template_id UUID
);

CREATE INDEX idx_messages_reservation ON messages(reservation_id);
CREATE INDEX idx_messages_organization ON messages(organization_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);

-- ============================================
-- MESSAGE TEMPLATES
-- ============================================
CREATE TABLE message_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN (
    'BOOKING_CONFIRMED', 'J_MINUS_7', 'J_MINUS_3', 'J_MINUS_1',
    'DAY_PLUS_1', 'CHECKOUT_MINUS_1', 'CHECKOUT_PLUS_1'
  )),
  channel TEXT NOT NULL CHECK (channel IN ('EMAIL', 'SMS', 'WHATSAPP')),
  subject TEXT,
  content TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'es', 'de')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_message_templates_organization ON message_templates(organization_id);

CREATE TRIGGER tr_message_templates_updated_at
  BEFORE UPDATE ON message_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CLEANING MISSIONS (ménage)
-- ============================================
CREATE TABLE cleaning_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'FULL_CLEANING' CHECK (type IN ('FULL_CLEANING', 'QUICK_CHECK', 'MAINTENANCE')),
  scheduled_date DATE NOT NULL,
  scheduled_start TIME,
  scheduled_end TIME,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'ISSUE')),
  checklist_items JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cleaning_missions_organization ON cleaning_missions(organization_id);
CREATE INDEX idx_cleaning_missions_property ON cleaning_missions(property_id);
CREATE INDEX idx_cleaning_missions_assigned ON cleaning_missions(assigned_to);
CREATE INDEX idx_cleaning_missions_date ON cleaning_missions(scheduled_date);
CREATE INDEX idx_cleaning_missions_status ON cleaning_missions(status);

CREATE TRIGGER tr_cleaning_missions_updated_at
  BEFORE UPDATE ON cleaning_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- PROPERTY INSPECTIONS (états des lieux)
-- ============================================
CREATE TABLE property_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cleaning_mission_id UUID REFERENCES cleaning_missions(id) ON DELETE SET NULL,
  inspector_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('CHECKOUT', 'CHECKIN')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'ISSUE_REPORTED')),
  cleanliness_score INT CHECK (cleanliness_score BETWEEN 1 AND 5),
  quality_score INT CHECK (quality_score BETWEEN 1 AND 5),
  items JSONB DEFAULT '[]',
  damages JSONB DEFAULT '[]',
  photos TEXT[] DEFAULT '{}',
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inspections_organization ON property_inspections(organization_id);
CREATE INDEX idx_inspections_property ON property_inspections(property_id);

CREATE TRIGGER tr_property_inspections_updated_at
  BEFORE UPDATE ON property_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- OWNER REPORTS (rapports propriétaires)
-- ============================================
CREATE TABLE owner_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('WEEKLY', 'MONTHLY')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  data JSONB DEFAULT '{}',
  sent_at TIMESTAMPTZ,
  sent_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_owner_reports_organization ON owner_reports(organization_id);
CREATE INDEX idx_owner_reports_owner ON owner_reports(owner_id);

-- ============================================
-- PRICING RULES (tarification dynamique)
-- ============================================
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('BASE', 'SEASON', 'WEEKDAY', 'EVENT', 'LAST_MINUTE', 'LONG_STAY')),
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('FIXED', 'PERCENTAGE')),
  adjustment_value NUMERIC NOT NULL DEFAULT 0,
  min_stay INT,
  max_stay INT,
  priority INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_organization ON pricing_rules(organization_id);
CREATE INDEX idx_pricing_rules_property ON pricing_rules(property_id);

CREATE TRIGGER tr_pricing_rules_updated_at
  BEFORE UPDATE ON pricing_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CALENDAR BLOCKS (blocages calendrier)
-- ============================================
CREATE TABLE calendar_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('OWNER_USE', 'MAINTENANCE', 'BLOCKED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_blocks_organization ON calendar_blocks(organization_id);
CREATE INDEX idx_calendar_blocks_property ON calendar_blocks(property_id);
CREATE INDEX idx_calendar_blocks_dates ON calendar_blocks(start_date, end_date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE cleaning_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;

-- Helper: récupère l'organization_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: récupère le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ORGANIZATIONS: membres uniquement
CREATE POLICY "Users can view their organization"
  ON organizations FOR SELECT
  USING (id = get_user_organization_id());

CREATE POLICY "Owners can update their organization"
  ON organizations FOR UPDATE
  USING (id = get_user_organization_id() AND get_user_role() = 'OWNER');

-- USERS: même organisation
CREATE POLICY "Users can view team members"
  ON users FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Owners/Managers can manage users"
  ON users FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- Macro pour les autres tables (isolation par organization_id)
-- OWNERS
CREATE POLICY "Org members can view owners"
  ON owners FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage owners"
  ON owners FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- PROPERTIES
CREATE POLICY "Org members can view properties"
  ON properties FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage properties"
  ON properties FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- RESERVATIONS
CREATE POLICY "Org members can view reservations"
  ON reservations FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage reservations"
  ON reservations FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- MESSAGES
CREATE POLICY "Org members can view messages"
  ON messages FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage messages"
  ON messages FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- MESSAGE TEMPLATES
CREATE POLICY "Org members can view templates"
  ON message_templates FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage templates"
  ON message_templates FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- CLEANING MISSIONS
CREATE POLICY "Org members can view missions"
  ON cleaning_missions FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage missions"
  ON cleaning_missions FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

CREATE POLICY "Agents can update their missions"
  ON cleaning_missions FOR UPDATE
  USING (assigned_to = auth.uid());

-- PROPERTY INSPECTIONS
CREATE POLICY "Org members can view inspections"
  ON property_inspections FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage inspections"
  ON property_inspections FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

CREATE POLICY "Inspectors can manage their inspections"
  ON property_inspections FOR ALL
  USING (inspector_id = auth.uid());

-- OWNER REPORTS
CREATE POLICY "Org members can view reports"
  ON owner_reports FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage reports"
  ON owner_reports FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- PRICING RULES
CREATE POLICY "Org members can view pricing rules"
  ON pricing_rules FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage pricing rules"
  ON pricing_rules FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- CALENDAR BLOCKS
CREATE POLICY "Org members can view calendar blocks"
  ON calendar_blocks FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Managers can manage calendar blocks"
  ON calendar_blocks FOR ALL
  USING (organization_id = get_user_organization_id() AND get_user_role() IN ('OWNER', 'MANAGER'));

-- ============================================
-- FONCTIONS UTILITAIRES
-- ============================================

-- Calcul du revenu sur une période pour une propriété
CREATE OR REPLACE FUNCTION calculate_revenue(
  p_property_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  gross_revenue NUMERIC,
  net_revenue NUMERIC,
  total_fees NUMERIC,
  reservation_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(r.amount_gross), 0) AS gross_revenue,
    COALESCE(SUM(r.amount_net), 0) AS net_revenue,
    COALESCE(SUM(r.platform_fee + r.concierge_fee), 0) AS total_fees,
    COUNT(*) AS reservation_count
  FROM reservations r
  WHERE r.property_id = p_property_id
    AND r.status NOT IN ('CANCELLED')
    AND r.checkin_date >= p_start_date
    AND r.checkout_date <= p_end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calcul du taux d'occupation sur une période
CREATE OR REPLACE FUNCTION get_occupancy_rate(
  p_property_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS NUMERIC AS $$
DECLARE
  total_days INT;
  occupied_days INT;
BEGIN
  total_days := p_end_date - p_start_date;
  IF total_days <= 0 THEN RETURN 0; END IF;

  SELECT COALESCE(SUM(
    LEAST(r.checkout_date, p_end_date) - GREATEST(r.checkin_date, p_start_date)
  ), 0) INTO occupied_days
  FROM reservations r
  WHERE r.property_id = p_property_id
    AND r.status NOT IN ('CANCELLED')
    AND r.checkin_date < p_end_date
    AND r.checkout_date > p_start_date;

  RETURN ROUND((occupied_days::NUMERIC / total_days) * 100, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
