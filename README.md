# Computer Maintenance Booking System

## Local development

Copy `.env.example` to `.env.local` and replace the session secret. The default MongoDB URI expects the local Docker service.

```bash
npm run db:up
npm run seed
npm run dev
```

`npm run seed` always creates the eight service records. To create the complete idempotent demonstration dataset (1 administrator, 3 technicians, 5 customers, 10 devices, and 20 bookings), set a strong local `DEMO_PASSWORD` before running the command. The password is read only at runtime and must never be committed.

Primary demo logins use the runtime `DEMO_PASSWORD`:

| Role | Email |
| --- | --- |
| Administrator | `admin0@example.test` |
| Technician | `technician1@example.test` |
| Customer | `customer4@example.test` |

Rerunning the seed rotates all demo-account password hashes to the currently configured value without creating duplicate users.

MongoDB data is stored in a named Docker volume and survives container restarts. Use `npm run db:status` to check readiness. `npm run db:down` stops the local service without deleting its data volume.

Production releases must configure every variable in `.env.example`, use an HTTPS `APP_URL`, and run `npm run db:indexes` before starting the application. See `docs/DEPLOYMENT.md` for the complete checklist.
