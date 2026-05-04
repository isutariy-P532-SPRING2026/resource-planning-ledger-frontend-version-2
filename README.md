# Resource Planning Ledger — Frontend

**Live API:** https://resource-planning-ledger-backend-version-w90h.onrender.com/

**Frontend:** https://resource-planning-ledger-frontend-qyhq.onrender.com/

**GitHub backend:** [isutariy-P532-SPRING2026/resource-planning-ledger-backend-version-2](https://github.com/isutariy-P532-SPRING2026/resource-planning-ledger-backend-version-2)

**GitHub frontend:** [isutariy-P532-SPRING2026/resource-planning-ledger-frontend-version-2](https://github.com/isutariy-P532-SPRING2026/resource-planning-ledger-frontend-version-2)


React + Vite single-page application for the Resource Planning Ledger system.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 5 |
| Routing | React Router v6 |
| HTTP client | Axios |
| Styling | Plain CSS (custom design system via CSS variables) |
| Deploy | Render.com (static site) |

---

## Local Development

### Prerequisites
- Node.js 18+
- Backend running at `http://localhost:8080` (see [backend README](../README.md))

```bash
# From the frontend/ directory
npm install
npm run dev
# → http://localhost:5173
```

Vite proxies all `/api/*` requests to `http://localhost:8080` in dev mode — no CORS configuration needed locally.

### Production build

```bash
npm run build   # outputs to frontend/dist/
```

Serve `dist/` with any static host (Nginx, Vercel, Render, etc.) and set `VITE_API_URL` to your deployed backend URL.

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Backend base URL | `http://localhost:8080/api` (dev proxy) |

---

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Pool account balances with alert indicators, plan status summary |
| `/plans` | Plans | List all plans, create plan from scratch or from a protocol |
| `/plans/:id` | Plan Detail | Collapsible plan tree, node selection, add child nodes |
| `/plans/:id/report` | Report | Depth-first traversal report with resource allocations |
| `/actions/:id` | Action Detail | State machine transitions, resource allocation CRUD, execution diff |
| `/ledger` | Ledger | Account list with balances, drill-down to ledger entries per account |
| `/protocols` | Protocols | Protocol list, create/edit/delete protocols with steps |
| `/resource-types` | Resource Types | Resource type list, create/edit/delete, link to pool account |
| `/audit-log` | Audit Log | Chronological audit event log with transaction detail |

---

## Key Features

**Plans & Tree**
- Create plans from scratch or by instantiating a protocol template
- Sub-protocols recursively expand into nested sub-plans
- Click any plan node to select it; use "Add Node" to add actions or sub-plans as children
- Plan status is derived from its children's states

**State Machine (Actions)**
- Visual state transition buttons — only legal transitions shown per current state
- Implement → suspend → resume → complete workflow
- Resume correctly targets IN_PROGRESS (if already implemented) or PROPOSED (if not)

**Ledger**
- Pool accounts start at zero; resource type creation auto-creates a paired pool account
- Each action completion posts a double-entry transaction (withdrawal + deposit)
- Negative balance shown in red with indicator dot
- Click a pool account name in Resource Types to jump directly to its ledger entries

**Audit Log**
- `TRANSACTION_POSTED` events show both debit and credit sides with sum-to-zero verification
- Color-coded: debits in red, credits in green
- `OVER_CONSUMPTION_ALERT` events highlighted in amber

---

## Project Structure

```
frontend/
├── src/
│   ├── api.js               # All Axios API calls
│   ├── App.jsx              # Router setup
│   ├── main.jsx             # Entry point
│   ├── context/
│   │   └── ToastContext.jsx  # Global toast notifications
│   ├── components/
│   │   ├── PlanTree.jsx     # Recursive collapsible tree
│   │   ├── StatusBadge.jsx  # Colored status chip
│   │   └── Spinner.jsx      # Loading indicator
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Plans.jsx
│       ├── PlanDetail.jsx
│       ├── ReportPage.jsx
│       ├── ActionDetail.jsx
│       ├── Ledger.jsx
│       ├── LedgerView.jsx
│       ├── Protocols.jsx
│       ├── ResourceTypes.jsx
│       └── AuditLog.jsx
└── index.html
```

---

## Render.com Deployment

1. Create a **Static Site** service pointing to this repo.
2. Set **Build Command**: `npm install && npm run build`
3. Set **Publish Directory**: `dist`
4. Add environment variable `VITE_API_URL` = `https://resource-planning-ledger-backend-version-5jku.onrender.com/api`
5. Add a rewrite rule: `/* → /index.html` (status 200) for React Router client-side routing.
