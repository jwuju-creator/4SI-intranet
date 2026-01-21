# HR Suite Blueprint: "Best of Personio + HiBob"

## 1) SYSTEM ARCHITECTURE

**Components & Data Flow:**
*   **Frontend (SPA):** React + Tailwind + Vite. Communicates via REST/GraphQL.
    *   *Zone 1: /hub* (Employee Self-Service)
    *   *Zone 2: /admin* (High Privilege Console)
    *   *Zone 3: /recruiting* (ATS & Hiring Manager view)
*   **API Gateway / Backend:** Node.js (Express or Fastify). Enforces "Server-side enforcement first".
*   **Auth Service:** Handles Identity, MFA, Session.
*   **Core DB:** Relational Data (SQL).
*   **Document Storage:** Blob storage with short-lived signed URLs.
*   **Workflow Engine:** Embedded state machine in Backend.

**Technology Decisions (Fast Build & Replit-Fit):**

*   **Auth:** **Supabase Auth** (or Auth0).
    *   *Why:* Handling secure sessions, password resets, and MFA yourself is a security risk and slow. Supabase Auth integrates row-level security (RLS) if needed later.
*   **Database:** **PostgreSQL** (Managed via Supabase or Neon).
    *   *Why:* Best-in-class for relational data, JSONB support for flexible schemas (policies/custom fields), and strict ACID compliance for Payroll/HR.
*   **Storage:** **AWS S3** (or Supabase Storage).
    *   *Why:* Industry standard, cheap, supports signed URLs for secure document access (e.g., contracts).

## 2) REPO / PROJECT STRUCTURE

**Folder Structure:**
```text
/apps/web                # The React Frontend
  /src
    /features            # Domain-driven design
      /hub               # Feed, Requests, Profile
      /admin             # People, Payroll, Org, Workflows
      /recruiting        # Kanban, Jobs, Scorecards
      /shared            # UI Kit, Hooks, Utils
    /layouts             # The 3 core layouts
/apps/api                # The Node Backend
  /src
    /modules             # Modules matching frontend features
    /middleware          # RBAC, Logging, Auth
    /db                  # Migrations & Seeds
/packages                # Shared Types/Utils
```

**URL Structure:**
*   `/login`, `/reset-password`
*   `/hub` (Dashboard), `/hub/me` (Profile), `/hub/time`, `/hub/docs`
*   `/admin` (Dashboard), `/admin/people`, `/admin/payroll`, `/admin/workflows`
*   `/recruiting/jobs`, `/recruiting/pipeline/{jobId}`, `/recruiting/candidates`
*   `/careers/{slug}` (Public)

**Environment Variables:**
`DATABASE_URL`, `REDIS_URL` (optional for queues), `AUTH_SECRET`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `SMTP_HOST` (Email).

## 3) UI INFORMATION ARCHITECTURE

**A) Employee Hub (/hub)**
*   **Sidebar:** Home, My Profile, Time & Absences, Documents, Company, Grow, Support.
*   **Key Views:**
    *   *Home:* Feed (Announcements), "Clock In" Widget, "Today's Team" status.
    *   *My Profile:* Personal Info (Edit), Bank Data.
    *   *Time:* Calendar View, Request Modal.

**B) People Admin (/admin)**
*   **Sidebar:** Dashboard, People Directory, Org Chart, Payroll, Time Tracking, Workflows, Reports, Settings.
*   **Key Views:**
    *   *People:* DataTable (filterable), Employee File (Tabs: Master Data, Salary, Docs).
    *   *Payroll:* Monthly Run view, Variance Report.
    *   *Org Chart:* D3/React-Flow Visualization.

**C) Recruiting (/recruiting)**
*   **Sidebar:** Dashboard, Jobs, Candidates, Talent Pool, Career Page Settings.
*   **Key Views:**
    *   *Pipeline:* Drag-and-drop Kanban (Applied -> Screen -> Interview -> Offer).
    *   *Candidate Detail:* Resume viewer, Scorecard form, Email timeline.

## 4) CORE FLOWS (Happy Path)

**A) Absence Request:**
1.  Employee: `/hub/time` -> Click "Request Absence" -> Form (Type: Vacation, Dates: Mon-Fri).
2.  Backend: Check Policy (Enough balance? Blocked dates?). Create `absence_request` (status: pending).
3.  Workflow: Determine Approver (Manager). Create `inbox_item` for Manager.
4.  Manager: `/hub` -> Inbox -> Click "Approve".
5.  Backend: Update status: `approved`. Deduct balance. Sync to `team_calendar`.

**F) Recruiting Process:**
1.  Recruiter: `/recruiting` -> Create Job "Frontend Dev". Publish.
2.  Candidate: Visits Public Page -> Fills Form -> Uploads PDF.
3.  System: Create `candidate`, `application`. Parse PDF (optional). Move to "Applied".
4.  Recruiter: Drags card to "Interview".
5.  Interviewer: Notification -> Fills `scorecard`.
6.  Recruiter: Move to "Offer" -> Generate PDF from Template -> Send via Docusign integration (or internal sign).

## 5) DATA MODEL (SQL) & ACCESS CONTROL

**Access Control Strategy:**
*   **RBAC:** `roles` (admin, hr, manager, employee). `permissions` (can_view_salary, can_approve_time).
*   **ABAC:** Dynamic checks in code/middleware. `canAccess = (user.role === 'hr' && user.entity === target.entity) || user.id === target.id`.

**DDL (PostgreSQL Flavor):**

```sql
-- CORE HR
CREATE TABLE legal_entities (id UUID PRIMARY KEY, name TEXT, country_code TEXT);
CREATE TABLE departments (id UUID PRIMARY KEY, name TEXT, cost_center TEXT);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    legal_entity_id UUID REFERENCES legal_entities,
    department_id UUID REFERENCES departments,
    manager_id UUID REFERENCES users,
    role TEXT NOT NULL DEFAULT 'employee', -- simplified for fast build
    first_name TEXT,
    last_name TEXT,
    start_date DATE,
    status TEXT -- active, onboarding, terminated
);

-- SENSITIVE DATA (Field Level Protection via separate table)
CREATE TABLE compensation (
    user_id UUID REFERENCES users PRIMARY KEY,
    base_salary INTEGER, -- in cents
    currency TEXT,
    effective_date DATE,
    variable_bonus_percent DECIMAL
);

-- TIME & ABSENCE
CREATE TABLE time_entries (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    start_at TIMESTAMP,
    end_at TIMESTAMP,
    break_minutes INT
);

CREATE TABLE absence_policies (
    id UUID PRIMARY KEY,
    name TEXT, -- e.g. "DE Vacation"
    entitlement_days INT,
    requires_approval BOOLEAN
);

CREATE TABLE absence_requests (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    policy_id UUID REFERENCES absence_policies,
    start_date DATE,
    end_date DATE,
    status TEXT, -- pending, approved, rejected
    approver_id UUID REFERENCES users
);

-- RECRUITING
CREATE TABLE jobs (
    id UUID PRIMARY KEY,
    title TEXT,
    department_id UUID,
    hiring_manager_id UUID REFERENCES users,
    status TEXT -- draft, published, closed
);

CREATE TABLE candidates (
    id UUID PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    resume_url TEXT
);

CREATE TABLE applications (
    id UUID PRIMARY KEY,
    job_id UUID REFERENCES jobs,
    candidate_id UUID REFERENCES candidates,
    stage TEXT, -- applied, screening, interview, offer, hired
    current_score DECIMAL
);

-- WORKFLOW / INBOX
CREATE TABLE inbox_items (
    id UUID PRIMARY KEY,
    assignee_id UUID REFERENCES users,
    reference_type TEXT, -- 'absence_request', 'offer_approval'
    reference_id UUID,
    status TEXT, -- pending, completed
    due_at TIMESTAMP
);
```

## 6) WORKFLOW ENGINE

*   **Structure:** No complex BPMN engine. Use a `state_machine` definition in code.
*   **Database:** `workflow_logs` table to track who approved what and when.
*   **Logic:**
    *   Trigger: Event (e.g., `ABSENCE_REQUESTED`).
    *   Resolver: Function `getApprover(requester)` -> returns Manager ID.
    *   Action: Insert row into `inbox_items`.

## 7) POLICY ENGINE

*   **Logic:** A standardized "Resolver" function.
    *   `resolvePolicy(user, type)`: Looks up `users.legal_entity` -> finds matching policy in `absence_policies`.
*   **Example (Time Off):**
    *   If `user.country == 'DE'`, use Policy A (30 days, doctor note after 3 days).
    *   If `user.country == 'US'`, use Policy B (Unlimited, approval required).

## 8) PRIVACY & COMPLIANCE

*   **Retention:** Cron job running daily. `DELETE FROM candidates WHERE created_at < NOW() - INTERVAL '6 MONTHS'`.
*   **Audit:** Global `audit_logs` table.
    *   Columns: `actor_id`, `resource_type`, `resource_id`, `action` (view, update, delete), `changes` (JSON diff), `ip_address`.
    *   **Strict rule:** EVERY Write operation writes to Audit. Sensitive Reads (Salary) write to Audit.

## 9) INTEGRATIONS BLUEPRINT

*   **Architecture:** Event Bus pattern.
*   **Events:** `USER_CREATED`, `ABSENCE_APPROVED`, `JOB_PUBLISHED`.
*   **Implementation:**
    *   Internal table `webhook_subscriptions` (url, event_types, secret).
    *   Background worker picks up events and POSTs payload to registered URLs with retry logic (exponential backoff).

## 10) "FAST BUILD" CHECKLIST

1.  **Init:** Setup Repo, Typescript, Tailwind, Linter.
2.  **DB:** Docker compose for Postgres or connect to Neon/Supabase. Run DDL.
3.  **Auth:** Implement Login Page + JWT handling/Session context.
4.  **Layouts:** Build the Shells (Sidebar + Topbar) for Hub, Admin, Recruiting.
5.  **Core HR:** Build "Employee List" and "Profile Edit" (Read/Write users table).
6.  **Hub Home:** Feed UI + "Clock In" button (stubbed).
7.  **Time Off:** Request Modal + Database Insert + Admin Approval View.
8.  **Org Chart:** Visualization component using `users.manager_id`.
9.  **ATS:** Job Creation Form + Public Job Board (read-only).
10. **ATS Pipeline:** Drag-and-Drop Kanban for candidates.
11. **RBAC:** Add Middleware/HOC to protect `/admin` routes.
12. **Audit:** Add `logAudit()` hook to all mutations.
