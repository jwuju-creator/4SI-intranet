-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ORG
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('employee', 'manager', 'hr', 'recruiter', 'vp', 'ceo', 'it_admin')),
    avatar TEXT,
    department TEXT,
    location TEXT,
    manager_id UUID REFERENCES users(id),
    status TEXT CHECK (status IN ('Active', 'Onboarding', 'Leave', 'Terminated')),
    start_date DATE,
    phone TEXT,
    address TEXT,
    emergency_contact TEXT,
    iban TEXT,
    contract_type TEXT,
    vacation_entitlement INT DEFAULT 30,
    vacation_used INT DEFAULT 0,
    sick_days INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. JOBS (RECRUITING)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    status TEXT CHECK (status IN ('Draft', 'Published', 'Closed')),
    hiring_manager_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CANDIDATES
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    stage TEXT CHECK (stage IN ('Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected')),
    rating INT,
    source TEXT,
    resume_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TIME & ABSENCE
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    duration TEXT
);

-- 5. REQUESTS (Inbox/Workflow)
CREATE TABLE IF NOT EXISTS requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES users(id),
    type TEXT CHECK (type IN ('leave', 'expense', 'ticket', 'profile')),
    title TEXT,
    details TEXT,
    amount DECIMAL,
    status TEXT CHECK (status IN ('Pending', 'In Progress', 'Approved', 'Rejected', 'Resolved')),
    assignee_id UUID REFERENCES users(id),
    payload JSONB, -- For profile changes or flexible data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. POSTS (Feed)
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    author_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    type TEXT CHECK (type IN ('news', 'shoutout')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. GOALS
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    status TEXT CHECK (status IN ('On Track', 'At Risk', 'Completed')),
    progress INT DEFAULT 0,
    due_date DATE
);

-- 8. AUTHENTICATION (Login Topic)
-- Stores hashed passwords and login metadata if not using external Auth provider strictly
CREATE TABLE IF NOT EXISTS auth_credentials (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE PRIMARY KEY,
    password_hash TEXT NOT NULL,
    last_login_at TIMESTAMP,
    login_count INT DEFAULT 0,
    is_locked BOOLEAN DEFAULT FALSE
);

-- Active sessions for handling multiple devices/logins
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Granular permissions beyond simple Roles
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role TEXT NOT NULL, -- Maps to users.role
    resource TEXT NOT NULL, -- e.g. 'payroll', 'performance', 'settings'
    action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP DEFAULT NOW()
);

-- Audit Log for Security/Compliance (Login attempts, Sensitive data access)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES users(id),
    event TEXT NOT NULL, -- 'login.success', 'login.failed', 'salary.view'
    target_resource TEXT,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);