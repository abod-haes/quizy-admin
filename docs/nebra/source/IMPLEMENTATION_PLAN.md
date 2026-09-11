# Implementation Plan

## 1. Implementation Overview

Implementation follows the approved phase plan. Automated quizzes are not implemented. NEBRA subscriptions are implemented for AI and Public Courses.

---

## 2. Development Principles

- Backend business rules first.
- Multi-tenant checks server-side.
- Small coherent modules.
- Few logical commits, not one commit per tiny file.
- Reuse Quizy only after module audit.
- Keep migrations reversible/tested.
- Update docs with business-rule changes.

---

## 3. Project Setup Phase

### Goal
Create NEBRA backend foundation and documentation baseline.

### Tasks
- initialize/clean NestJS foundation.
- Prisma/PostgreSQL setup.
- environment validation.
- common error format.
- logging.
- health endpoint.
- test setup.

### Files Expected To Change
- package/config files.
- `src/common/*`
- `prisma/schema.prisma`
- test configuration.
- docs.

### Dependencies
None beyond environment/database.

### Acceptance Criteria
Given local environment  
When application starts  
Then API connects to PostgreSQL and health/test commands succeed.

### Notes for AI Coding Agent
Do not implement product features before access/tenant conventions are defined.

---

## 4. Database Phase

### Goal
Implement identity, institution and core profile schema.

### Tasks
- users.
- institutions.
- roles/permissions.
- institution memberships.
- student/parent/instructor profiles.
- student records.
- audit foundation.

### Acceptance Criteria
Given two institutions  
When seed data is created  
Then cross-tenant relationships are rejected by service validation/tests.

---

## 5. Core Features Phase

### Phase A — Identity & Institutions
- Auth.
- Platform Admin institution CRUD/status.
- Roles/permissions.
- Teacher/Supervisor scope infrastructure.

### Phase B — Academic Structure
- academic years.
- grades/sections.
- subjects/groups.
- school enrollments.
- institute enrollments.
- teacher assignments.
- supervisor scopes.
- student Excel import.

### Phase C — Academic Operations
- attendance.
- homework.
- schedules.
- academic exams.
- Excel grade import.
- draft/publish.
- gradebook.

### Phase D — Courses, AI & Subscriptions
- audit Quizy course/AI/subscription-related modules where useful.
- port/refactor courses/units/lessons/resources.
- platform/institution/instructor sources.
- visibility/targeting.
- implement minimal subscription plans and user subscriptions.
- enforce Public Courses subscription access.
- enforce AI subscription access.
- keep Institution TARGETED course access independent from Public Courses subscription.
- AI adapter and conversation flow.
- no automated quiz engine.
- keep subscription payment/provider integration out until business/provider rules are confirmed.

### Phase E — Student/Parent App APIs
- `/me`.
- student institution contexts.
- parent linked children.
- read models for attendance/grades/homework/courses.
- current subscription/access status for Student App.

### Phase F — Finance
- charges/payments/discounts/refunds.
- derived balance.
- parent finance read.
- accountant permissions.

---

## 6. Integrations Phase

### Goal
Implement invitations and communication after core data is stable.

### Tasks
- invitation tokens/expiry.
- phone verification flow.
- in-app notifications.
- queue.
- push.
- WhatsApp adapter.

### Dependencies
Identity, students, parents, academic events, finance events.

### Acceptance Criteria
Given published exam with parent notification disabled  
When publish succeeds  
Then student job exists and parent job does not.

---

## 7. Testing Phase

- unit policies/calculations.
- integration DB.
- E2E critical flows.
- import fixtures.
- permission matrix tests.
- tenant isolation tests.

---

## 8. Deployment Phase

- staging.
- migrations.
- environment secrets.
- backups.
- smoke tests.
- worker deployment when introduced.

---

## 9. Final QA Phase

- role-by-role walkthrough.
- school and institute scenarios.
- independent student scenario.
- independent instructor scenario.
- parent scenario.
- finance reconciliation.
- removed features check: no automated quiz UI/API; subscription access exists only for AI/Public Courses unless scope expands.

---

## 10. Implementation Checklist

- [ ] Phase 1 foundation complete.
- [ ] Identity/tenant isolation complete.
- [ ] Roles/permissions/scope complete.
- [ ] School structure complete.
- [ ] Institute structure complete.
- [ ] Student import complete.
- [ ] Attendance/homework complete.
- [ ] Academic exams + Excel grades complete.
- [ ] Courses/lessons/resources complete.
- [ ] Public Courses subscription access complete.
- [ ] AI complete with subscription access enforcement.
- [ ] Student/parent experience complete.
- [ ] Finance complete.
- [ ] Invitations/notifications/WhatsApp complete.
- [ ] Official results/read scaling complete when source is confirmed.
- [ ] Automated quizzes absent.
- [ ] AI/Public Courses subscription access complete.
