# Resource Reservation System

A full-stack web app for managing shared resources (meeting rooms, equipment, vehicles) and their reservations, built for the PrimeWave Lab Software Engineering Internship technical assessment.

**The core problem:** reservations were handled through informal communication and manual records, causing overlapping bookings and uncertainty about availability. This app gives the organization one place to manage resources, see availability at a glance, and book without ever double-booking.

- **ER diagram:** `https://dbdiagram.io/d/6ad06dccaebfe7a21ff57ee0`

## Features

- **Resource management:** create, edit, and deactivate resources with a category, capacity, and location.
- **Availability timeline:** pick a resource and a date to see free (green) and booked (red) hourly slots. Click a free slot to pre-fill the booking form.
- **Reservations:** create and cancel bookings, with a title, start, and end time.
- **Double-booking prevention:** overlapping reservations are rejected, even when two people book at the same moment (see [Key design decisions](#key-design-decisions)).
- **Clear conflict messages:** if a slot is taken, the app says who holds it and when.
- **Filters and pagination:** filter reservations by resource, status, and date; results are paginated.
- **Validation:** end must be after start, no bookings in the past, maximum booking length of 8 hours, resource must exist and be active.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Validation | Zod |
| Styling | Tailwind CSS |
| Local database | Docker Compose |

## Key design decisions

### 1. Double-booking is prevented by the database, not just by app code

The obvious approach (query for overlaps, then insert) has a race condition: two simultaneous requests can both pass the check and both insert. Instead, the database enforces the rule with a PostgreSQL **exclusion constraint**:

```sql
ALTER TABLE "Reservation"
  ADD CONSTRAINT no_overlapping_reservations
  EXCLUDE USING gist (
    "resourceId" WITH =,
    tstzrange("startTime", "endTime", '[)') WITH &&
  ) WHERE (status = 'CONFIRMED');
```

- Two confirmed reservations can never overlap on the same resource, regardless of concurrency.
- The range is half-open (`[)`), so a 9-10 booking and a 10-11 booking do not conflict.
- Cancelled reservations are excluded (`WHERE status = 'CONFIRMED'`), so cancelling frees the slot.
- The service layer also does a friendly **pre-check** so users see *who* holds the slot. The constraint is the safety net: if two requests race past the pre-check, only one INSERT succeeds and the other receives a clean 409 Conflict.

Prisma cannot express exclusion constraints in its schema, so the constraint lives in a hand-edited SQL migration (`prisma/migrations/*_init/migration.sql`), together with a `CHECK ("endTime" > "startTime")`.

### 2. Time handling

All timestamps are stored as `timestamptz` (UTC). The UI converts to and from the organization's timezone (`Asia/Colombo`) in one place, `lib/time.ts`. This avoids timezone bugs across the stack.

### 3. Soft deletes

Reservations are cancelled (`status = CANCELLED`, `cancelledAt` set) and resources are deactivated (`isActive = false`) rather than deleted. History stays intact for usage reporting.

### 4. Layered structure

- **Route handlers** (`app/api/**/route.ts`) are thin: parse input, call a service, return JSON.
- **Services** (`lib/services/`) hold the business rules, so they are easy to test and reuse.
- **Typed errors** (`ValidationError`, `NotFoundError`, `ConflictError`) are mapped to HTTP status codes (400, 404, 409) in one place, `lib/errors.ts`.
- **Zod** validates input at the API boundary; the database enforces integrity again underneath.
- **Server Components** read from the database directly; **Client Components** are used only where interactivity is needed (forms, buttons).

Indexes: the GiST index behind the exclusion constraint, plus `(resourceId, startTime)` and `(userId)` on `Reservation`.

## Getting started

### Prerequisites

- Node.js 20 or newer
- Docker Desktop (for PostgreSQL), or any PostgreSQL 14+ instance
- Git

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd resource-reservation
npm install

# 2. Create your environment file
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env

# 3. Start PostgreSQL (maps container port 5432 to local port 5433)
docker compose up -d

# 4. Create the tables and the overlap constraint
npx prisma migrate dev

# 5. Load sample data
npx prisma db seed

# 6. Run the app
npm run dev
```

Open the URL printed in the terminal. By default the `dev` script in `package.json` sets the port; change it with `-p` if it clashes with something on your machine.

### Environment variables

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://app:app@localhost:5433/reservations` |

### Using your own PostgreSQL instead of Docker

Skip step 3, set `DATABASE_URL` in `.env` to your database, and run steps 4 to 6. The database user needs permission to run `CREATE EXTENSION btree_gist` (required by the exclusion constraint). Hosted databases such as Neon support it.

### Sample data

`prisma db seed` creates 3 categories, 4 resources (Boardroom, Huddle Room, Projector, Company Van), 2 users (Alice, an admin, and Bob), and a few reservations dated **relative to today** (tomorrow and the day after), so the availability view is populated straight away. Re-running the seed resets the data.

## Using the app

| Page | What it does |
|---|---|
| `/availability` | Choose a resource and date, see the hourly timeline, click a free slot to book |
| `/reservations` | List, filter, paginate, and cancel reservations |
| `/resources` | Add, edit, and deactivate resources |

**Try the conflict handling:** book a slot, then try to book an overlapping time on the same resource. You will get a message saying who holds it. A back-to-back booking (for example 10:00-11:00 right after 09:00-10:00) is allowed.

## API reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/resources` | List resources |
| POST | `/api/resources` | Create a resource |
| PATCH | `/api/resources/:id` | Update or deactivate a resource |
| GET | `/api/categories` | List categories |
| GET | `/api/users` | List users |
| GET | `/api/reservations` | List reservations. Query: `resourceId`, `status`, `from`, `to`, `page`, `pageSize` |
| POST | `/api/reservations` | Create a reservation. Returns **409** with details of the clashing booking on overlap |
| DELETE | `/api/reservations/:id` | Cancel a reservation (soft cancel) |

Example:

```bash
curl -X POST http://localhost:8080/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"resourceId":2,"userId":2,"title":"Planning","startTime":"2026-10-20T04:00:00Z","endTime":"2026-10-20T05:00:00Z"}'
```

## Project structure

```
app/
  api/                  # route handlers (route.ts only)
  availability/         # timeline + booking form
  reservations/         # list, filters, cancel
  resources/            # resource management
lib/
  db.ts                 # Prisma client singleton
  errors.ts             # typed errors -> HTTP responses
  time.ts               # UTC <-> Asia/Colombo helpers
  validators/           # Zod schemas
  services/             # business logic (reservation.service.ts)
prisma/
  schema.prisma
  migrations/           # includes the raw SQL exclusion constraint
  seed.ts
docker-compose.yml
```

## Assumptions and scope

Chosen deliberately to keep the project focused on the business problem:

- **No authentication.** The user making a booking is chosen from a dropdown. The `User` table and `role` field are in place, so adding auth later does not require a schema change.
- **Single timezone.** The organization is assumed to operate in `Asia/Colombo`.
- **Hourly timeline.** The availability view shows 08:00-20:00 in one-hour rows. Bookings themselves can start and end at any minute.
- **Booking limits.** Maximum 8 hours per booking; bookings in the past are rejected.
- **Out of scope:** email notifications, recurring reservations, approval workflows, payments, multi-tenancy, usage dashboard.

## Troubleshooting

- **`EACCES: permission denied` on port 3000 (Windows):** Windows can reserve port ranges (Hyper-V / WinNAT). Pick a port outside the reserved ranges (see `netsh interface ipv4 show excludedportrange protocol=tcp`) and set it in the `dev` script.
- **Prisma cannot connect or authentication fails:** make sure `DATABASE_URL` points at the Docker port (`5433`), not a local PostgreSQL install on `5432`.
- **`prisma migrate dev` fails on `btree_gist`:** the database user must be allowed to create extensions.

## Future improvements

- Authentication and role-based permissions (admins manage resources, members manage their own bookings)
- Usage dashboard (bookings per resource, utilization)
- Suggested alternative slots when a conflict occurs
- Recurring reservations and per-resource business hours
- Automated tests for the reservation service, including a concurrent-booking test
