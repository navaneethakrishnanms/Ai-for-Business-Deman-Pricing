# CampusPrice: AI-Powered Pricing & Combo Decision Support (PS 2.4)

CampusPrice is an intelligent pricing and combo decision-support co-pilot for cafeteria owners, balancing owner profitability with student affordability. It implements a 7-step decision loop powered by a 6-layer analytical engine, synthetic student behavioral simulations, and guardrail protections.

---

## Architecture Overview

The system is organized into three decoupled services:

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend (Vite + React)               │
│  - 5 Owner Screens: Menu Health, Demand Lab, Scenarios,     │
│                     Combo Studio, Recommendations            │
│  - 1 Student Screen: Student Budget Builder (Mobile-First)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST (JSON)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Express)              │
│  - System of Record & API Gateway                           │
│  - SQLite Database (Menu Items, Scenarios, Override Logs)   │
│  - Guardrails Enforcement & Pilot Test Workflow             │
└──────────────────────────────┬──────────────────────────────┘
                               │ Internal REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI Service (Python + FastAPI)             │
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
├── .gitignore                       # Multi-stack gitignore (Node, Python, SQLite, secrets)
├── README.md                        # Project documentation
├── Docs/                            # Project specifications & PDFs
│   └── PS 2.4 Pricing & Combo Decision Support Full Analysis.pdf
│
├── frontend/                        # Client application (Vite + React + TS)
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── components/              # Shared UI components & charts
│   │   ├── pages/                   # 5 Owner screens + 1 Student screen
│   │   ├── services/                # Backend API client
│   │   └── types/                   # Frontend TypeScript interfaces
│
├── backend/                         # Business logic & Gateway (Node.js + TS)
│   ├── .env.example
│   ├── package.json
│   ├── src/
│   │   ├── controllers/             # Route handlers
│   │   ├── routes/                  # Express API routers
│   │   ├── services/                # Business logic & AI proxy
│   │   ├── models/                  # SQLite schema & DB client
│   │   └── server.ts                # Server entry point
│   └── data/                        # Local SQLite databases (.gitignored)
│
└── ai_service/                      # Mathematical & ML Core (Python FastAPI)
    ├── .env.example
    ├── requirements.txt
    ├── app/
    │   ├── api/                     # FastAPI route endpoints
    │   ├── core/                    # 6-layer model algorithms
    │   ├── generator/               # 120-day synthetic student simulation
    │   ├── llm/                     # Explainer & offer copywriting (with fallback)
    │   ├── schemas/                 # Pydantic schemas
    │   └── main.py                  # FastAPI application entry
    └── data/                        # Synthetic CSV outputs (.gitignored)
```

---

## Seven Core Screen Features

1. **Menu Health**: Per-item price, cost, unit margins (₹ and %), sales velocity, and automated classification flags (*loss-maker, poor seller, underpriced star*).
2. **Demand Lab**: Interactive real-time sliders for price, portion, discount, and day type (regular, exam, weekend, event). Shows response curves with uncertainty bands and margin floor alerts.
3. **Scenario Compare**: Compare up to 4 scenarios side-by-side (*Today, My Scenario, AI Plan, Student-First*) on units, revenue, profit, student budget coverage, and risk.
4. **Combo Studio**: Interactive bundle designer calculating take rates, add-on lift, cannibalisation risk, and break-even take rates.
5. **Recommendations (Apply / Pilot / Hold)**:
   - **Apply (>=80% confidence)**: Direct price or combo update.
   - **Pilot (<80% confidence)**: Generates a 1-week randomized A/B test plan.
   - **Hold**: Retains baseline when uncertainty is high or guardrails are breached.
6. **Student Budget Builder (Mobile-First)**: Allows students to slide their ₹ budget to view high-value, nutrition-dense, profit-safe meal deals with "save ₹X" badges and ₹/gram transparency.
7. **Override & Audit Log**: Records owner approvals, overrides, and adjustments to refine future model iterations.

---

## Quick Start Guide

### 1. AI Service (Python FastAPI)
```bash
cd ai_service
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

### 2. Backend Service (Node.js)
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend Client (Vite + React)
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
