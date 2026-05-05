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
| `/plans/:id` | Plan Detail | Depth-slider tree, node metrics panel, add child nodes, plan metrics modal |
| `/plans/:id/report` | Report | Depth-first traversal report with status filter and resource allocations |
| `/actions/:id` | Action Detail | Full approval workflow transitions, resource allocation CRUD, execution diff |
| `/ledger` | Ledger | Consumable/Asset toggle, account balances, drill-down to ledger entries |
| `/protocols` | Protocols | Protocol list, create/edit/delete protocols with steps |
| `/resource-types` | Resource Types | Resource type list, create/edit/delete, link to pool account |
| `/audit-log` | Audit Log | Chronological audit event log with transaction detail |

---

## Key Features

**Plans & Tree**

- Create plans from scratch or by instantiating a protocol template
- Sub-protocols recursively expand into nested sub-plans
- Depth slider (1–10) prunes the displayed tree client-side with no extra API calls — full tree is cached in memory on first load
- Click any plan node to select it; use "Add Node" to add actions or sub-plans as children
- Plan status is derived from its children's states

**Plan Metrics**

- `📊 Metrics` button on Plan Detail opens a modal with completion ratio, resource cost, and risk score
- Node Metrics panel on the right: select any PLAN node to see its subtree metrics live
- Metrics computed via three Visitor pattern classes (CompletionRatioVisitor, ResourceCostVisitor, RiskScoreVisitor) traversed by a DepthFirstPlanIterator
- Risk levels: LOW / MEDIUM / HIGH based on abandoned, suspended, and unstarted action counts

**State Machine (Actions)**

- Full approval workflow: PROPOSED → IN_PROGRESS → PENDING_APPROVAL → COMPLETED / REJECTED → REOPENED
- Visual state transition buttons — only legal transitions shown per current state
- `Submit for Approval`, `Approve`, `Reject`, `Reopen` buttons wired to backend approval endpoints
- Suspend modal requires a reason; Abandon requires confirmation
- Status badges for all states including PENDING_APPROVAL and REOPENED

**Report Page**

- Status filter dropdown: show all actions or filter by a specific status (PROPOSED, IN_PROGRESS, SUSPENDED, COMPLETED, ABANDONED, PENDING_APPROVAL, REOPENED)
- Depth-first traversal report with resource allocation summaries per action

**Ledger**

- Three-option resource kind toggle: Show all / Consumable only / Asset only
- Pool and Usage accounts grouped separately
- Sortable columns (Booked At, Charged At, Amount)
- Negative balances shown in red with indicator dot

**Audit Log**

- `TRANSACTION_POSTED` events show both debit and credit sides with sum-to-zero verification
- Color-coded: debits in red, credits in green
- `OVER_CONSUMPTION_ALERT` events highlighted in amber

---

## Project Structure

```
frontend/
├── src/
│   ├── api.js               # All Axios API calls (centralized base URL)
│   ├── App.jsx              # Router setup
│   ├── main.jsx             # Entry point
│   ├── context/
│   │   └── ToastContext.jsx  # Global toast notifications
│   ├── components/
│   │   ├── PlanTree.jsx     # Recursive collapsible tree with pruned-node indicator
│   │   ├── StatusBadge.jsx  # Colored status chip (all ActionStatus values)
│   │   ├── ConfirmModal.jsx # Generic confirmation dialog
│   │   └── Spinner.jsx      # Loading indicator
│   └── pages/
│       ├── Dashboard.jsx
│       ├── Plans.jsx
│       ├── PlanDetail.jsx   # Depth slider, node metrics, plan metrics modal
│       ├── ReportPage.jsx   # Status filter dropdown
│       ├── ActionDetail.jsx # Full approval workflow, suspend/abandon modals
│       ├── Ledger.jsx       # Consumable/Asset toggle, sortable entries
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
4. Add environment variable `VITE_API_URL` = `https://resource-planning-ledger-backend-version-w90h.onrender.com/api`
5. Add a rewrite rule: `/* → /index.html` (status 200) for React Router client-side routing.
