# CampusPrice: AI-Powered Pricing & Combo Decision Support (PS 2.4)

> 📘 **Looking for the Full System & User Guide?**  
> Read the complete [CampusPrice System & User Manual (CAMPUSPRICE_SYSTEM_GUIDE.md)](file:///i:/Project/Ai-for-Business-Deman-Pricing/CAMPUSPRICE_SYSTEM_GUIDE.md) for a screen-by-screen walk-through, econometric model specifications, and evaluation demo script based on the PS 2.4 build plan.

CampusPrice is an intelligent pricing and combo decision-support co-pilot for cafeteria owners, balancing owner profitability with student affordability. It implements a 7-step decision loop powered by a 6-layer analytical engine, synthetic student behavioral simulations, and guardrail protections.

---

## Architecture Overview

The system is organized into three decoupled services:

```
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Vite + React JSX)                │
│  - 5 Owner Screens: Menu Health, Demand Lab, Scenarios,     │
│                     Combo Studio, Recommendations            │
│  - 1 Student Screen: Student Budget Builder (Mobile-First)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend (Node.js + Express JS + MySQL2)         │
│  - System of Record & API Gateway                           │
│  - MySQL2 Connection Pool (Promise-Based Queries)           │
│  - Transaction-Based Execution (`withTransaction`)          │
│  - Guardrails Enforcement & Pilot Test Workflow             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Internal REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 AI Service (Python + FastAPI)               │
│  - Layer 1: Demand Response (Log-Linear with Pooling)       │
│  - Layer 2: Combo Cannibalisation & Lift Engine             │
│  - Layer 3: Student Budget Tiers & Coverage Filter          │
│  - Layer 4: Multi-Objective Grid Optimizer                  │
│  - Layer 5: Confidence Gate (Apply / Pilot / Hold)          │
│  - Layer 6: Auditable LLM Explainer & Copywriter            │
│  - Synthetic Generator: 120-Day Calibrated Simulation       │
└─────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```text
Ai-for-Business-Deman-Pricing/
├── .env.example                     # Central environment configuration template
├── .gitignore                       # Multi-stack gitignore (Node, Python, MySQL, secrets)
├── README.md                        # Project documentation
├── Docs/                            # Project specifications & PDFs
│   └── PS 2.4 Pricing & Combo Decision Support Full Analysis.pdf
│
├── frontend/                        # Client application (Vite + React JS)
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── components/              # Shared UI components & charts
│       ├── pages/                   # 5 Owner screens + 1 Student screen
│       ├── services/                # Backend API client
│       ├── App.jsx                  # Main app navigation & layout
│       ├── index.css                # Custom theme & design tokens
│       └── main.jsx                 # Entry point
│
├── backend/                         # Business logic & Gateway (Node.js ES Modules)
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── controllers/             # Route controllers
│       ├── db/
│       │   └── index.js             # MySQL2 promise pool & transaction helper
│       ├── middleware/              # Auth, validation, error handler
│       ├── routes/
│       │   └── menu.js              # Menu routes with transaction templates
│       ├── services/
│       │   └── aiClient.js          # AI Service HTTP proxy
│       └── server.js                # Server entry point
│
└── ai_service/                      # Mathematical & ML Core (Python FastAPI)
    ├── .env.example
    ├── requirements.txt
    ├── app/
    │   ├── api/
    │   │   └── endpoints.py         # FastAPI endpoints (/predict, /evaluate-combo, etc.)
    │   ├── core/                    # 6-layer model algorithms
    │   ├── generator/               # 120-day synthetic student simulation
    │   ├── llm/                     # Explainer & offer copywriting (with fallback)
    │   ├── schemas/                 # Pydantic schemas
    │   └── main.py                  # FastAPI application entry
    └── data/                        # Synthetic CSV outputs (.gitignored)
```

---

## Database Architecture (MySQL2)

The backend uses `mysql2/promise` with structured transaction support:

- **Promise-based query execution**:
  ```javascript
  import { query } from './db/index.js';
  const [rows] = await query('SELECT * FROM menu_items WHERE role = ?', ['main']);
  ```
- **Transaction-based execution**:
  ```javascript
  import { withTransaction } from './db/index.js';
  await withTransaction(async (conn) => {
    await conn.execute('UPDATE menu_items SET price = ? WHERE id = ?', [newPrice, id]);
    await conn.execute('INSERT INTO override_logs (item_id, action) VALUES (?, ?)', [id, 'approved']);
  });
  ```

---

## Quick Start Guide

### 1. AI Service (Python FastAPI)
```bash
cd ai_service
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Backend Service (Node.js + Express + MySQL2)
```bash
cd backend
npm install
cp .env.example .env
# Ensure MySQL is running and database is created
npm run dev
```

### 3. Frontend Client (Vite + React)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
