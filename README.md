# ⚽ GafferDex — The Fantasy Transfer & Club Exchange

> **GafferDex** is a gamified web platform combining real-time Premier League transfer market tracking with an interactive "Sporting Director" simulator.

Instead of passive news reading or traditional fantasy football (which focuses only on weekly player points), **GafferDex** puts users in the shoes of a football club owner and sporting director. Users launch their virtual club with an initial demo purse (£150M), sign real Premier League stars and wonderkids, trade dynamically as prices fluctuate based on real-world rumors, completed deals, and match performances, and compete to build the most valuable football empire.

---

## 📂 Monorepo Workspace Layout

```text
PL market/
├── apps/
│   ├── web/                      # Next.js 14+ Frontend (App Router, Tailwind, Framer Motion, Recharts)
│   │   ├── src/app/              # Pages, layout, and global styling
│   │   ├── package.json
│   │   └── .env.example
│   └── api/                      # FastAPI Python Backend (Market valuation engine)
│       ├── app/                  # Application code, main.py, core/config.py
│       ├── pyproject.toml
│       ├── requirements.txt
│       └── .env.example
├── packages/
│   └── shared-types/             # Shared TypeScript types for Player, Club, AMM, Rumor
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── docs/                         # Specifications & Architectural Documentation
│   ├── PRODUCT_SPEC.md           # 10-section product specification
│   ├── ARCHITECTURE.md          # System architecture, schemas & API contracts
│   ├── ECONOMIC_ENGINE.md       # AMM pricing formulas, multipliers & anti-exploit controls
│   └── ROADMAP.md               # Phased roadmap from MVP Core to Expansion
├── docker-compose.yml            # Local Redis 7-Alpine container
├── package.json                  # Root workspace definition
├── .env.example                  # Root environment variable template
└── .gitignore
```

---

## 🚀 Quickstart: Running Locally

### 1. Prerequisites
- **Node.js**: v18+ (tested with v25+)
- **npm**: v9+ (tested with v11+)
- **Python**: 3.11+
- **Docker & Docker Compose** (for running local Redis)

---

### 2. Environment Configuration

Copy the root `.env.example` into `.env` (or into each app's directory):

```powershell
# In the root workspace:
Copy-Item .env.example .env
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/api/.env.example apps/api/.env
```

Configure your credentials in `.env`:
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: From your Supabase project dashboard.
- `REDIS_URL`: Defaults to `redis://localhost:6379/0` for the local Docker container.
- `FOOTBALL_DATA_API_KEY`: Placeholder for external Premier League statistics.

---

### 3. Start Redis Cache (Docker)

Launch the Redis container in the background using Docker Compose:

```powershell
docker-compose up -d
```

To check that Redis is healthy:
```powershell
docker-compose ps
# Or test ping:
docker exec -it gafferdex-redis redis-cli ping
# Output: PONG
```

To stop Redis:
```powershell
docker-compose down
```

---

### 4. Install Dependencies & Build Shared Types

Install all npm dependencies across the monorepo:

```powershell
npm install
npm run build:types
```

---

### 5. Start the FastAPI Backend (`apps/api`)

In a terminal, set up your Python virtual environment and launch FastAPI:

```powershell
cd apps/api

# Create & activate a virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install Python requirements
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Backend API**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### 6. Start the Next.js Frontend (`apps/web`)

In another terminal, launch the Next.js development server:

```powershell
# From the root directory:
npm run dev:web

# Or from apps/web:
cd apps/web
npm run dev
```

- **Web Application**: [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Root npm Scripts Reference

| Command | Description |
| :--- | :--- |
| `npm run dev:web` | Starts Next.js development server on port 3000 |
| `npm run dev:api` | Starts FastAPI development server on port 8000 |
| `npm run build:types`| Compiles TypeScript interfaces in `packages/shared-types` |
| `npm run build:web`  | Builds production Next.js frontend |
| `npm run build`      | Compiles shared types and builds web application |
| `npm run redis:up`   | Launches local Redis container via `docker-compose up -d` |
| `npm run redis:down` | Stops local Redis container |

---

## 📖 Architectural Documentation

- [Product Specification](docs/PRODUCT_SPEC.md)
- [System Architecture & Database Design](docs/ARCHITECTURE.md)
- [Pricing Engine & Economic Guardrails](docs/ECONOMIC_ENGINE.md)
- [Implementation Roadmap & Milestones](docs/ROADMAP.md)
