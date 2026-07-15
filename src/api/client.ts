// API client for the Industry AI OS gateway.
//
// The frontend talks to the GATEWAY ONLY (never a service or Keycloak directly).
// Base URL comes from VITE_API_URL (see .env.example), defaulting to the local
// gateway. On login we store the Keycloak access token and send it as a bearer on
// every subsequent call. One typed method per backend endpoint — no business logic
// lives here, and there are no mock endpoints: a screen with no backend simply has
// no method here and renders an empty state.

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://localhost:8000";

const TOKEN_KEY = "aios.access_token";

// --- Dummy auth -------------------------------------------------------------
// Client-side auth fallback (localStorage). Now that the gateway's real
// login/registration flow is wired, this is OFF — auth goes to the backend.
// Flip to `true` only to demo the UI with no backend running.
const DUMMY_AUTH = false;
const USERS_KEY = "aios.dummy_users";
const SESSION_KEY = "aios.dummy_session";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}

export function logout(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const resp = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      // Skip ngrok free-tier's browser-warning interstitial (which strips CORS headers)
      // when the gateway is exposed via an ngrok URL. Harmless on any other host.
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!resp.ok) {
    let detail = resp.statusText;
    try {
      const body = await resp.json();
      detail = body.message ?? body.error ?? detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail, resp.status);
  }
  return (resp.status === 204 ? undefined : await resp.json()) as T;
}

// ---------------------------------------------------------------- types
export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface Me {
  user_id: string;
  email: string | null;
  tenant_id: string;
  tenant_slug: string | null;
  roles: string[];
}

export interface DocumentItem {
  id: string;
  filename: string;
  content_type: string | null;
  status: string;
  size_bytes: number | null;
  created_at: string;
}

export interface RetrievedChunk {
  document_id: string;
  chunk_index: number;
  content: string;
  score: number;
}

export interface WorkflowItem {
  workflow_id: string;
  type: string;
  status: string;
  document_id: string | null;
  summary?: string | null;
  decision: string | null;
  decided_by: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConnectorItem {
  key: string;
  name: string;
  kind: string;
  enabled: boolean;
  tool_count: number;
  /** Present on the full catalogue (`?all=true`): whether the tenant is entitled
   *  to use this connector. Absent (undefined) on the entitled-only default list. */
  entitled?: boolean;
}

export interface AuditEvent {
  id: string;
  tenant_id: string;
  actor_id: string;
  actor_email: string | null;
  action: string;
  resource_kind: string;
  resource_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: string;
  settings?: Record<string, unknown>;
  created_at?: string;
  note?: string;
}

export interface SystemHealth {
  overall: string;
  services: Record<string, string>;
}

export interface UserItem {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  roles: string[];
}

export interface ChatReply {
  session_id: string;
  model: string;
  answer: string;
}

// ---------------------------------------------------------------- auth
export interface SignupInput {
  name: string;
  email: string;
  company: string;
  password: string;
}

// --- Dummy auth helpers (localStorage-backed) ---
interface DummyUser extends SignupInput {}

function readDummyUsers(): DummyUser[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(USERS_KEY) ?? "[]") as DummyUser[];
  } catch {
    return [];
  }
}

function writeDummyUsers(users: DummyUser[]): void {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function meFromDummy(user: DummyUser): Me {
  const slug =
    user.company
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "workspace";
  return {
    user_id: user.email,
    email: user.email,
    tenant_id: slug,
    tenant_slug: slug,
    roles: ["owner", "admin"], // full access for the demo account
  };
}

function startDummySession(user: DummyUser): Me {
  const me = meFromDummy(user);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(me));
  setToken(`dummy.${btoa(user.email)}`);
  return me;
}

function dummyLogin(email: string, password: string): Me {
  const user = readDummyUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new ApiError("Invalid email or password.", 401);
  }
  return startDummySession(user);
}

function dummySignup(input: SignupInput): Me {
  const users = readDummyUsers();
  if (users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ApiError("An account with this email already exists.", 409);
  }
  users.push(input);
  writeDummyUsers(users);
  return startDummySession(input);
}

function dummyMe(): Me {
  const raw = typeof window !== "undefined" ? window.localStorage.getItem(SESSION_KEY) : null;
  if (!raw) throw new ApiError("Not authenticated", 401);
  return JSON.parse(raw) as Me;
}

export async function login(email: string, password: string): Promise<Me> {
  if (DUMMY_AUTH) return dummyLogin(email, password);
  const token = await request<TokenResponse>("/auth/token", {
    method: "POST",
    body: JSON.stringify({ username: email, password }),
  });
  setToken(token.access_token);
  return getMe();
}

export async function signup(input: SignupInput): Promise<Me> {
  if (DUMMY_AUTH) return dummySignup(input);
  // Real gateway signup. This is the Accounting workspace, so every account created
  // here lands in the "accounting" industry (login_source). The `company` field is
  // not used — self-service signups join the shared demo tenant (see backend D10).
  const parts = input.name.trim().split(/\s+/);
  const first_name = parts[0] || input.email.split("@")[0];
  const last_name = parts.slice(1).join(" ") || first_name;
  const token = await request<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      first_name,
      last_name,
      login_source: "accounting",
    }),
  });
  setToken(token.access_token);
  return getMe();
}

export function getMe(): Promise<Me> {
  if (DUMMY_AUTH) return Promise.resolve(dummyMe());
  return request<Me>("/api/identity/me");
}

// ---------------------------------------------------------------- orchestrator
export function chat(input: {
  message: string;
  session_id?: string;
  use_rag?: boolean;
  model?: string;
  workspace?: string; // active industry workspace, so the assistant is workspace-aware
}): Promise<ChatReply> {
  return request<ChatReply>("/api/orchestrator/chat", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

/** Streaming chat via SSE. Yields text deltas; caller concatenates. */
export async function* chatStream(input: {
  message: string;
  session_id?: string;
  use_rag?: boolean;
  model?: string;
  workspace?: string; // active industry workspace, so the assistant is workspace-aware
}): AsyncGenerator<{ delta?: string; session_id?: string; model?: string; error?: string }> {
  const resp = await fetch(`${API_URL}/api/orchestrator/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!resp.ok || !resp.body) throw new ApiError("Stream failed", resp.status);
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const data = line.replace(/^data: /, "").trim();
      if (!data || data === "[DONE]") continue;
      try {
        yield JSON.parse(data);
      } catch {
        /* ignore partial frames */
      }
    }
  }
}

// ---------------------------------------------------------------- knowledge
export function listDocuments(): Promise<DocumentItem[]> {
  return request<DocumentItem[]>("/api/knowledge/documents");
}

export function getDocument(id: string): Promise<DocumentItem> {
  return request<DocumentItem>(`/api/knowledge/documents/${id}`);
}

export async function uploadDocument(file: File): Promise<DocumentItem> {
  const form = new FormData();
  form.append("file", file);
  const resp = await fetch(`${API_URL}/api/knowledge/documents`, {
    method: "POST",
    headers: {
      "ngrok-skip-browser-warning": "true",
      ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
    },
    body: form, // browser sets multipart boundary
  });
  if (!resp.ok) throw new ApiError("Upload failed", resp.status);
  return resp.json();
}

export function retrieve(
  query: string,
  topK = 5,
): Promise<{ query: string; results: RetrievedChunk[] }> {
  return request("/api/knowledge/retrieve", {
    method: "POST",
    body: JSON.stringify({ query, top_k: topK }),
  });
}

// ---------------------------------------------------------------- workflows
export function listWorkflows(): Promise<WorkflowItem[]> {
  return request<WorkflowItem[]>("/api/workflows/workflows");
}

export function getWorkflow(id: string): Promise<WorkflowItem> {
  return request<WorkflowItem>(`/api/workflows/workflows/${id}`);
}

export interface WorkflowDefinitionSpec {
  pack_key: string;
  workflow_key: string;
  name: string;
  trigger: string;
  connectors_required: string[];
  steps: { id: string; type: string; name: string }[];
  latest_status?: string | null;
  latest_run_id?: string | null;
  /** "seed" = shipped template, "user" = builder-authored (pack_key === "custom"). */
  source?: "seed" | "user";
}

export function listWorkflowDefinitions(): Promise<WorkflowDefinitionSpec[]> {
  return request<WorkflowDefinitionSpec[]>("/api/workflows/packs/definitions");
}

/** Create/upsert a user workflow definition. `pack` is forced to "custom" server-side;
 *  the definition's `key` is the workflow id (upsert by key). */
export function createWorkflowDefinition(definition: unknown): Promise<WorkflowDefinitionSpec> {
  return request<WorkflowDefinitionSpec>("/api/workflows/packs/definitions", {
    method: "POST",
    body: JSON.stringify({ definition }),
  });
}

/** Update an existing user workflow definition (user flows only). */
export function updateWorkflowDefinition(
  key: string,
  definition: unknown,
): Promise<WorkflowDefinitionSpec> {
  return request<WorkflowDefinitionSpec>(`/api/workflows/packs/definitions/${key}`, {
    method: "PUT",
    body: JSON.stringify({ definition }),
  });
}

/** Delete a user workflow definition. */
export function deleteWorkflowDefinition(key: string): Promise<unknown> {
  return request(`/api/workflows/packs/definitions/${key}`, { method: "DELETE" });
}

/** The FULL stored WorkflowDefinition JSON (with per-step config) — needed to edit a flow
 *  in the builder (the list spec carries only id/type/name per step). Defaults to the
 *  reserved "custom" pack (user flows). */
export function getWorkflowDefinition(
  key: string,
  packKey = "custom",
): Promise<Record<string, unknown>> {
  const q = encodeURIComponent(packKey);
  return request<Record<string, unknown>>(`/api/workflows/packs/definitions/${key}?pack_key=${q}`);
}

/** Start a run of a workflow definition by key. */
export function startWorkflow(
  packKey: string,
  workflowKey: string,
  inputs?: Record<string, unknown>,
): Promise<{ run_id?: string; status?: string }> {
  return request(`/api/workflows/packs/${workflowKey}/run`, {
    method: "POST",
    body: JSON.stringify({ pack_key: packKey, inputs: inputs ?? {} }),
  });
}

export function startDocumentReview(
  documentId: string,
): Promise<{ workflow_id: string; status: string }> {
  return request("/api/workflows/workflows/document-review", {
    method: "POST",
    body: JSON.stringify({ document_id: documentId }),
  });
}

export function approveWorkflow(id: string, comment = ""): Promise<unknown> {
  return request(`/api/workflows/workflows/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

export function rejectWorkflow(id: string, comment = ""): Promise<unknown> {
  return request(`/api/workflows/workflows/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  });
}

// ---------------------------------------------------------------- connectors
export function listConnectors(): Promise<ConnectorItem[]> {
  return request<ConnectorItem[]>("/api/connectors/connectors");
}

/** Full connector catalogue with an `entitled` flag on each item (vs. the default
 *  entitled-only list). Used by the workflow builder palette. */
export function listConnectorCatalog(): Promise<ConnectorItem[]> {
  return request<ConnectorItem[]>("/api/connectors/connectors?all=true");
}

export interface ConnectSession {
  status: "ok" | "sandbox";
  session_token?: string; // present when status === "ok" (live Nango)
  provider?: string;
  message?: string; // present in sandbox mode
}

/** Create a Nango Connect session so the current tenant's user can authorize the
 * provider from inside our app. Feed `session_token` to Nango's Connect UI; on success
 * PUT the resulting connection_id back via configureConnector({ config:{ connection_id }}). */
export function getConnectSession(key: string): Promise<ConnectSession> {
  return request<ConnectSession>(`/api/connectors/connectors/${key}/connect-session`, {
    method: "POST",
  });
}

export function configureConnector(
  key: string,
  body: { enabled: boolean; config?: Record<string, unknown> },
): Promise<unknown> {
  return request(`/api/connectors/connectors/${key}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------- audit
export function listAuditEvents(params?: { limit?: number }): Promise<AuditEvent[]> {
  const q = params?.limit ? `?limit=${params.limit}` : "";
  return request<AuditEvent[]>(`/api/audit/events${q}`);
}

// ---------------------------------------------------------------- admin
export function getTenant(): Promise<Tenant> {
  return request<Tenant>("/api/admin/tenant");
}

export function updateTenantSettings(settings: Record<string, unknown>): Promise<unknown> {
  return request("/api/admin/tenant/settings", {
    method: "PUT",
    body: JSON.stringify({ settings }),
  });
}

export function systemHealth(): Promise<SystemHealth> {
  return request<SystemHealth>("/api/admin/system/health");
}

export function listUsers(): Promise<UserItem[]> {
  return request<UserItem[]>("/api/identity/users");
}

export function assignRole(userId: string, role: string): Promise<unknown> {
  return request(`/api/identity/users/${userId}/roles`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export const api = {
  apiUrl: API_URL,
  getToken,
  logout,
  login,
  signup,
  getMe,
  chat,
  chatStream,
  listDocuments,
  getDocument,
  uploadDocument,
  retrieve,
  listWorkflows,
  getWorkflow,
  listWorkflowDefinitions,
  getWorkflowDefinition,
  createWorkflowDefinition,
  updateWorkflowDefinition,
  deleteWorkflowDefinition,
  startWorkflow,
  startDocumentReview,
  approveWorkflow,
  rejectWorkflow,
  listConnectors,
  listConnectorCatalog,
  configureConnector,
  getConnectSession,
  listAuditEvents,
  getTenant,
  updateTenantSettings,
  systemHealth,
  listUsers,
  assignRole,
};
