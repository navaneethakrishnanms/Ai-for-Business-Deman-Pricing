# CampusPrice Enterprise: System Guide & User Manual
**PS 2.4 Pricing & Combo Decision Support for Campus Cafeterias**  
*Document Version: 1.0.0 · Updated for Production Deployment*

---

## 1. Executive Summary & Concept

### What is CampusPrice?
**CampusPrice** is a full-stack, AI-powered decision support platform designed specifically for campus dining and university cafeteria operators. It solves the tension between **cafeteria financial viability** (protecting gross margins against inflation and rising ingredient costs) and **student welfare & affordability** (ensuring students on tight allowances have access to nutritious, budget-friendly meals).

### The Core Problem Solved
Traditional food service operators often resort to blunt price hikes or subtle portion reductions ("shrinkflation"), which trigger consumer backlash and reduce footfall. When launching meal combos (e.g., pairing a main dish with a drink or snack), operators frequently fall into the **"Cannibalisation Trap"**—where discounts erode profitability by offering price cuts to students who would have purchased both items anyway at standard prices.

CampusPrice replaces guesswork with:
1. **Econometric Demand Modeling with Posterior Uncertainty**: Predicts demand curves with `[p10, p90]` confidence bounds, never claiming spurious point precision.
2. **Cannibalisation-Aware Combo Valuation**: Computes incremental profit, take rates, and break-even thresholds before launching meal bundles.
3. **The Profit-versus-Affordability Pareto Frontier**: Visualizes the trade-off curve between cafeteria net profit and the percentage of campus students served within target meal budgets.
4. **Confidence-Gated Policy Recommendations**: Tags recommendations as **Apply** (≥80% win probability), **Pilot** (7-day randomized A/B price test), or **Hold** (risk of loss).
5. **Zero Data Leakage Student Experience**: A phone-first meal finder that helps students discover nutritious meals within their specific daily budget while strictly hiding unit costs, margins, and proprietary algorithms.

---

## 2. Research & Econometric Foundation (From PDF Specifications)

CampusPrice is built upon peer-reviewed behavioral economics and pricing literature:
* **Fairness Constraints on Profit Seeking** (*Kahneman, Knetsch & Thaler, 1986*): Customers accept price rises driven by documented wholesale cost inflation, but perceive demand-driven surge pricing as price gouging. CampusPrice enforces a strict **Fairness Mode** that disables surge pricing on high-stress exam days and campus events.
* **Shrinkflation Aversion** (*Evangelidis, Marketing Science, 2024*): Downsizing portion sizes while keeping price constant is judged significantly less fair by consumers than an equivalent transparent price rise. CampusPrice introduces **Transparent Portion Ladders** (clearly labeled grams and ₹ per 100g) rather than silent shrinking.
* **Bundle-Size Pricing** (*Chu, Leslie & Sorensen*): Mixed bundling approximations capture consumer surplus efficiently with simple, auditable rules rather than opaque dynamic pricing.
* **Kaggle Retail Price Optimization Insights**: Empirical price elasticity across real-world retail datasets clusters around **−2.4** (95% interval: −3.2 to −1.6). In our synthetic campus calibration, price elasticity is modeled with partial pooling toward category averages to prevent noisy overfitting.

---

## 3. Architecture & Data Flow

The platform comprises 3 decoupled, asynchronous tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT FRONTENDS                              │
│                                                                        │
│   Owner Console (Desktop / Tablet)      Student View (Mobile Frame)    │
│   - Menu Health & Bento Dashboard       - Student Budget Builder       │
│   - Demand Lab & Elasticity Simulator   - Filter by Meal Budget        │
│   - Combo Studio & Cannibalisation      - Complete Nutritional Meals   │
│   - Scenario Compare & Pareto Frontier  - Zero Cost / Margin Leakage   │
│   - Recommendations & Audit Log                                        │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │ Owner Bearer Token              │ Unauthenticated / Read-only
                   ▼                                 ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS EXPRESS BACKEND                         │
│                           (Port 5000)                                  │
│  - API Gateway & Route Orchestrator                                    │
│  - Security: Helmet, Express-Rate-Limit, JWT Verification              │
│  - Student Data Sanitizer (strips cost, margin_abs, margin_pct, flags) │
│  - Transactional MySQL2 Client (withTransaction, SSL Certs)            │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌────────────────────────────────────┐ ┌─────────────────────────────────┐
│         TIDB CLOUD MYSQL DB        │ │       FASTAPI AI SERVICE        │
│  - menu_items (prices, costs, tiers)│ │          (Port 8001)            │
│  - combos (pairings, active flags) │ │ - Layer 1: Log-Linear Demand    │
│  - guardrails (caps, floors, mode) │ │ - Layer 2: Combo Cannibalisation│
│  - override_logs (audit decisions) │ │ - Layer 3: Student Affordability│
│  - sales_log (synthetic history)   │ │ - Layer 4: Multi-Objective Opt. │
│                                    │ │ - Layer 5: Confidence Gate      │
│                                    │ │ - Layer 6: Groq LLM Assistant   │
└────────────────────────────────────┘ └─────────────────────────────────┘
```

### Confidentiality & Partition Security
| Data Entity | Server Database | Owner Console | Student Client |
| :--- | :---: | :---: | :---: |
| Item Name, Price, Portion (g) | Yes | Yes | Yes |
| Unit Cost, Unit Margin (₹), Margin % | Yes | Yes | **NO (Strips via Sanitizer)** |
| Guardrails (Margin Floor, Caps) | Yes | Yes (Editable) | **NO** |
| Synthetic Model Weights & Internal Draws | AI Service | **NO (Only [p10, p90])** | **NO** |
| LLM Provider Key (Groq) | AI Server Env | **NEVER** | **NEVER** |
| Owner Authorization Token | Issued at Login | Held in Header | **Not Applicable** |

---

## 4. The 7-Step Owner Decision Loop

As outlined in the build specification, the cafeteria owner interacts with CampusPrice in a 7-step continuous optimization loop:

```
  1. See Menu Health ────► 2. Change an Input ────► 3. Predict Demand
         ▲                                                │
         │                                                ▼
  7. Learn from Log ◄──── 6. Decide (Approve) ◄──── 4. Compare Scenarios
                                ▲                         │
                                │                         ▼
                                └─────────────── 5. Get Recommendation
```

1. **See Menu Health**: Review outlet profitability, daily revenue, and diagnostic item flags (`loss_maker`, `star`, `poor_seller`).
2. **Change an Input**: Pick an item or combo to test new price points, portion grammages, or promotional discounts.
3. **Predict Demand**: Simulate consumer elasticity across operating contexts (Regular Day, Exam Day, Weekend, Campus Event).
4. **Compare Scenarios**: Benchmark policy candidates side-by-side against Today’s menu baseline.
5. **Get Recommendation**: Run the multi-objective optimizer under custom margin floors and student reach targets.
6. **Decide (Approve, Edit, or Reject)**: Accept high-confidence proposals, launch 7-day randomized pilot price tests, or hold risky adjustments.
7. **Learn from the Log**: System records human override notes and decisions to refine posterior beliefs in the next cycle.

---

## 5. Screen-by-Screen User Guide

### Screen 1: Sales Dashboard & Menu Health (`GET /api/items`)
* **Access**: Click **Menu Health** in the sidebar navigation.
* **View Modes**:
  1. **Bento Overview**: A modern glassmorphic dashboard showcasing:
     - **Cafeteria Ambience & Summary**: Total active items, counts of detected loss-makers and stars.
     - **Total Daily Revenue & Weekly Run-Rate**: Real-time sales aggregation derived directly from database items.
     - **Profitability Card**: Net cafeteria profit, gross margin percentage, and item margin breakdown.
     - **Student Affordability Progress Meter**: Visual progress toward the owner's target student coverage (e.g., 75% target reach).
     - **Menu Highlights Carousel**: Spotlight on Top Sellers, Attention/Loss-Maker Items, and Highest Margin dishes.
     - **Eva Decision Engine**: Contextual recommendations for underpriced stars and loss-makers.
     - **Recent Transactions Feed**: Live POS order feed.
  2. **Inventory Table**: Complete itemized catalog of all dishes displaying Unit Price, Unit Cost, Absolute Margin (₹), Margin %, Average Daily Volume, Portion Tiers, and Diagnostic Badges.
* **Guardrails Modal**: Click **Owner Guardrails** (top right) to configure:
  - Minimum Margin Floor % (default 20%)
  - Maximum Weekly Price Change % (default 15%)
  - Student Meal Price Cap (default ₹100)
  - Student Coverage Target (default 75%)
  - Combo Discount Cap (default 20%)
  - Fairness Mode (no surge pricing on exam/event days)

---

### Screen 2: Demand Lab & Elasticity Simulator (`POST /api/predict`)
* **Access**: Click **Demand Lab** in the sidebar.
* **Purpose**: Test what happens to demand, revenue, and gross profit when you change a single dish's price or portion.
* **How to Use**:
  1. **Select an Item**: Choose from the dropdown (e.g., *Chicken Biryani*, *Masala Dosa*, or *Paneer Roll*).
  2. **Adjust Sliders**:
     - **Proposed Unit Price**: Move the slider above or below the baseline price.
     - **Portion Size (g)**: Scale portion size up or down; the tool calculates the effective cost delta.
     - **Offer Discount (%)**: Simulate promotional discount rates.
  3. **Select Operating Context**:
     - *Regular Day* (~700 footfall)
     - *Exam Day* (~520 footfall, high stress, fairness rules apply)
     - *Weekend* (~230 footfall, casual dining)
     - *Campus Event* (~860 footfall, peak volume)
  4. **Interpret Output**:
     - **Range Badges**: View predicted daily units, revenue, and profit with **90% Bayesian confidence bounds `[p10, p90]`**.
     - **Demand & Profit Response Curve**: Interactive Chart.js graph highlighting the peak-profit price point and the current price.
     - **Price Sensitivity Table**: Step-by-step matrix evaluating demand and profit across the allowed price band.
     - **Guardrail Alerts**: Flashes warnings if the price breaches margin floors, price caps, or maximum weekly variance limits.

---

### Screen 3: Combo Studio & Cannibalisation Guard (`POST /api/combos/evaluate`)
* **Access**: Click **Combo Studio** in the sidebar.
* **Purpose**: Design meal pairings (Main Course + Beverage/Snack) without succumbing to the Cannibalisation Trap.
* **How to Use**:
  1. **Select Pairings**: Choose a Main Course (e.g., *Veg Full Meals* or *Masala Dosa*) and an Add-On (e.g., *Masala Chai* or *Cold Coffee*).
  2. **Set Combo Discount**: Slide the discount percentage (0% to 20%).
  3. **Review Cannibalisation Metrics**:
     - **Incremental Profit**: Expected extra ₹/day earned compared to selling both items standalone.
     - **Predicted Take Rate**: Percentage of main buyers expected to select the bundle.
     - **Cannibalised Share**: Percentage of bundle buyers who would have bought both items anyway at full price. If this is high (>55%), the tool highlights a **Cannibalisation Trap** warning.
     - **Break-Even Take Rate**: The minimum adoption rate required so the cafeteria does not lose net revenue.
     - **Cross-Sell Lift Drivers**: Volume lift in snack purchases and main footfall spillover.
  4. **High-Affinity Suggestions**: Drawer at the bottom displays AI-evaluated combinations with pre-calculated optimal discount rates.

---

### Screen 4: Scenario Compare & Trade-Off Analysis (`POST /api/scenarios/compare`)
* **Access**: Click **Scenario Compare** in the sidebar.
* **Purpose**: Benchmark candidate whole-menu pricing policies side-by-side against Today's menu baseline.
* **How to Use**:
  1. **Review Pre-configured Scenarios**:
     - **Baseline (Today)**: Current cafeteria operating performance.
     - **Affordability & Volume (Student First)**: Lower prices on high-volume staples to maximize student coverage.
     - **Margin Maximization (AI Recommended)**: Selective price adjustments on underpriced stars to capture margin.
  2. **Create Custom Scenario**:
     - Click **New Test Scenario**.
     - Enter a scenario name and configure custom price and portion overrides for individual items.
     - Click **Run Comparative Simulation**.
  3. **Compare Results**:
     - **Comparative Bar Chart**: Visual revenue and profit bars across all scenarios.
     - **Downside Risk**: Probability that the scenario results in lower profit than Today (`risk_prob_below_today`).
     - **Coverage Metric**: Percentage of students across Tight, Mid, and Flexible budget tiers who can afford complete meals.

---

### Screen 5: Policy Recommendations & Pilot Gate (`POST /api/recommend`)
* **Access**: Click **Recommendations** in the sidebar.
* **Purpose**: Multi-objective Pareto optimization that balances cafeteria profitability against student affordability.
* **How to Use**:
  1. **Pareto Frontier Curve**:
     - Interactive chart displaying achievable cafeteria profit across student coverage targets (60% to 90%).
     - Highlights the current operating point and shows the "price of affordability" (the marginal profit trade-off for higher student reach).
  2. **Confidence-Gated Proposal Cards**:
     - **Apply** (Green): High statistical confidence (≥80% win probability); safe for immediate implementation.
     - **Pilot** (Amber): Favorable expected gain but higher variance; includes a **7-Day A/B Pilot Test Plan** with control and treatment arms to gather empirical data without risking cafeteria margins.
     - **Hold** (Gray/Red): Unfavorable risk-reward; rejected by guardrails.
  3. **Owner Decision Actions**:
     - Click **Approve (Check)**: Instantly marks the recommendation approved.
     - Click **Edit (Pencil)**: Customize the proposed price or discount before approving.
     - Click **Reject (Cross)**: Discards the proposal with an optional note for future AI retraining.
  4. **Audit Overrides Log (`GET /api/overrides`)**:
     - Click **Audit Overrides Log** to view the persistent ledger of all approved, edited, and rejected recommendations.

---

### Screen 6: Student Budget Builder (`GET /api/student/offers?budget=X`)
* **Access**: Click **Student View** (or the phone icon in the top header).
* **Target Audience**: Students on mobile phones looking for meals that fit their daily allowance.
* **Features**:
  1. **Phone-First Frame**: Renders an authentic mobile app viewport with quick-switch toggles.
  2. **Meal Budget Slider**: Drag between ₹30 and ₹200 (or click quick presets: ₹50, ₹75, ₹100, ₹130).
  3. **Curated Combos**: Complete meals pairing mains and beverages that sum up to less than or equal to the student's selected budget.
  4. **Single Dishes & Portion Tiers**: Shows available dishes, grams, and portion sizes (e.g., Half plate vs. Regular plate) so budget-constrained students are not excluded.
  5. **Privacy Guarantee**: All backend unit costs, operator margins, and internal flags are scrubbed by the backend sanitizer before leaving the server.

---

### Screen 7: Eva Natural Language AI Assistant (`POST /api/assistant/query`)
* **Access**: Click the **Eva Assistant** button in the header or the floating chat bubble.
* **Purpose**: Natural-language query interface powered by Llama 3 on Groq (with graceful fallback to algorithmic responses if offline).
* **Sample Questions to Ask**:
  - *"Why is Chicken Biryani flagged as a loss-maker?"*
  - *"What happens if I increase Masala Dosa by ₹4?"*
  - *"Which combo gives the highest profit without cannibalisation?"*
  - *"Explain the 7-day pilot test plan for Paneer Roll."*
* **Core Design Rule**: The LLM *explains* and *interprets* verified mathematical outputs from the Python engine; it never hallucinates pricing numbers independently.

---

## 6. How to Run & Verify the System

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+) & pip
- Active Internet connection for TiDB Cloud MySQL SSL database

### Starting the Services

#### 1. Backend (Node.js Express)
```powershell
cd I:\Project\Ai-for-Business-Deman-Pricing\backend
npm install
npm run dev
# Server runs at http://localhost:5000
# Database connected via SSL to TiDB Cloud MySQL
```

#### 2. AI Service (Python FastAPI)
```powershell
cd I:\Project\Ai-for-Business-Deman-Pricing\ai_service
# Run using the root app module:
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
# Service active at http://localhost:8001
# Docs available at http://localhost:8001/docs
```

#### 3. Frontend (Vite + React)
```powershell
cd I:\Project\Ai-for-Business-Deman-Pricing\frontend
npm install
npm run dev
# Frontend live at http://localhost:5173
```

---

## 7. Recommended 5-Minute Evaluation / Demo Script

Follow this sequence to demonstrate the platform to evaluators or stakeholders:

1. **Minute 1: The Diagnostics (Menu Health)**
   - Open `http://localhost:5173` on Menu Health.
   - Show the **Bento Overview** displaying real daily revenue (~₹31k/day), profit, and gross margin.
   - Switch to **Inventory Table**: point out the planted cases:
     - *Chicken Biryani*: Selling at ₹90 with a unit cost of ₹96 (red `loss_maker` tag).
     - *Masala Dosa*: High-volume star (180 units/day) with high margin.
   - Open **Owner Guardrails** to demonstrate owner-governed constraints (20% margin floor, 75% student coverage target).

2. **Minute 2: The Simulation (Demand Lab)**
   - Click **Demand Lab**.
   - Select *Chicken Biryani*.
   - Adjust the proposed price slider from ₹90 to ₹102.
   - Note the live recomputation: volume drops from 70 to ~55, but net profit shifts from negative (−₹420/day) to positive (+₹330/day).
   - Show the **`[p10, p90]` Bayesian confidence bounds** and the price response curve.
   - Switch operating context to **Exam Day** to show fairness constraints in action.

3. **Minute 3: The Cannibalisation Guard (Combo Studio)**
   - Click **Combo Studio**.
   - Pair *Masala Dosa* with *Cold Coffee*.
   - Show the **Cannibalisation Trap Warning**: high cannibalised share (>55%) indicates students who normally buy both are simply receiving an unrecouped discount.
   - Select the recommended pairing from the suggestions drawer: *Veg Full Meals + Masala Chai*.
   - Note positive incremental profit and achievable break-even take rate.

4. **Minute 4: The Trade-off & Decision (Scenario Compare & Recommendations)**
   - Click **Scenario Compare**: benchmark Today against the Student-First and Margin-Maximization scenarios.
   - Click **Recommendations**: examine the **Pareto Frontier Curve** (Profit vs. Student Reach).
   - Review a proposal with a **Pilot** tag: open the **7-Day A/B Test Plan** showing structured randomized trial arms.
   - Click **Audit Overrides Log** to prove that owner decisions feed into persistent system memory.

5. **Minute 5: The Student Experience (Student Meal Finder)**
   - Click **Student View** in the top navigation.
   - Show the mobile-first viewport.
   - Move the budget slider to ₹75.
   - Demonstrate curated combos and visible portion tiers (grams) that fit within budget with zero internal cost leakage.
   - Open **Eva Assistant** to ask a natural-language query and show AI co-pilot explanations.

---

## 8. Summary of Planted Calibration Cases

| Case Name | Item / Combo | Baseline Behavior | Decision Support Resolution |
| :--- | :--- | :--- | :--- |
| **Popular Loss-Maker** | Chicken Biryani (₹90, Cost ₹96) | High sales (70/day), loses ₹420/day | Reposition price to ₹100–102 or introduce a 220g half-portion tier at ₹55. |
| **Mild Loss-Maker** | Paneer Roll (₹55, Cost ₹57) | Loses ₹2 per unit sold | Recommend 7-day pilot test arm to adjust price to ₹62. |
| **Underpriced Star** | Masala Dosa (₹40, Cost ₹24) | High sales (180/day), 40% margin | Moderate price adjustment (+₹4) unlocks substantial cafeteria profit while remaining well under student cap. |
| **Poor Sellers** | Salad Bowl (₹65) & Fresh Juice (₹45) | Low sales (~10/day each) | Bundle into healthy value combos or resize portion to clear inventory. |
| **Winning Combo** | Veg Meals + Masala Chai | Low cannibalisation, high margin | Flagged as **Apply** with positive incremental profit. |
| **Cannibalisation Trap** | Masala Dosa + Cold Coffee | High natural co-purchase | Flagged with cannibalisation alert; break-even take rate > 60%. |
