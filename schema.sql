-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CORE ORGANIZATIONAL STRUCTURE
CREATE TABLE IF NOT EXISTS legal_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    country_code TEXT NOT NULL, -- 'DE', 'US', 'UK'
    currency TEXT NOT NULL, -- 'EUR', 'USD'
    tax_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_entity_id UUID REFERENCES legal_entities(id),
    lead_id UUID, -- References users(id), added via ALTER later to avoid circular dependency
    parent_team_id UUID REFERENCES teams(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    legal_entity_id UUID REFERENCES legal_entities(id),
    address TEXT,
    timezone TEXT
);

-- 2. USERS (The Employee Core)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('employee', 'manager', 'hr', 'recruiter', 'it_admin', 'finance')),
    status TEXT CHECK (status IN ('Active', 'Onboarding', 'Leave', 'Terminated', 'Invited')),
    
    -- Org Assignment
    legal_entity_id UUID REFERENCES legal_entities(id),
    team_id UUID REFERENCES teams(id),
    location_id UUID REFERENCES locations(id),
    manager_id UUID REFERENCES users(id),
    
    -- Profile Data
    avatar_url TEXT,
    job_title TEXT,
    start_date DATE,
    end_date DATE,
    
    -- Personal (Self-Service Editable)
    personal_email TEXT,
    phone TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Circular dependency fix
ALTER TABLE teams ADD CONSTRAINT fk_team_lead FOREIGN KEY (lead_id) REFERENCES users(id);

-- 3. SENSITIVE DATA (Compensation - Field Level Protection)
-- RLS Policy: Only readable by specific HR roles or the user themselves
CREATE TABLE IF NOT EXISTS compensation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    base_salary_cents BIGINT NOT NULL, -- Store in cents to avoid float errors
    currency TEXT NOT NULL,
    variable_bonus_percent DECIMAL(5,2),
    effective_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TIME & ABSENCE (Policy Engine)
CREATE TABLE IF NOT EXISTS absence_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL, -- "German Vacation", "US Sick Leave"
    legal_entity_id UUID REFERENCES legal_entities(id),
    type TEXT CHECK (type IN ('vacation', 'sick', 'remote', 'other')),
    rules JSONB NOT NULL, -- { "allow_negative": false, "days_per_year": 30, "requires_approval": true }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    clock_in TIMESTAMP,
    clock_out TIMESTAMP,
    break_duration_minutes INT DEFAULT 0,
    project_tag TEXT,
    status TEXT CHECK (status IN ('draft', 'submitted', 'approved'))
);

CREATE TABLE IF NOT EXISTS absence_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    policy_id UUID REFERENCES absence_policies(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(4,1),
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approver_id UUID REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. WORKFLOWS & ONE INBOX
CREATE TABLE IF NOT EXISTS inbox_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignee_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    
    -- Polymorphic Reference
    related_entity_type TEXT, -- 'absence_request', 'onboarding_task', 'document_sign'
    related_entity_id UUID,
    
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    due_at TIMESTAMP,
    status TEXT CHECK (status IN ('open', 'completed', 'archived')),
    
    action_url TEXT, -- Client-side route to handle this item
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RECRUITING (ATS)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT, -- Snapshot of department name
    hiring_manager_id UUID REFERENCES users(id),
    recruiter_id UUID REFERENCES users(id),
    legal_entity_id UUID REFERENCES legal_entities(id),
    status TEXT CHECK (status IN ('Draft', 'Internal', 'Published', 'Closed')),
    description_html TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id),
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    resume_url TEXT,
    source TEXT,
    stage TEXT CHECK (stage IN ('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
    rating DECIMAL(2,1), -- 1.0 to 5.0
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scorecards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES candidates(id),
    interviewer_id UUID REFERENCES users(id),
    overall_score INT,
    pros TEXT,
    cons TEXT,
    notes TEXT,
    submitted_at TIMESTAMP
);

-- 7. AUDIT (Compliance)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    action TEXT NOT NULL, -- 'user.update', 'salary.read', 'absence.approve'
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    changes JSONB, -- Diff of what changed
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. INTEGRATIONS
CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    secret TEXT,
    event_types JSONB, -- ['user.created', 'absence.approved']
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
