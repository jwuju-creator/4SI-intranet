# HR Suite Blueprint: "Best of Personio + HiBob"

## 1) SYSTEM ARCHITECTURE

**Components & Data Flow:**

1.  **Frontend (The Shell):** Single Page Application (React/Vite).
    *   **Router:** Splits immediately into 3 distinct zones (`/hub`, `/admin`, `/recruiting`).
    *   **State:** React Context for Session/Auth, React Query for server state.
    *   **Policy Engine (Client-side mirror):** Lightweight rule evaluator for immediate UI feedback (e.g., "You can't request 40 days off").
2.  **API Layer (The Gatekeeper):**
    *   **Auth:** Supabase Auth (JWT). Enforces RBAC via Middleware.
    *   **Access Control:** "Server-side enforcement first". Checks `User.Role` + `User.Entity` + `Resource.Sensitivity` before every DB read/write.
    *   **One Inbox:** Aggregates `approvals`, `tasks`, `signatures` into a single stream for the user.
3.  **Database (The Truth):** PostgreSQL.
    *   **Core:** Users, Org, Entities.
    *   **Sensitive:** Compensation separate table with strict RLS (Row Level Security).
    *   **Audit:** `audit_logs` table recording *every* mutation and sensitive read.
4.  **Storage:** S3-compatible (Supabase Storage).
    *   **Pattern:** All documents are private by default. Access via signed URLs (TTL 60s) generated only after permission check.
5.  **Integrations (The Bus):**
    *   **Webhooks:** Outbound events (`user.created`, `absence.requested`) sent to registered endpoints (Slack, Payroll).

**Decision Matrix (Fast Build Defaults):**
*   **Auth:** **Supabase Auth**. *Reason:* Built-in MFA, session management, and Row-Level Security integration. Zero maintenance.
*   **DB:** **PostgreSQL**. *Reason:* Relational integrity is non-negotiable for HR/Payroll. JSONB columns allow flexible "Custom Fields" without schema migrations.
*   **Storage:** **Supabase Storage**. *Reason:* Integrated permissions, easy API.

## 2) REPO / PROJECT STRUCTURE (Replit)

**Folder Structure:**
```text
/src
  /features
    /hub             # Employee Self-Service (Feed, Request, Profile)
    /admin           # HR Console (People, Payroll, Workflows)
    /recruiting      # ATS (Kanban, Scorecards)
    /shared          # UI Kit (Buttons, Modals), Hooks
  /lib
    /api.ts          # Supabase client & fetch wrappers
    /policy.ts       # The Rule Engine logic
    /types.ts        # TypeScript definitions
  /server            # (If using Replit Backend) or Supabase Edge Functions
    /webhooks.ts
    /audit.ts
```

**URL Structure:**
*   **Hub:** `/hub/dashboard`, `/hub/me`, `/hub/team`, `/hub/time`, `/hub/growth`, `/hub/docs`
*   **Admin:** `/admin/dashboard`, `/admin/people`, `/admin/org`, `/admin/payroll`, `/admin/workflows`, `/admin/settings`
*   **Recruiting:** `/recruiting/dashboard`, `/recruiting/jobs`, `/recruiting/pipeline/:jobId`, `/recruiting/candidates/:id`
*   **Public:** `/careers/:slug` (Public job board)

**Environment Variables:**
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `DATABASE_URL` (for migrations), `SERVICE_ROLE_KEY` (for admin scripts only).

## 3) UI INFORMATION ARCHITECTURE

**A) Employee Hub (/hub)**
*   **Nav:** Home, Profile, Time & Absence, Documents, Benefits, Company, Support.
*   **Widgets:**
    *   *Feed:* Company announcements mixed with automated kudos (new joiners, work anniversaries).
    *   *Today:* "Clock In", "Who is away?", "My Open Tasks" (Inbox).
    *   *Quick Actions:* Request Leave, Edit Bank Details, Create IT Ticket.

**B) People Admin (/admin)**
*   **Nav:** Cockpit, People, Org Structure, Payroll, Time/Absence, Workflows, Reports, Settings.
*   **Views:**
    *   *People:* High-density table. Filters: Entity, Location, Team, Status. Bulk Actions.
    *   *Org Designer:* Drag-and-drop tree view.
    *   *Payroll:* "Changes since last month" view (Variance Report).

**C) Recruiting (/recruiting)**
*   **Nav:** Jobs, Candidates, Talent Pool, Analytics.
*   **Views:**
    *   *Pipeline:* Kanban board (Applied -> Screening -> Interview -> Offer -> Hired).
    *   *Candidate:* Split view (Resume PDF on left, Scorecard/Timeline on right).

## 4) CORE FLOWS (Happy Path)

**A) Absence Request:**
1.  Employee (Hub): Clicks "Request Time Off". Selects "Vacation", "Aug 1 - Aug 10".
2.  System: Runs `resolve_policy(user, 'absence')`. Checks balance.
3.  System: Creates `request`. Triggers `workflow`.
4.  Workflow: Assigns task to `user.manager`.
5.  Manager (Inbox): Sees notification. Clicks "Approve".
6.  System: Updates `request` -> 'Approved'. Deducts balance. Writes to `audit_log`. Syncs to `team_calendar`.

**B) Onboarding:**
1.  HR (Admin): Moves candidate to "Hired". Clicks "Start Onboarding".
2.  System: Copies data to `users`. Sets status 'Onboarding'.
3.  Workflow: Generates `tasks` based on `onboarding_checklist`:
    *   IT: "Provision Laptop"
    *   Manager: "Schedule 1:1"
    *   Employee: "Upload ID", "Sign Contract".
4.  Employee (Hub): Logs in. Sees "Welcome Aboard" wizard with task list.

**F) Recruiting:**
1.  Hiring Manager: Creates Job Requisition.
2.  Recruiter: Reviews & Publishes to Career Page.
3.  Candidate: Applies.
4.  Recruiter: Drags to "Interview". Auto-emails candidate. Assigns Interviewers.
5.  Interviewers: Fill Scorecards.
6.  Recruiter: Generates Offer Letter (PDF). Sends for e-signature.

## 5) DATA MODEL (SQL) & ACCESS CONTROL

**Access Control:**
*   **RBAC:** `roles` table.
*   **ABAC:** Logic in API: `allow if (user.role == 'hr' AND user.legal_entity == target.legal_entity)`.
*   **Field Level:** `compensation` table is strictly 1:1 with user, only readable by `user` (own) or `hr/finance` (scoped).

```sql
-- CORE & ORG
CREATE TABLE legal_entities (id UUID PRIMARY KEY, name TEXT, country TEXT, currency TEXT);
CREATE TABLE teams (id UUID PRIMARY KEY, name TEXT, lead_id UUID, parent_team_id UUID);
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE,
    legal_entity_id UUID REFERENCES legal_entities,
    team_id UUID REFERENCES teams,
    manager_id UUID REFERENCES users,
    role TEXT CHECK (role IN ('employee', 'manager', 'hr', 'recruiter', 'admin')),
    status TEXT, -- active, onboarding, terminated
    first_name TEXT, last_name TEXT,
    avatar_url TEXT,
    start_date DATE
);

-- SENSITIVE (Strict Permissions)
CREATE TABLE compensation (
    user_id UUID PRIMARY KEY REFERENCES users,
    base_salary_cents INT,
    variable_bonus_percent INT,
    effective_date DATE
);

-- TIME & ABSENCE (Policy Engine Support)
CREATE TABLE time_policies (
    id UUID PRIMARY KEY,
    name TEXT, -- "DE Standard", "US Remote"
    legal_entity_id UUID REFERENCES legal_entities,
    rules JSONB -- { "allow_negative": false, "days_per_year": 30 }
);
CREATE TABLE absences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    type TEXT, -- vacation, sick, parental
    start_date DATE, end_date DATE,
    status TEXT, -- pending, approved
    approver_id UUID
);

-- WORKFLOWS & INBOX
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY,
    assignee_id UUID REFERENCES users,
    title TEXT,
    related_entity_type TEXT, -- 'absence', 'onboarding_task', 'approval'
    related_entity_id UUID,
    status TEXT, -- open, completed
    due_at TIMESTAMP
);

-- RECRUITING (ATS)
CREATE TABLE jobs (id UUID PRIMARY KEY, title TEXT, status TEXT, hiring_manager_id UUID);
CREATE TABLE candidates (id UUID PRIMARY KEY, job_id UUID, name TEXT, stage TEXT);
CREATE TABLE scorecards (
    id UUID PRIMARY KEY, 
    candidate_id UUID, 
    interviewer_id UUID, 
    score INT, 
    feedback TEXT
);

-- AUDIT
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    actor_id UUID,
    action TEXT, -- 'update_salary', 'view_contract'
    resource_type TEXT,
    resource_id UUID,
    changes JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 6) WORKFLOW ENGINE + ONE INBOX

*   **Model:** `inbox_items` is the central aggregator.
*   **Logic:**
    *   When `absence_request` is created -> Trigger `create_approval_task`.
    *   `create_approval_task`: Find Manager. Insert into `inbox_items`. Send Email.
    *   When Manager acts: Update `inbox_item` -> 'done'. Update `absence_request` -> 'approved'.
*   **One Inbox UI:** A single list showing Approvals, assigned Onboarding Tasks, and Document Signatures.

## 7) POLICY ENGINE

*   **Concept:** Decouple rules from code.
*   **Resolver Function:** `get_policy(user, type)`.
    *   Query: `SELECT * FROM policies WHERE entity_id = user.entity_id AND type = 'absence'`.
*   **Interpreter:**
    *   Rule: `requires_certificate_after_days: 3`.
    *   Logic: `if (duration > policy.rules.requires_certificate_after_days) require_attachment = true`.

## 8) PRIVACY & COMPLIANCE

*   **Retention:** Daily Job: `DELETE FROM candidates WHERE created_at < NOW() - INTERVAL '6 MONTHS' AND status = 'Rejected'`.
*   **DSAR:** Script to export `users` + `time_entries` + `documents` to ZIP.
*   **Anonymity:** In Surveys, `IF count(responses) < 5 THEN show 'Insufficient Data'`.

## 9) INTEGRATIONS BLUEPRINT

*   **Table:** `webhooks` (url, secret, events: `['user.created', 'job.published']`).
*   **Retry Logic:** Exponential backoff (1m, 5m, 1h) stored in `webhook_deliveries` table.
*   **API Keys:** Scoped access. `headers: { 'Authorization': 'Bearer sk_...' }`.

## 10) "FAST BUILD" CHECKLIST

1.  **Setup:** Replit Node/React template.
2.  **DB Schema:** Run the provided SQL.
3.  **Auth:** Wrap App in Supabase Auth Provider.
4.  **Layouts:** Create `HubLayout`, `AdminLayout`, `RecruitingLayout` components.
5.  **Nav:** Implement the 3 sidebars.
6.  **Hub Home:** Build Feed and Quick Actions.
7.  **Directory:** Grid view of `users`.
8.  **Profile:** Read/Write form for `users` table.
9.  **Time:** Calendar view + Request Modal (write to `absences`).
10. **Inbox:** List view of `inbox_items` with "Approve/Reject" buttons.
11. **Recruiting:** Kanban board (drag & drop updates `candidates.stage`).
12. **Audit:** Add `useEffect` hook to log page views (simplified) or API middleware (better).
