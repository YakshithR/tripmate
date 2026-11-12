# TripMate — School Trip Registration

A beginner-friendly three-tier application: Bootstrap frontend, Express/Node.js API, and PostgreSQL database accessed through Prisma.

## Run with Docker Compose (recommended)

Requirements: Docker Desktop with Docker Compose.

```bash
# 1. Enter the project directory
cd tripmate

# 2. Create your local environment file
cp .env.example .env
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env
```

Edit `.env` and change the database password, admin password and session secret. Then run:

```bash
docker compose up --build -d
docker compose ps
docker compose logs -f app
```

The app waits for PostgreSQL's health check, applies the Prisma migration, and starts the server.

Open:
- Student registration: http://localhost:3000
- Admin dashboard: http://localhost:3000/admin
- Health check: http://localhost:3000/health

Admin credentials are the values of `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `.env`.

## Run locally without Docker

You need Node.js 22+ and PostgreSQL running locally.

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your local PostgreSQL connection string.
3. Install dependencies and generate Prisma Client:

```bash
npm install
npx prisma generate
```

4. Apply the checked-in migration:

```bash
npx prisma migrate deploy
```

5. Start the server:

```bash
npm start
```

For development with automatic Node.js restarts:

```bash
npm run dev
```

## Useful Docker commands

```bash
# View logs
docker compose logs -f app

# Stop containers (keeps database volume)
docker compose down

# Stop and delete the database volume (DESTROYS saved registrations)
docker compose down -v

# Rebuild after changing application code
docker compose up --build -d

# Open a PostgreSQL shell
docker compose exec db psql -U tripmate -d tripmate
```

## Main API routes

| Method | Endpoint | Purpose | Access |
|---|---|---|---|
| GET | `/health` | App and database health | Public |
| GET | `/api/trips` | List available trips | Public |
| POST | `/api/students/register` | Register a student | Public |
| POST | `/api/admin/login` | Admin login | Public |
| POST | `/api/admin/logout` | Admin logout | Admin session |
| GET | `/api/admin/session` | Check login state | Public |
| GET | `/api/trips/summary` | Registration totals by trip | Admin |
| POST | `/api/trips` | Add a trip | Admin |
| GET | `/api/students` | List registrations | Admin |
| DELETE | `/api/students/:id` | Delete a registration | Admin |

## Data model notes

- A student is identified within the school by the combination of class, section and roll number.
- The database has a unique constraint on `student_id + trip_id`, so the same student cannot register twice for one trip.
- A student can register for different trips.
- Deleting a registration does not delete the student record.
- Deleting a trip cascades to its registrations.

## Learning flow

1. Submit a registration from the browser.
2. Inspect the request in browser Developer Tools → Network.
3. Follow the Express route in `routes/students.js`.
4. Inspect the Prisma transaction and database constraints.
5. Check the saved records with `docker compose exec db psql -U tripmate -d tripmate`.
6. Build and run the same stack using Docker Compose.

This is a learning/demo application. For production, replace the in-memory Express session store with a persistent store, add CSRF protection and rate limiting, use HTTPS, and use a stronger admin authentication system.
