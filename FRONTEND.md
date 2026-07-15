# Accounting AI OS — Frontend

The **Accounting** industry frontend for the Industry AI OS platform. One of several
per-industry FEs (Construction, Legal, …) that all talk to the **same backend**; only the
industry theming, copy, and dummy content differ. Accounts created here sign up into the
`accounting` industry.

> Sibling FEs follow this exact structure — use this file as the template (swap the
> industry name, the `login_source` value, and the "wired vs dummy" list).

## Stack
- **TanStack Start** (React 19 + TanStack Router, file-based routes) + **Vite**
- **TypeScript**, **Tailwind CSS** + shadcn/radix UI, **lucide-react** icons
- **TanStack Query** for all server state
- Talks to the **gateway only** — never a service or Keycloak directly

## Structure
```
src/
  routes/            file-based routes (TanStack Router)
    index.tsx        marketing landing page + auth modal (Log in / Sign up)
    app.tsx          authenticated shell (sidebar + header), guards on token
    app.index.tsx    dashboard
    app.<name>.tsx   workspace pages (documents, workflows, approvals, connectors,
                     assistant, analytics, knowledge, admin, settings, …)
  api/
    client.ts        typed gateway client — ONE function per backend endpoint, auth,
                     token storage. Only file that knows URLs. `DUMMY_AUTH` flag here.
    index.ts         public API surface — import hooks/types from here, not from query/
    query/*.ts       TanStack Query read hooks (useDocuments, useWorkflows, …)
    mutation/*.ts    write hooks (useDecideWorkflow, useUploadDocument, …)
  components/
    layout/          AppSidebar, AppHeader, nav.ts
    common/          DataTable, StatCard, StatusBadge, states.tsx (Loading/Empty/Error)
    ui/              shadcn primitives
  lib/               session, theme, catalog/industries (static landing content), utils
```

## Backend contract (the important part)
- **Base URL:** `VITE_API_URL` (see `.env` / `.env.example`; defaults to
  `http://localhost:8000`, the gateway). The FE calls the **gateway only**.
- **Auth** (`DUMMY_AUTH = false` in `client.ts` → real backend):
  - Login → `POST /auth/token` `{ username, password }` → stores the Keycloak access
    token; sent as `Authorization: Bearer` on every call.
  - Signup → `POST /auth/register` with **`login_source: "accounting"`** (hard-coded — this
    is the accounting FE), then auto-logs in. Accounts join the shared `demo` tenant.
    (Flip `DUMMY_AUTH = true` to demo the UI with no backend, localStorage-only.)
- **AI Assistant** (`app.assistant`): streams from `POST /api/orchestrator/chat/stream`
  and sends **`workspace: "accounting"`** so the backend assistant is workspace-aware
  (industry-scoped answers, intent detection, Mode-2 workspace reminder for unrelated
  questions). On failure the backend sends an SSE `error` frame; the page surfaces it (and
  an empty stream / thrown `ApiError`) as a visible error instead of a fake reply — it needs
  a valid LLM key configured on the backend to actually answer.
- **Per-industry workspace config** (optional, backend-driven): `GET /industries` and
  `GET /api/identity/workspace/config` expose the industry's nav/theme/terminology. This
  FE is already accounting-specific, so it doesn't depend on them, but they're available.

## Pages: real backend data vs. dummy
**Wired to the real backend:**

| Page | Endpoint(s) / hook |
|---|---|
| AI Assistant (`app.assistant`) | `chatStream` → `/api/orchestrator/chat/stream` (workspace-aware; surfaces backend errors) |
| Dashboard (`app.index`) | system status → `useSystemHealth`; recent docs → `useDocuments`; activity → `useAuditEvents` |
| Documents (`app.documents`) | `useDocuments` (+ upload) |
| Workflows (`app.workflows`) | runs `useWorkflows`; templates + **My workflows** `useWorkflowDefinitions`; **visual builder** at `/app/workflows/builder` (see below) |
| Approvals (`app.approvals`) | pending `useWorkflows` + approve/reject via `useDecideWorkflow` |
| Connectors (`app.connectors`) | `useConnectors`; **Connect** opens Nango's Connect UI (`@nangohq/frontend`) via `getConnectSession` → `configureConnector` (sandbox mode just enables) |
| Admin (`app.admin`) | `useUsers`, `useAuditEvents` |
| Settings (`app.settings`) | `useTenant`, `useSession` |

**Intentionally still dummy** (no backend source yet — would be faking data):
Analytics KPIs/charts, Knowledge help-articles, Document-Intelligence (OCR/extraction),
and the dashboard's month-end-close checklist. Wire these once the backend exposes
invoice/ledger/OCR data.

## Visual workflow builder (`/app/workflows/builder`)
An n8n-style canvas (**`@xyflow/react`**) for building your own flows — no code, no deploy.
- **Palette:** the tenant's *entitled* connectors (`listConnectorCatalog` → `GET /connectors?all=true`)
  + step types (AI action, Approval, Branch, Notify, Transform). Drag or click to add nodes.
- **Config panel:** per-step fields (connector + endpoint, inline AI prompt, approver, branch
  condition, …). Name the flow, then **Save**.
- **Serialize** (`components/workflow/builder/serialize.ts`): the canvas is flattened to the
  engine's **ordered step list with `when` guards** (the engine runs steps in order, not a free
  DAG) — DFS from the trigger, branch guards derived and stopped at merge points, friendly
  config mapped to the exact engine config per step type. Saved via `createWorkflowDefinition`
  → `POST /api/workflows/packs/definitions` (stored under the reserved `custom` pack, `source: "user"`).
- **My workflows:** user flows (`source === "user"`) list with **Run** (`startWorkflow`, pack
  `custom`) / **Edit** (`/builder?key=…`, loads the full definition via `getWorkflowDefinition`) /
  **Delete**. The AI assistant can also start a saved flow by name ("run <name>").
- Requires `@xyflow/react` installed (`npm install`) and the backend from ADR-0019 (migration
  `0004` applied + the tenant granted connector entitlements).

## Run
The backend must be running (gateway on `:8000`), and for the assistant to answer, a valid
LLM key must be set in the backend `.env` (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`). Then:
```bash
cp .env.example .env          # Windows: copy .env.example .env  (a .env is already present)
npm install
npm run dev                   # http://localhost:8080
```
Sign up (e.g. `acc1@acme.com` / `Passw0rd!`) → you land in the Accounting workspace with
real backend data on the wired pages. If the backend has no LLM key, the assistant shows a
clear "temporarily unavailable" error (not a fake answer).

## Conventions
- Add a backend call: add one typed function in `client.ts`, wrap it in a hook under
  `api/query` or `api/mutation`, export from `api/index.ts`, consume in the page.
- Every data view uses the shared `LoadingState` / `EmptyState` / `ErrorState`
  (`components/common/states.tsx`) — don't hand-roll these.
- Never call a service or Keycloak directly; always go through the gateway.
