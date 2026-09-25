# Municipal Budget & Development Project Transparency Tracker

E-governance academic project (Nepal). This file orients Claude (or any coding agent) to the project so it can scaffold, build, and extend the system consistently across sessions.

## 1. What this project is

A public-facing web platform that tracks municipal/ward development projects (roads, drinking water schemes, school construction, drainage, etc.) against their approved budgets, so citizens can verify whether approved projects were actually delivered.

**Problem it solves:** Budget and progress data in Nepali municipalities is scattered across PDFs, notice boards, and assembly minutes, with no public way to cross-check spending against real-world delivery. This creates an accountability gap — money can be reported as spent with no easy way to confirm a project was actually completed.

**Relevance:** Supports the transparency, citizen participation, and data-driven governance goals of Nepal's Digital Nepal Framework. Distinct from existing platforms — Nagarik App focuses on service delivery, GIOMS on internal office workflow — neither offers citizen-facing, project-level budget-to-delivery tracking.

## 2. Objectives

1. Structured digital system for recording development projects with budget allocation, actual expenditure, timeline, and status.
2. Public citizen-facing dashboard to browse/monitor projects by ward, sector, and status.
3. Citizen reporting: let citizens flag/report on a project's real-world status (two-way accountability channel).
4. Role-based admin interface for municipality staff to manage records, update statuses, and respond to reports.
5. Visualizations of budget utilization and completion trends for oversight.

## 3. Scope

**In scope**
- One representative municipality/ward as the working dataset (real published budget data where available, otherwise a realistic dataset modeled on actual municipal budget formats).
- Two roles: **Citizen** (public, view + report, no login required) and **Admin** (municipality staff, manage data, requires login).
- Core features: project listing, project detail (budget/status/timeline), citizen reporting, admin management, basic analytics/visualization.

**Out of scope**
- Live integration with government treasury/financial systems (admin enters/updates expenditure manually — no automated pull).
- Multi-municipality federation or national-scale deployment (prototype demonstrates the model at single-municipality scale).

## 4. Functional requirements

### Citizen-facing
- Browse / search / filter projects by ward, sector, status
- Project detail view: budget allocated vs. spent, timeline, status history
- Submit a status report or complaint on a project (comment + optional photo; identifying themselves is optional)
- Dashboard-level stats: total budget, completion rate, sector breakdown

### Admin-facing
- Secure login
- Create, edit, and update project records and status
- View and respond to citizen reports
- Audit history of changes (who updated what, when)

## 5. Non-functional requirements

- **Security:** role-based access control; input validation/sanitization on citizen submissions; authenticated admin actions only.
- **Usability:** mobile-responsive (most citizens will access via phone); simple navigation; citizens never need to log in to browse or report.
- **Performance:** filtering/search stays fast as project count grows.
- **Reliability:** clear loading / empty / error states everywhere — the system should fail gracefully, never silently.

## 6. Suggested tech stack

- **Backend:** Java Spring Boot (REST API), Spring Security for role-based auth, JPA/Hibernate
- **Database:** PostgreSQL or MySQL
- **Frontend:** React + Tailwind CSS, Recharts for charts
- **Auth:** JWT-based session for admin login

(Deviating from this stack is fine if there's a good reason — flag the tradeoff before switching.)

## 7. Data model (starting point)

Core entities to design around — refine as the schema is built out:

- **Project** — id, title, description, ward, sector, budget_allocated, budget_spent, start_date, target_end_date, status (e.g. Not Started / In Progress / Stalled / Completed), created_at, updated_at
- **StatusHistory** — project_id, previous_status, new_status, changed_by (admin), changed_at, note
- **CitizenReport** — project_id, reporter_name (optional/nullable), comment, photo_url (optional), submitted_at, admin_response (optional), responded_at
- **AdminUser** — id, name, email, hashed_password, role
- **AuditLog** — entity type, entity id, field changed, old_value, new_value, changed_by, changed_at

## 8. Deliverables expected

- Working prototype: public dashboard + citizen reporting + admin panel, runnable locally or deployed
- System design artifacts: ER diagram, use case diagram, architecture diagram
- Full documentation per department format: Problem Identification, Objectives, Scope, Literature Review, System Analysis & Design, Implementation, Testing, Conclusion, Future Scope
- Individual contribution breakdown per group member (if a group project)

## 9. Future scope (documentation only, not to build now)

- Integration with real municipal financial/treasury data feeds where APIs become available
- Expansion to multiple municipalities with comparative dashboards
- SMS/IVR reporting channel for citizens without smartphone/internet access
- Automated anomaly detection (e.g., flag projects with high spend but no status updates)

## 10. How to work on this project

- Treat Section 4 (functional requirements) as the feature checklist — build citizen-facing flows and admin-facing flows as separable modules.
- Seed the database with a realistic single-ward dataset before wiring up the frontend, so UI states (empty/loading/populated) can be tested against real-shaped data.
- Keep citizen submission endpoints unauthenticated but validated/sanitized; keep every admin mutation behind auth and logged to AuditLog.
- When in doubt about scope, check Section 3 — no treasury integration, no multi-municipality support in this version.
