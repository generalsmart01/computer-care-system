# Computer Maintenance Booking System — Implementation Review

## 1. Application overview

ComputerCare is a role-based repair-management platform for computers, tablets, and phones. It coordinates the repair lifecycle among customers, technicians, administrators, and super administrators—from device registration and booking through diagnosis, quotation approval, repair, quality control, handover, and review.

The application is a modular monolith: its UI, server-rendered pages, server actions, business logic, authentication, and database access run in one Next.js application and deployment unit. The health endpoint identifies the architecture as `nextjs-modular-monolith`.

### Technology stack

| Area | Implementation |
|---|---|
| Framework | Next.js 16 App Router |
| UI | React 19 server and client components |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 and shared application CSS |
| Database | MongoDB through Mongoose 8 |
| Validation | Zod |
| Authentication | Custom signed JWT cookie using `jose` |
| Password hashing | bcrypt, cost factor 12 |
| Email | Nodemailer over SMTP |
| Image storage | Cloudinary |
| Tests | Vitest, Testing Library, and Playwright |
| Local infrastructure | Docker Compose with MongoDB 8 |
| Container deployment | Multi-stage Node 22 Docker image |

Evidence: `package.json`, `next.config.ts`, `app/api/health/route.ts`, and `Dockerfile`.

## 2. Feature inventory

“Connected in code” means the UI, server logic, and database operations are linked. It does not prove the feature has been exercised successfully in production.

| Feature | Role | Current behavior | Status | Supporting paths |
|---|---|---|---|---|
| Customer registration | Public/customer | Creates a customer with a hashed password and sends verification email | Connected in code; SMTP unverified | `features/auth/auth.actions.ts`, `models/User.ts` |
| Email verification | Customer | Hashed, single-use, expiring verification token | Connected in code | `features/auth/email-verification.service.ts`, `models/EmailVerificationToken.ts` |
| Separate role logins | All roles | Separate customer, technician, and admin login pages enforce the expected role | Connected in code | `app/(auth)/login`, `features/auth/auth.actions.ts` |
| Sessions/logout | All roles | Seven-day signed JWT in an HTTP-only cookie | Connected in code | `lib/auth.ts`, `lib/session-cookie.ts` |
| Password change | Customer | Verifies the old password, changes the hash, and logs the customer out | Connected in code | `features/auth/password.actions.ts`, `app/(customer)/dashboard/profile/page.tsx` |
| Forgotten password | Customer | Directs users to support because self-service recovery is unavailable | Placeholder | `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx` |
| Device management | Customer | Creates, views, edits, and deactivates owned devices | Connected in code | `features/devices`, `models/Device.ts` |
| Booking wizard | Customer | Multistep device, service, issue, image, method, address, appointment, and review flow | Connected in code | `components/booking/booking-wizard.tsx`, `features/bookings/booking.actions.ts` |
| Diagnostic images | Customer | Validates images and uploads them to Cloudinary | Connected in code; integration unverified | `features/uploads` |
| Repair tracking | Customer | Shows status history, diagnosis, quotation, repair report, and handover | Connected in code | `app/(customer)/dashboard/bookings`, `models/BookingStatusHistory.ts` |
| Booking cancellation | Customer | Cancels only at eligible stages and records a reason | Connected in code | `features/bookings`, `features/bookings/status.rules.ts` |
| Quotation response | Customer | Approves or rejects the current quote; expired quotes cannot be approved | Connected in code | `features/quotations/response.service.ts` |
| Notifications | Customer | Shows all/unread notifications and marks one or all read | Connected in code | `features/notifications`, `app/(customer)/dashboard/notifications/page.tsx` |
| Reviews | Customer | Allows one review for an owned completed booking | Connected in code | `features/reviews/review.service.ts`, `models/Review.ts` |
| Staff onboarding | Super admin/staff | Invitation verification followed by password creation | Connected in code; SMTP unverified | `features/auth/email-verification.service.ts` |
| Technician availability | Technician | Sets available, busy, or off duty | Connected in code | `features/technicians/availability.actions.ts` |
| Technician jobs | Technician | Accepts assignments, diagnoses, quotes, repairs, and submits reports | Connected in code | `app/(technician)/technician/jobs`, `features/assignments` |
| Diagnosis/revision | Technician/admin | Saves drafts, submits diagnoses, and preserves revisions | Connected in code | `features/diagnoses`, `models/Diagnosis.ts` |
| Repair reporting | Technician | Records work, parts, tests, notes, warranty, and QC submission | Connected in code | `features/repairs`, `models/RepairReport.ts` |
| Booking intake | Admin | Confirms/rejects, records device receipt, and progresses intake states | Connected in code | `app/(admin)/admin/bookings`, `features/bookings/status.service.ts` |
| Technician assignment | Admin | Assigns available technicians within capacity; technician accepts | Connected in code | `features/assignments`, `models/Assignment.ts` |
| Quotation management | Admin/technician | Builds versioned, itemized, server-calculated quotations | Connected in code | `features/quotations`, `models/Quotation.ts` |
| Quality checking | Admin | Passes a repair to collection or returns it for correction | Connected in code | `features/repairs/quality-check.service.ts` |
| Final handover | Admin | Records recipient and amount and closes related records | Connected in code | `features/repairs/handover.service.ts` |
| Service catalogue | Public/admin | Public catalogue with admin create/edit/activation controls | Connected in code | `app/(public)/services`, `app/(admin)/admin/services`, `models/Service.ts` |
| Service seed catalogue | Operations | Inserts Nigerian-priced computer, tablet, and phone services | Tooling implemented; DB contents unverified | `lib/care-service-catalog.ts`, `scripts/seed-services.ts` |
| User management | Admin/super admin | Searches users and manages eligible active/suspended states | Connected in code | `app/(admin)/admin/users`, `features/users` |
| Administrator creation | Super admin | Creates administrator invitations | Connected in code | `app/(admin)/admin/administrators`, `features/administrators` |
| Reports | Admin | MongoDB aggregates for volume, status, services, faults, duration, and workload | Connected in code; runtime output unverified | `features/reports/report.service.ts` |
| Audit logs | Admin | Displays persisted operational audit events | Partial; coverage is not exhaustive | `app/(admin)/admin/audit-logs`, `models/AuditLog.ts` |
| Settings | Admin | Describes environment-managed integrations | Informational only | `app/(admin)/admin/settings/page.tsx` |
| Demo data | Development | Seeds Nigerian users, devices, services, and bookings into a real database | Development tooling | `lib/demo-seed.ts`, `scripts/seed.ts` |

No payment gateway, SMS provider, live chat, real-time WebSocket updates, maps, or calendar integration was found.

## 3. Route inventory

### Public and authentication routes

| Route | Purpose | Access/data |
|---|---|---|
| `/` | Marketing homepage | Public; database-backed services/reviews with fallback |
| `/services` | Active catalogue | Public; real database data |
| `/services/[slug]` | Service detail | Public; real database data |
| `/about`, `/faq`, `/contact` | Informational content | Public and static |
| `/forbidden` | Access-denied result | Public |
| `/register` | Customer registration | Public |
| `/login` | Customer login | Public |
| `/login/admin` | Admin/super-admin login | Public |
| `/login/technician` | Technician login | Public |
| `/verify-email` | Customer verification/resend | Token flow |
| `/onboarding/technician` | Technician password setup | Invitation token |
| `/onboarding/administrator` | Administrator password setup | Invitation token |
| `/forgot-password`, `/reset-password` | Recovery information | Placeholder |

### Customer routes

All require a customer session:

- `/dashboard`
- `/dashboard/bookings`
- `/dashboard/bookings/new`
- `/dashboard/bookings/[bookingId]`
- `/dashboard/devices`
- `/dashboard/devices/new`
- `/dashboard/devices/[deviceId]`
- `/dashboard/devices/[deviceId]/edit`
- `/dashboard/notifications`
- `/dashboard/profile`

### Technician routes

All require the `TECHNICIAN` role:

- `/technician`
- `/technician/jobs`
- `/technician/jobs/[bookingId]`
- `/technician/profile`

Technicians who have not completed invitation onboarding are redirected to onboarding.

### Administrator routes

The following require `ADMIN` or `SUPER_ADMIN`:

- `/admin`
- `/admin/bookings`
- `/admin/bookings/[bookingId]`
- `/admin/services`
- `/admin/services/new`
- `/admin/services/[serviceId]`
- `/admin/technicians`
- `/admin/technicians/[technicianId]`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/reports`
- `/admin/audit-logs`
- `/admin/settings`

`/admin/technicians/new`, `/admin/administrators`, and `/admin/administrators/new` require `SUPER_ADMIN`.

### API routes

| Route | Behavior |
|---|---|
| `GET /api/health` | Pings MongoDB and returns 200 or 503 |
| `GET /api/auth/current-user` | Returns the verified session payload or `null` |

## 4. Main workflows

### Registration and onboarding

Customer data is validated, the password is hashed, and an unverified customer is created. A random token is generated while only its SHA-256 hash is stored. Verification consumes the token and permits login. Resend responses do not disclose whether an address exists.

Super administrators create technicians and administrators. The application stores an unusable random password and `mustChangePassword`, sends a single-use invitation link, and lets the invitee create a private password. No temporary password is exposed.

### Device and booking flow

Customers register owned devices and use an eight-stage booking wizard. Active and compatible services are checked in the client and server. The server rejects inactive devices, incompatible services, and another active booking for the same device. A counter generates the booking reference; price snapshots, initial history, and notifications are persisted.

### Repair lifecycle

The primary enforced status path is:

`PENDING → CONFIRMED → AWAITING_DEVICE → RECEIVED → ASSIGNED → DIAGNOSING → AWAITING_APPROVAL → APPROVED → REPAIRING → QUALITY_CHECK → READY_FOR_COLLECTION → COMPLETED`

Supported branches include rejection/cancellation in eligible stages, diagnosis revision from `AWAITING_APPROVAL`, and return to `REPAIRING` after failed quality control. Invalid shortcuts and terminal-state changes are rejected.

The technician accepts an assignment, prepares a versioned diagnosis, and submits customer-safe findings. An administrator may request revision. Quotation totals are calculated on the server, and the customer approves or rejects the current quote. The technician records repair work and submits a complete report. An administrator performs quality checking and confirms handover after a pass.

Visible but non-operational functionality is limited principally to password recovery, contact submission, and editable admin settings.

## 5. Database and backend

The application defines the following MongoDB models under `models/`:

- `User`
- `TechnicianProfile`
- `Device`
- `Service`
- `Booking`
- `BookingStatusHistory`
- `Counter`
- `Assignment`
- `Diagnosis`
- `Quotation`
- `RepairReport`
- `Review`
- `Notification`
- `AuditLog`
- `EmailVerificationToken`

Important constraints include unique user emails, service slugs, booking references, employee numbers, one review per booking, versioned diagnosis/quotation indexes, notification inbox indexes, and a partial unique index limiting active assignments per booking.

`lib/db.ts` reads `process.env.MONGODB_URI` through validated environment configuration. It caches the Mongoose connection and in-flight promise globally, disables command buffering, enables automatic indexes outside production, clears failed connection promises for retry, and throws a generic error instead of exposing connection credentials.

Most writes use Next.js server actions calling feature service modules. Health and current-session operations use route handlers.

The application does not consistently use MongoDB multi-document transactions. Some workflows attempt manual rollback, but partial completion remains possible if a later write fails.

## 6. Security and access control

Implemented protections include bcrypt password hashing, password-strength validation, signed HTTP-only cookies, server-side role checks, ownership-scoped customer queries, technician assignment checks, super-admin checks, Zod validation, server-calculated quotation totals, hashed expiring tokens, upload limits, and production HTTPS/Cloudinary requirements.

Material gaps:

1. `proxy.ts` decodes rather than verifies the JWT for early routing. Protected layouts and actions subsequently verify it, so the proxy is not the final authorization boundary.
2. Stateless sessions cannot be centrally revoked.
3. Role and account status are embedded in the seven-day JWT and can remain stale until logout or expiry.
4. Multi-document workflows are not uniformly transactional.
5. Staff notifications can be persisted, but only customers have a dedicated notification inbox.

## 7. Interface and accessibility

The code contains separate public, authentication, and dashboard layouts; responsive sidebars and a mobile drawer; loading/error/not-found states; shared headers, cards, badges, panels, skeletons, and empty states; skip links; labelled controls; semantic navigation, tables, and fieldsets; `aria-current`; alert/status announcements; visible focus styling; reduced-motion rules; and named icon buttons.

These are useful foundations but do not prove accessibility compliance. No Axe scan, screen-reader audit, keyboard walkthrough, colour-contrast report, or formal certification is present.

## 8. Integrations and deployment

External dependencies are MongoDB/Atlas, SMTP, Cloudinary, and the deployment platform.

Environment variable names used by the application and operational scripts are:

- `MONGODB_URI`
- `SESSION_SECRET`
- `APP_URL`
- `NODE_ENV`
- `ALLOW_INSECURE_LOCAL_E2E`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DEMO_PASSWORD`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

No secret values are included in this report.

Node is pinned to version 22. Standalone Next.js output is used outside Vercel. The Docker image uses a multi-stage build and non-root runtime, while Docker Compose exposes local MongoDB on loopback. The container health check calls `/api/health`.

**Owner-reported context:** the application is deployed on Vercel, uses MongoDB Atlas, and production connectivity worked after updating the Atlas IP access list. This was not independently verified during the review.

## 9. Implementation status and verification

### Connected implementations

Role authentication, email verification, staff onboarding, customer password change, devices, services, booking, lifecycle transitions, assignment, diagnosis, quotations, repair tracking, quality control, handover, customer notifications/reviews, management pages, reports, and health checks are connected in the codebase.

### Incomplete or partial functionality

- Self-service password recovery.
- Contact-form submission.
- Editable operational settings.
- Staff notification inboxes.
- Immediate session revocation following suspension or role changes.
- Uniform transactional safety.
- Demonstrably complete audit coverage.
- Review moderation UI was not established from the inspected admin routes.

### Identified defect

`features/repairs/handover.service.ts` formats the completed-booking email’s final amount with `$`, conflicting with the application’s Nigerian-naira presentation.

### Verification performed during the audit

- `npm test`: **35 test files and 134 tests passed**.
- `npm run typecheck`: passed.
- `npm run lint`: passed.

Integration and Playwright suites were not run because their setup creates, clears, and seeds databases. `next build` was not run because it writes build artifacts. No production database write, email, upload, migration, or seed operation was performed.

Passing static checks and the presence of implementation code do not prove that Atlas, SMTP, Cloudinary, or every workflow currently works end to end in production.

## Presentation-ready summary

ComputerCare is a modular-monolith repair-management application built with Next.js, TypeScript, MongoDB, and React. It supports customer, technician, administrator, and super-administrator roles and implements the primary repair lifecycle from account verification and device registration through booking, diagnosis, quotation approval, repair, quality checking, handover, and review.

The system includes server-enforced role and ownership checks, hashed passwords, signed HTTP-only sessions, expiring verification tokens, database-backed dashboards and reports, SMTP notifications, Cloudinary uploads, responsive role-specific interfaces, and broad automated test coverage. Its main remaining gaps are password recovery, contact submission, staff notification inboxes, editable settings, immediate session revocation, and stronger multi-record transaction guarantees.
