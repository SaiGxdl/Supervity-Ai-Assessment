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
           ┌─────────────────────────────┐
           │ Google Gemini LLM           │
           │ (google-genai SDK)          │
           │ + Grounded Fallback Engine  │
           └─────────────────────────────┘
```

---

## ⚙️ 4. Key Decisions

### A. Separation of Control vs. Intelligence & State
- **Python = Control**: Enforces variance math, exception classification, and strict confidence policy guardrails ($\ge 90\%$ auto-resolution). The LLM does **NOT** decide auto-resolution eligibility.
- **LLM Layer — Google Gemini (`google-genai` SDK)**: Used for grounded exception explanations, suggested resolutions, and contextual reviewer chat.
  - **Dual-Mode Architecture**: Uses **Google Gemini 3.6-flash** when `GEMINI_API_KEY` is present. If no key is configured or if an API timeout occurs, it seamlessly activates a **Deterministic Grounded Fallback Engine** that synthesizes structured root causes and recommended actions directly from verified line-item facts with zero hallucinations and 100% offline test reliability.
- **State Store — JSON-based persistent mock datastore**: Lightweight, file-backed datastore enabling instant 1-click baseline state resets for reproducible assessment validation.

### B. Deterministic Confidence Score Formula
Confidence is calculated deterministically via Python business rules:
$$\text{Confidence} = \text{Base (80\%)} + \text{Line-Item Evidence (+5\%)} + \text{Rule Predictability (+5\%)} \pm \text{Variance Factor} \pm \text{Vendor History (30\% weight)}$$
*Example (`EX-1042`): Base 80% + Line-Item Evidence 5% + Price Mismatch Predictability 5% + Vendor History blend = **94% Confidence** ($\ge 90\%$ Auto-Resolve).*

---

## 🛠️ 5. Tech Stack

- **Backend**: Python 3.10+, FastAPI, Pydantic, Google Gemini API (`google-genai`) / Grounded Fallback Engine, Uvicorn
- **Frontend**: React 18, Vite, Lucide Icons, Recharts, Vanilla CSS Glassmorphism
- **State Store**: JSON-based persistent mock datastore with instant 1-click baseline state reset

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
   - Click **Explain Exception** $\rightarrow$ View structured Root Cause & Grounded Evidence facts generated by Gemini.
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

1. **Synthetic / Mock Data**: Transaction data is synthetic/mock data modeled on real-world Accounts Payable discrepancy patterns (`PRICE_MISMATCH`, `QUANTITY_MISMATCH`, `TAX_MISMATCH`, `DUPLICATE_INVOICE`, `MISSING_PO_REFERENCE`, `UNUSUALLY_HIGH_AMOUNT`).
2. **Deterministic Confidence Rules**: Exception confidence scores are derived from deterministic Python business rules, not arbitrary LLM guessing.
3. **Control vs. Intelligence Separation**: AI is responsible for plain-English explanation, evidence extraction, and recommendation, **not** final policy enforcement.
4. **Strict Auto-Resolution Policy**: Auto-resolution is permitted **only** when the confidence/policy threshold is strictly satisfied ($\ge 90\%$).
5. **Mandatory Human Sign-off**: Human review is mandatory for lower-confidence cases ($70-89\%$ requires 1-click human sign-off; $<70\%$ requires full manual audit).
6. **JSON Persistence Layer**: JSON is used as the persistent mock datastore for this assessment, providing an intentionally lightweight, reproducible setup with instant baseline resets.
7. **Simulated External Integrations**: External ERP/payment gateway execution systems are simulated via mock endpoints rather than live third-party connectors.

---

## ⚖️ 9. Tradeoffs

1. **Request-Driven State Updates**: Uses REST API request-driven UI updates following reviewer actions rather than complex WebSocket streaming infrastructure.
2. **JSON Persistent Mock Datastore**: The prototype uses JSON persistence for simplicity and instant reproducibility rather than requiring external database servers.
3. **Single-Tenant Prototype**: Focuses on core exception governance, decision rules, and AI interaction over full multi-tenant auth/RBAC infrastructure.
4. **Deterministic Policy Control vs. Autonomous LLM Execution**: We deliberately kept authorization deterministic rather than allowing the LLM to decide whether an exception could be auto-resolved. This sacrifices some flexibility in favor of predictable and auditable business control.
