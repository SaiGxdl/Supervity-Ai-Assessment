# Real-Time Exception Resolution Workbench
> **Supervity FDE Assessment — Problem Statement 9: AI Employee for Exception Resolution**

An enterprise-style, human-in-the-loop **Exception Resolution Workbench** for Accounts Payable (AP) invoice & purchase order (PO) exception processing.

---

## 🎯 1. Problem
In enterprise Accounts Payable, processing invoices against Purchase Orders (POs) leads to high-volume discrepancies (price mismatches, quantity deviations, duplicate invoices, missing PO references). Manual resolution is slow, costly, and error-prone. Conversely, fully autonomous AI resolution risks unauthorized payments when LLMs hallucinate rules or override business thresholds.

---

## 💡 2. Solution
An **AI Employee Exception Resolution Workbench** that combines **Deterministic Control** (Python business rules and policy threshold guardrails) with **AI Employee Intelligence** (LLM root cause explanations, evidence extraction, and contextual chat).

Key capabilities:
- **1-Click Auto-Resolution**: Enabled only when deterministic confidence $\ge 90\%$.
- **Human-in-the-Loop Sign-Off**: Mandatory approval flow for $70-89\%$ confidence; strictly blocked for $<70\%$.
- **Source-Grounded Evidence**: AI explanations cite exact PO vs. Invoice line-item dollar/unit facts.
- **Audit Governance**: Chronological event trail capturing every automated and human action.

---

## 🏛️ 3. Architecture

```
  ┌────────────────────────────────────────────────────────┐
  │                   React + Vite UI                      │
  │     Executive Dashboard + Contextual AI Chatbot        │
  └──────────────────────────┬─────────────────────────────┘
                             │ REST API (FastAPI)
  ┌──────────────────────────▼─────────────────────────────┐
  │                    FastAPI Backend                     │
  └──────┬───────────────────┬───────────────────┬─────────┘
         │                   │                   │
         ▼                   ▼                   ▼
  ┌──────────────┐   ┌───────────────┐   ┌──────────────┐
  │ Exception    │   │ Confidence    │   │ Data Store   │
  │ Engine       │   │ Policy Engine │   │ (JSON state) │
  │ (Python)     │   │ (Python)      │   └──────────────┘
  └──────┬───────┘   └───────┬───────┘
         │                   │
         └─────────┬─────────┘
                   ▼
           ┌───────────────┐
           │ OpenAI / LLM  │
           │ Explanation & │
           │ Recommendation│
           └───────────────┘
```

---

## ⚙️ 4. Key Decisions

### A. Separation of Control vs. Intelligence & State
- **Python = Control**: Enforces variance math, exception classification, and strict confidence policy guardrails ($\ge 90\%$ auto-resolution). The LLM does **NOT** decide auto-resolution eligibility.
- **LLM = Intelligence**: Generates structured, plain-English root cause explanations citing line-item evidence and handles contextual Q&A chat.
- **JSON = State**: The prototype uses JSON persistence for simplicity and reproducibility; the data-store layer can be replaced with SQLite or another persistent datastore in a production implementation.

### B. Deterministic Confidence Score Formula
Confidence is calculated deterministically via Python business rules:
$$\text{Confidence} = \text{Base (80\%)} + \text{Line-Item Evidence (+5\%)} + \text{Rule Predictability (+5\%)} \pm \text{Variance Factor} \pm \text{Vendor History (30\% weight)}$$
*Example (`EX-1042`): Base 80% + Line-Item Evidence 5% + Price Mismatch Predictability 5% + Vendor History blend = **94% Confidence** ($\ge 90\%$ Auto-Resolve).*

---

## 🛠️ 5. Tech Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic, OpenAI API / Fallback Engine, Uvicorn
- **Frontend**: React 18, Vite, Lucide Icons, Recharts, Vanilla CSS Glassmorphism
- **Persistence**: File-backed JSON data store with instant 1-click baseline state reset

---

## 🚀 6. How to Run

### Prerequisites
- **Python**: 3.10+
- **Node.js**: v18+ (with npm)

### 1. Launch FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python run.py
```
*Backend runs at `http://127.0.0.1:8000` (Interactive API docs at `/docs`).*

### 2. Launch React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs at `http://127.0.0.1:5173/`.*

### 3. Run Policy Engine Test Suite
```bash
python backend/tests/test_policy_engine.py
```
*Executes 7 unit tests verifying policy threshold boundaries (90%, 89%, 70%, 69%), auto-resolve guardrail blocking, variance math, and rule detection (7 passed in 0.1s).*

---

## 📽️ 7. Demo Flow

1. **KPI Dashboard Overview**: View total exceptions (10 baseline items), risk breakdown, and resolution rate.
2. **Auto-Resolution ($\ge 90\%$ Confidence)**:
   - Select `EX-1042` (Vendor: ABC Industrial Supplies, 94% Confidence).
   - Click **Explain Exception** $\rightarrow$ View structured Root Cause & Grounded Evidence facts.
   - Click **Auto-Resolve** $\rightarrow$ Status updates immediately to `AUTO RESOLVED` with audit log entry.
3. **Policy Guardrail Enforcement ($<90\%$ Confidence)**:
   - Select `EX-1043` (Vendor: Apex Logistics, 78% Confidence).
   - Click **Auto-Resolve** $\rightarrow$ Policy Enforcement Modal blocks action ($78\% < 90\%$) and logs `AUTO_RESOLVE_ATTEMPT Blocked` audit event.
   - Click **Approve & Resolve** $\rightarrow$ Enter reviewer sign-off notes to resolve manually.
4. **Contextual AI Chatbot**:
   - Ask `Why was this flagged?`, `Show evidence`, or `Can this be auto-resolved?`.
5. **Analytics & Reset**:
   - Click **Analytics** to view category volume charts. Click **Reset Demo State** to reset data back to baseline.

---

## 📋 8. Assumptions

1. **AP Synthetic Scope**: Focused on Accounts Payable core discrepancy types (`PRICE_MISMATCH`, `QUANTITY_MISMATCH`, `TAX_MISMATCH`, `DUPLICATE_INVOICE`, `MISSING_PO_REFERENCE`, `UNUSUALLY_HIGH_AMOUNT`).
2. **Single Currency**: All dollar amounts are formatted in USD ($).
3. **Single Reviewer Persona**: Assumes single-reviewer executive persona for assessment validation.

---

## ⚖️ 9. Tradeoffs

1. **Request-Driven State Updates**: Uses REST API request-driven UI updates following reviewer actions rather than complex WebSocket streaming infrastructure.
2. **JSON Data Store**: The prototype uses JSON persistence for simplicity and reproducibility; the data-store layer can be replaced with SQLite or another persistent datastore in a production implementation.
3. **Single-Tenant Prototype**: Focuses on core exception governance, decision rules, and AI interaction over full multi-tenant auth/RBAC infrastructure.
4. **Deterministic Policy Control vs. Autonomous LLM Execution**: We chose deterministic Python policy threshold enforcement over allowing the LLM to authorize auto-resolutions. This eliminates hallucinated status transitions while leveraging the LLM for explanations, evidence extraction, and recommendation intelligence.
