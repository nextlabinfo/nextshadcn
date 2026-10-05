-- ============================================================
-- 004_dashboards.sql
-- Backend tables for the remaining dashboard pages:
-- CRM, e-commerce, personal finance, logistics, infrastructure,
-- patient monitoring, academy, file manager, invoices,
-- productivity, analytics. (The Default dashboard composes
-- aggregates from these.)
-- ============================================================

-- ---------------- CRM ----------------
CREATE TABLE IF NOT EXISTS crm_lead (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  stage TEXT NOT NULL DEFAULT 'new' CHECK (stage IN ('new','contacted','qualified','proposal','won','lost')),
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  source TEXT,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'discovery' CHECK (stage IN ('discovery','proposal','negotiation','won','lost')),
  amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0,
  close_date DATE,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('call','email','meeting','task')),
  subject TEXT NOT NULL,
  related_to TEXT,
  owner TEXT,
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------- E-commerce ----------------
CREATE TABLE IF NOT EXISTS shop_product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  category TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  units_sold INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_no TEXT NOT NULL,
  customer_id UUID REFERENCES shop_customer(id) ON DELETE SET NULL,
  customer_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','refunded','cancelled')),
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  placed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_order_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES shop_order(id) ON DELETE CASCADE,
  product_id UUID REFERENCES shop_product(id) ON DELETE SET NULL,
  product_name TEXT,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shop_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES shop_product(id) ON DELETE SET NULL,
  product_name TEXT,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shop_traffic_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL,
  source TEXT NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0,
  orders INTEGER NOT NULL DEFAULT 0,
  revenue NUMERIC(12,2) NOT NULL DEFAULT 0
);

-- ---------------- Personal finance ----------------
CREATE TABLE IF NOT EXISTS pf_account (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'checking' CHECK (type IN ('checking','savings','credit','investment','cash')),
  institution TEXT,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pf_wallet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  color TEXT DEFAULT 'blue',
  last4 TEXT,
  brand TEXT
);

CREATE TABLE IF NOT EXISTS pf_category (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('income','expense')),
  color TEXT DEFAULT 'blue'
);

CREATE TABLE IF NOT EXISTS pf_transaction (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES pf_account(id) ON DELETE SET NULL,
  category_id UUID REFERENCES pf_category(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  merchant TEXT,
  amount NUMERIC(14,2) NOT NULL,
  direction TEXT NOT NULL DEFAULT 'debit' CHECK (direction IN ('debit','credit')),
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted','pending','scheduled')),
  txn_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_pf_txn_date ON pf_transaction(txn_date);

-- ---------------- Logistics ----------------
CREATE TABLE IF NOT EXISTS log_shipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_no TEXT NOT NULL,
  customer TEXT,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  carrier TEXT,
  status TEXT NOT NULL DEFAULT 'in_transit' CHECK (status IN ('pending','in_transit','out_for_delivery','delivered','delayed','exception')),
  progress INTEGER NOT NULL DEFAULT 0,
  origin_lat NUMERIC(9,6),
  origin_lng NUMERIC(9,6),
  dest_lat NUMERIC(9,6),
  dest_lng NUMERIC(9,6),
  current_lat NUMERIC(9,6),
  current_lng NUMERIC(9,6),
  eta TIMESTAMPTZ,
  weight_kg NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------- Infrastructure ----------------
CREATE TABLE IF NOT EXISTS infra_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  framework TEXT,
  repo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS infra_environment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES infra_project(id) ON DELETE CASCADE,
  name TEXT NOT NULL,               -- production / preview / development
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready','building','error','queued','canceled')),
  url TEXT,
  region TEXT,
  commit_sha TEXT,
  commit_message TEXT,
  branch TEXT,
  deployed_by TEXT,
  last_deploy_at TIMESTAMPTZ,
  uptime_pct NUMERIC(5,2) DEFAULT 99.9
);

-- ---------------- Patient monitoring ----------------
CREATE TABLE IF NOT EXISTS pm_patient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  room TEXT,
  condition TEXT,
  status TEXT NOT NULL DEFAULT 'stable' CHECK (status IN ('stable','monitor','critical','discharged')),
  admitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pm_vital (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES pm_patient(id) ON DELETE CASCADE,
  measured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  heart_rate INTEGER,
  spo2 INTEGER,
  resp_rate INTEGER,
  temperature NUMERIC(4,1),
  systolic INTEGER,
  diastolic INTEGER
);
CREATE INDEX IF NOT EXISTS idx_pm_vital_patient ON pm_vital(patient_id, measured_at);

-- ---------------- Academy ----------------
CREATE TABLE IF NOT EXISTS edu_course (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructor TEXT,
  category TEXT,
  lessons INTEGER NOT NULL DEFAULT 0,
  students INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 4.5,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS edu_assignment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES edu_course(id) ON DELETE CASCADE,
  course_title TEXT,
  title TEXT NOT NULL,
  due_date DATE,
  submitted INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','grading','closed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS edu_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  kind TEXT DEFAULT 'class' CHECK (kind IN ('class','exam','workshop','holiday','deadline')),
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ
);

-- ---------------- File manager ----------------
CREATE TABLE IF NOT EXISTS fm_folder (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES fm_folder(id) ON DELETE CASCADE,
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fm_file (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID REFERENCES fm_folder(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'file' CHECK (kind IN ('document','image','video','audio','archive','spreadsheet','pdf','file')),
  size_bytes BIGINT NOT NULL DEFAULT 0,
  owner TEXT,
  starred BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------- Invoices ----------------
CREATE TABLE IF NOT EXISTS inv_client (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  company TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inv_invoice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT NOT NULL,
  client_id UUID REFERENCES inv_client(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','void')),
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inv_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES inv_invoice(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty NUMERIC(12,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  line_no INTEGER DEFAULT 0
);

-- ---------------- Productivity ----------------
CREATE TABLE IF NOT EXISTS prod_project (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  progress INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','done')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prod_note (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---------------- Analytics ----------------
CREATE TABLE IF NOT EXISTS an_traffic_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day DATE NOT NULL UNIQUE,
  visitors INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  sessions INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_duration_sec INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS an_page (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  views INTEGER NOT NULL DEFAULT 0,
  unique_views INTEGER NOT NULL DEFAULT 0,
  avg_time_sec INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS an_source (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  kind TEXT DEFAULT 'referral' CHECK (kind IN ('direct','organic','referral','social','paid','email')),
  sessions INTEGER NOT NULL DEFAULT 0,
  share NUMERIC(5,2) NOT NULL DEFAULT 0
);
