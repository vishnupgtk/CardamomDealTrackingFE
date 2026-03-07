# Cardamom Deal Tracking System

Production-ready baseline with:
- Admin and Partner roles
- Partner registration approval workflow
- Purchase stock + allocation to sales deals
- Partner payment request approval workflow
- Completed-deal profit ledger
- JWT authentication + role authorization
- EF Core provider portability (SQL Server local, PostgreSQL production)

## Tech Stack
- Backend: .NET 8 Web API, EF Core, AutoMapper, JWT
- Frontend: React + Vite, Axios interceptors, React Router, Tailwind
- Deployment targets: Render (API), Vercel (frontend), Supabase PostgreSQL

## Environment Variables

Backend (`Backend/CardamomDealTracking.API/.env.example`):
- `DATABASE_CONNECTION`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `ADMIN_SETUP_KEY`

Frontend (`.env.example`):
- `VITE_API_BASE_URL`

## Local Development

1. Backend
```bash
cd Backend
dotnet restore
dotnet build
dotnet run --project CardamomDealTracking.API
```

2. Frontend
```bash
npm install
npm run dev
```

## EF Migrations

Create migration:
```bash
cd Backend
dotnet ef migrations add InitialProductionSchema \
  --project CardamomDealTracking.Infrastructure \
  --startup-project CardamomDealTracking.API \
  --context ApplicationDbContext
```

Apply migration:
```bash
dotnet ef database update \
  --project CardamomDealTracking.Infrastructure \
  --startup-project CardamomDealTracking.API \
  --context ApplicationDbContext
```

## Provider Switching Rules

- SQL Server (local): use SQL Server connection string in `DATABASE_CONNECTION`.
- PostgreSQL (Render/Supabase): use `Host=...;Database=...;Username=...;Password=...` format.
- `Program.cs` auto-selects `UseSqlServer` or `UseNpgsql` based on `DATABASE_CONNECTION`.
- No database-specific SQL is used in application logic.

## Important Business Rules Implemented

- Admin can be created via backend setup endpoint (`POST /api/auth/create-admin`) using `X-Admin-Setup-Key`.
- Partner login is blocked until admin approval.
- Deal partner percentages must sum to 100.
- Deal allocations must equal deal total kg.
- Allocation cannot exceed purchase remaining kg.
- Overpayment is rejected.
- Payment approval runs in transaction.
- Completed deal snapshot is immutable-style ledger data.
- Profit for dashboards is sourced from completed ledger records.
