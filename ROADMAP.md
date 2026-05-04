# RTG Media Operating System — Roadmap

Living document. Tick items as they ship. Each phase builds on the last; do not rebuild auth, approvals, or existing booking/article systems.

Legend: ✅ done · 🚧 in progress · ⬜ todo

---

## Phase 1 — Core Operations *(in progress)*
1. ✅ Projects (table, RLS, audit, basic UI)
2. ✅ Tasks (table, RLS, audit, comments, completion)
3. ✅ Task views — My Tasks, Team Tasks, Overdue, Due This Week, Kanban, List
4. ✅ Deadlines Calendar (overlay tasks/projects/bookings/articles on existing calendar)
5. ✅ Notifications (in-app, per-user; triggers on task assign / project status / booking assign)

## Phase 2 — Management & Coordination
6. ⬜ Meeting notes + action-items → tasks
7. ⬜ Internal announcements
8. ⬜ Staff directory upgrade
9. ⬜ Departments
10. ⬜ Skills system

## Phase 3 — Booking & Client Operations
11. ⬜ Booking pipeline statuses
12. ⬜ Staff assignment UX (skills, conflicts)
13. ⬜ Quotes & invoices
14. ⬜ Client CRM

## Phase 4 — Editorial & Content
15. ⬜ Editorial calendar
16. ⬜ Editorial workflow (writer/editor/approval)
17. ⬜ Content review queue
18. ⬜ Social media planner

## Phase 5 — Assets & Media
19. ⬜ Asset library (project-scoped)
20. ⬜ Version tracking

## Phase 6 — Permissions & Security
21. ⬜ Per-user permission toggles (overrides role defaults)
22. 🚧 Audit log (already on most sensitive tables; expand coverage)
23. ⬜ Approval rules (deletes, price changes, role changes)

## Phase 7 — Executive Dashboards
24. ⬜ Owner dashboard (workload, pipeline, audit)
25. ✅ Project Manager dashboard (assigned projects, overdue tasks, week deadlines)

## Phase 8 — Polish
26. ⬜ Global search (across projects/tasks/bookings/clients/articles/staff/assets)
27. ⬜ Universal table filters
28. ⬜ Activity feed per project/booking
29. 🚧 Mobile usability sweep
30. ⬜ Emergency admin actions (reassign / override / lock / archive)

---

## Architecture notes
- Tasks live in `project_tasks`; projects in `projects`. Both have RLS based on assignment + `is_pm_or_admin()`.
- Notifications live in `notifications`, written only by SECURITY DEFINER triggers.
- Calendar shows `calendar_events` plus an overlay of task / project / booking / article deadlines (no mirroring).
- Permissions use roles only; per-user override table comes in Phase 6.

## Phase 2 — Business + Client Systems

### ✅ Step 1: Client Portal + Messaging
- `clients`, `project_clients`, `message_threads`, `messages` tables
- `/portal` — client-facing dashboard (overview / projects / quotes / invoices / messages)
- Realtime messaging with mention + participant notifications
- RLS: clients see only their linked projects, sent quotes, non-draft invoices, client-visible threads

### ✅ Step 3: Quotes + Invoices (Stripe-ready)
- `quotes` + `quote_line_items` with auto-numbering (Q-YYYY-####)
- `invoices` with payment_provider/status, stripe_*, payment_url, paid_at
- PM discount cap enforced at 15% via trigger
- Auto-rollup of `clients.total_spend` from paid invoices

### ✅ Step 4: CRM
- Clients section (list/filter/create/detail)
- Linked projects, bookings, quotes, invoices on detail view

### ⏳ Remaining Phase 2
- Analytics dashboard, Content/social workflow, File delivery, Newsletter

## Phase 3 — Not started
