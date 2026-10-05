-- ============================================================
-- 001_feature_tables.sql
-- Feature tables for Studio Admin dashboard
-- ============================================================

-- Roles & Permissions
CREATE TABLE IF NOT EXISTS app_role (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT 'blue',
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_permission (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  module TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_role_permission (
  role_id UUID REFERENCES app_role(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES app_permission(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS app_user_role (
  user_id TEXT NOT NULL,  -- better-auth uses text IDs
  role_id UUID REFERENCES app_role(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by TEXT,
  PRIMARY KEY (user_id, role_id)
);

-- Tasks (shared by tasks page + kanban)
CREATE TABLE IF NOT EXISTS app_task (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog','todo','in_progress','done','canceled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  label TEXT DEFAULT 'feature' CHECK (label IN ('bug','feature','documentation')),
  kanban_column TEXT DEFAULT 'ideas' CHECK (kanban_column IN ('ideas','planned','building','qa','shipped')),
  assignee_id TEXT,
  reporter_id TEXT NOT NULL,
  due_date DATE,
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_task_comment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES app_task(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Calendar Events
CREATE TABLE IF NOT EXISTS app_calendar_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  color TEXT DEFAULT 'blue',
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Chat
CREATE TABLE IF NOT EXISTS app_chat_conversation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  is_group BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_chat_participant (
  conversation_id UUID REFERENCES app_chat_conversation(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS app_chat_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES app_chat_conversation(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- Mail
CREATE TABLE IF NOT EXISTS app_mail_message (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  folder TEXT NOT NULL DEFAULT 'inbox' CHECK (folder IN ('inbox','sent','drafts','trash','spam')),
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_important BOOLEAN DEFAULT false,
  owner_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_mail_recipient (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mail_id UUID REFERENCES app_mail_message(id) ON DELETE CASCADE,
  user_id TEXT,
  email TEXT,
  type TEXT NOT NULL DEFAULT 'to' CHECK (type IN ('to','cc','bcc'))
);

CREATE TABLE IF NOT EXISTS app_mail_label (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_mail_message_label (
  mail_id UUID REFERENCES app_mail_message(id) ON DELETE CASCADE,
  label_id UUID REFERENCES app_mail_label(id) ON DELETE CASCADE,
  PRIMARY KEY (mail_id, label_id)
);

-- ============================================================
-- Demo seed data
-- ============================================================

-- Roles
INSERT INTO app_role (id, name, slug, description, color, is_system) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Administrator', 'admin', 'Full system access', 'red', true),
  ('a1000000-0000-0000-0000-000000000002', 'Manager', 'manager', 'Team management and reporting', 'blue', true),
  ('a1000000-0000-0000-0000-000000000003', 'Developer', 'developer', 'Development team member', 'green', false),
  ('a1000000-0000-0000-0000-000000000004', 'Analyst', 'analyst', 'Data and business analyst', 'purple', false),
  ('a1000000-0000-0000-0000-000000000005', 'Viewer', 'viewer', 'Read-only access', 'gray', true)
ON CONFLICT (slug) DO NOTHING;

-- Permissions
INSERT INTO app_permission (id, name, slug, description, module) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'View Users', 'users:view', 'Can view user list', 'users'),
  ('b1000000-0000-0000-0000-000000000002', 'Manage Users', 'users:manage', 'Can create, edit and delete users', 'users'),
  ('b1000000-0000-0000-0000-000000000003', 'View Roles', 'roles:view', 'Can view roles', 'roles'),
  ('b1000000-0000-0000-0000-000000000004', 'Manage Roles', 'roles:manage', 'Can create and edit roles', 'roles'),
  ('b1000000-0000-0000-0000-000000000005', 'View Tasks', 'tasks:view', 'Can view tasks', 'tasks'),
  ('b1000000-0000-0000-0000-000000000006', 'Manage Tasks', 'tasks:manage', 'Can create, edit and delete tasks', 'tasks'),
  ('b1000000-0000-0000-0000-000000000007', 'View Reports', 'reports:view', 'Can view reports and analytics', 'reports'),
  ('b1000000-0000-0000-0000-000000000008', 'Export Data', 'reports:export', 'Can export data', 'reports'),
  ('b1000000-0000-0000-0000-000000000009', 'Manage Settings', 'settings:manage', 'Can change system settings', 'settings'),
  ('b1000000-0000-0000-0000-000000000010', 'View Calendar', 'calendar:view', 'Can view calendar events', 'calendar')
ON CONFLICT (slug) DO NOTHING;

-- Role ↔ Permission assignments
INSERT INTO app_role_permission (role_id, permission_id) VALUES
  -- Admin gets everything
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000008'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000009'),
  ('a1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000010'),
  -- Manager
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000010'),
  -- Developer
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006'),
  ('a1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000010'),
  -- Analyst
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000008'),
  -- Viewer
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000001'),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000005'),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000007'),
  ('a1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;

-- Tasks (reporter_id uses placeholder; real user IDs are inserted by the app)
INSERT INTO app_task (id, title, description, status, priority, label, kanban_column, reporter_id, due_date, progress) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Set up CI/CD pipeline', 'Configure GitHub Actions for automated deployments', 'in_progress', 'high', 'feature', 'building', 'system', '2024-12-15', 60),
  ('c1000000-0000-0000-0000-000000000002', 'Design new dashboard layout', 'Revamp the analytics dashboard with new widgets', 'todo', 'medium', 'feature', 'planned', 'system', '2024-12-20', 0),
  ('c1000000-0000-0000-0000-000000000003', 'Fix login redirect bug', 'Users are not being redirected after successful login', 'todo', 'high', 'bug', 'ideas', 'system', '2024-12-10', 0),
  ('c1000000-0000-0000-0000-000000000004', 'Write API documentation', 'Document all REST endpoints for internal team', 'backlog', 'low', 'documentation', 'ideas', 'system', '2025-01-05', 0),
  ('c1000000-0000-0000-0000-000000000005', 'Implement dark mode', 'Add full dark mode support across all pages', 'done', 'medium', 'feature', 'shipped', 'system', '2024-11-30', 100),
  ('c1000000-0000-0000-0000-000000000006', 'Optimize database queries', 'Profile and optimize slow queries in the reports module', 'in_progress', 'high', 'bug', 'building', 'system', '2024-12-18', 40),
  ('c1000000-0000-0000-0000-000000000007', 'User onboarding flow', 'Create step-by-step onboarding for new users', 'todo', 'medium', 'feature', 'planned', 'system', '2025-01-10', 0),
  ('c1000000-0000-0000-0000-000000000008', 'QA: Mobile responsiveness', 'Test and fix mobile layout issues', 'in_progress', 'medium', 'bug', 'qa', 'system', '2024-12-22', 75),
  ('c1000000-0000-0000-0000-000000000009', 'Add export to CSV', 'Allow users to export table data as CSV', 'backlog', 'low', 'feature', 'ideas', 'system', '2025-01-15', 0),
  ('c1000000-0000-0000-0000-000000000010', 'Security audit', 'Conduct full security review of auth flows', 'done', 'high', 'documentation', 'shipped', 'system', '2024-11-20', 100)
ON CONFLICT (id) DO NOTHING;

-- Calendar Events (user_id placeholder; app uses real session IDs)
INSERT INTO app_calendar_event (id, title, description, start_time, end_time, all_day, color, user_id) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'Team Standup', 'Daily sync with the engineering team', '2024-12-10 09:00:00+00', '2024-12-10 09:30:00+00', false, 'blue', 'system'),
  ('d1000000-0000-0000-0000-000000000002', 'Product Review', 'Quarterly product review with stakeholders', '2024-12-12 14:00:00+00', '2024-12-12 16:00:00+00', false, 'purple', 'system'),
  ('d1000000-0000-0000-0000-000000000003', 'Holiday Party', 'Company end-of-year celebration', '2024-12-20 18:00:00+00', '2024-12-20 22:00:00+00', false, 'red', 'system'),
  ('d1000000-0000-0000-0000-000000000004', 'Sprint Planning', 'Plan the next two-week sprint', '2024-12-16 10:00:00+00', '2024-12-16 12:00:00+00', false, 'green', 'system'),
  ('d1000000-0000-0000-0000-000000000005', 'New Year', 'New Year holiday', '2025-01-01 00:00:00+00', '2025-01-01 23:59:59+00', true, 'yellow', 'system'),
  ('d1000000-0000-0000-0000-000000000006', 'Design Workshop', 'UX/UI design workshop for Q1 roadmap', '2024-12-18 13:00:00+00', '2024-12-18 17:00:00+00', false, 'orange', 'system'),
  ('d1000000-0000-0000-0000-000000000007', '1:1 with Manager', 'Weekly check-in', '2024-12-11 11:00:00+00', '2024-12-11 11:30:00+00', false, 'blue', 'system')
ON CONFLICT (id) DO NOTHING;

-- Chat Conversations
INSERT INTO app_chat_conversation (id, name, is_group) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'Engineering Team', true),
  ('e1000000-0000-0000-0000-000000000002', 'Product Sync', true),
  ('e1000000-0000-0000-0000-000000000003', 'Alice Johnson', false),
  ('e1000000-0000-0000-0000-000000000004', 'General', true)
ON CONFLICT (id) DO NOTHING;

-- Chat Participants (using placeholder IDs)
INSERT INTO app_chat_participant (conversation_id, user_id) VALUES
  ('e1000000-0000-0000-0000-000000000001', 'system'),
  ('e1000000-0000-0000-0000-000000000002', 'system'),
  ('e1000000-0000-0000-0000-000000000003', 'system'),
  ('e1000000-0000-0000-0000-000000000004', 'system')
ON CONFLICT DO NOTHING;

-- Chat Messages
INSERT INTO app_chat_message (id, conversation_id, sender_id, content, created_at) VALUES
  ('f1000000-0000-0000-0000-000000000001', 'e1000000-0000-0000-0000-000000000001', 'system', 'Good morning team! Ready for the sprint?', '2024-12-10 08:45:00+00'),
  ('f1000000-0000-0000-0000-000000000002', 'e1000000-0000-0000-0000-000000000001', 'system', 'Deployment went smooth last night, all green!', '2024-12-10 08:50:00+00'),
  ('f1000000-0000-0000-0000-000000000003', 'e1000000-0000-0000-0000-000000000002', 'system', 'Can everyone review the PRD before Friday?', '2024-12-09 14:00:00+00'),
  ('f1000000-0000-0000-0000-000000000004', 'e1000000-0000-0000-0000-000000000003', 'system', 'Hey, do you have 15 mins today to chat?', '2024-12-10 09:15:00+00'),
  ('f1000000-0000-0000-0000-000000000005', 'e1000000-0000-0000-0000-000000000004', 'system', 'Reminder: all-hands meeting at 3pm!', '2024-12-10 10:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- Mail Messages (owner_user_id placeholder = 'system'; app assigns to real users)
INSERT INTO app_mail_message (id, from_user_id, subject, body, folder, is_read, is_starred, is_important, owner_user_id) VALUES
  ('a7100000-0000-0000-0000-000000000001', 'system', 'Welcome to Studio Admin', 'Hi there! Your account has been set up successfully. Get started by exploring the dashboard.', 'inbox', false, false, true, 'system'),
  ('a7100000-0000-0000-0000-000000000002', 'system', 'Q4 Performance Report Ready', 'The Q4 performance report has been generated and is available for review. Please find the summary attached.', 'inbox', false, true, true, 'system'),
  ('a7100000-0000-0000-0000-000000000003', 'system', 'New team member onboarding', 'Please welcome our newest team member. They will be joining the engineering squad starting next Monday.', 'inbox', true, false, false, 'system'),
  ('a7100000-0000-0000-0000-000000000004', 'system', 'Re: Sprint planning agenda', 'Thanks for sharing the agenda. I have added a few items under the risks section.', 'sent', true, false, false, 'system'),
  ('a7100000-0000-0000-0000-000000000005', 'system', 'Server maintenance scheduled', 'Scheduled maintenance window: Saturday 02:00-04:00 UTC. Services may be briefly unavailable.', 'inbox', false, false, false, 'system'),
  ('a7100000-0000-0000-0000-000000000006', 'system', 'Invoice #1042 attached', 'Please find invoice #1042 for November services attached to this email. Payment due in 30 days.', 'inbox', true, true, false, 'system'),
  ('a7100000-0000-0000-0000-000000000007', 'system', 'Draft: Proposal for new feature', 'This is a draft proposal for the upcoming feature release. Still working on section 3.', 'drafts', false, false, false, 'system')
ON CONFLICT (id) DO NOTHING;

-- Mail Recipients
INSERT INTO app_mail_recipient (mail_id, email, type) VALUES
  ('a7100000-0000-0000-0000-000000000001', 'team@example.com', 'to'),
  ('a7100000-0000-0000-0000-000000000002', 'leadership@example.com', 'to'),
  ('a7100000-0000-0000-0000-000000000002', 'hr@example.com', 'cc'),
  ('a7100000-0000-0000-0000-000000000003', 'team@example.com', 'to'),
  ('a7100000-0000-0000-0000-000000000004', 'manager@example.com', 'to'),
  ('a7100000-0000-0000-0000-000000000005', 'all@example.com', 'to'),
  ('a7100000-0000-0000-0000-000000000006', 'finance@example.com', 'to'),
  ('a7100000-0000-0000-0000-000000000007', 'product@example.com', 'to')
ON CONFLICT DO NOTHING;

-- Mail Labels (owner = 'system')
INSERT INTO app_mail_label (id, user_id, name, color) VALUES
  ('a8100000-0000-0000-0000-000000000001', 'system', 'Finance', 'green'),
  ('a8100000-0000-0000-0000-000000000002', 'system', 'Engineering', 'blue'),
  ('a8100000-0000-0000-0000-000000000003', 'system', 'HR', 'purple'),
  ('a8100000-0000-0000-0000-000000000004', 'system', 'Urgent', 'red')
ON CONFLICT (id) DO NOTHING;

-- Mail Message ↔ Label
INSERT INTO app_mail_message_label (mail_id, label_id) VALUES
  ('a7100000-0000-0000-0000-000000000002', 'a8100000-0000-0000-0000-000000000001'),
  ('a7100000-0000-0000-0000-000000000002', 'a8100000-0000-0000-0000-000000000004'),
  ('a7100000-0000-0000-0000-000000000005', 'a8100000-0000-0000-0000-000000000002'),
  ('a7100000-0000-0000-0000-000000000006', 'a8100000-0000-0000-0000-000000000001'),
  ('a7100000-0000-0000-0000-000000000003', 'a8100000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
