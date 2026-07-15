import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Plug, Plus, ShieldCheck, ShieldPlus, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import Nango from "@nangohq/frontend";

import {
  api,
  useConnectorCatalog,
  useAccessRequests,
  useRequestAccess,
  useDecideAccessRequest,
  useSetEntitlement,
  type AccessRequest,
  type ConnectorItem,
} from "../api";
import { LoadingState } from "../components/common/states";
import { IntegrationLogo } from "../components/common/IntegrationLogo";
import { useSession } from "../lib/session";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/connectors")({ component: Connectors });

function Connectors() {
  const { data: connectors = [], isLoading } = useConnectorCatalog();
  const { data: requests = [] } = useAccessRequests();
  const { isManager: isAdmin } = useSession();

  const connected = connectors.filter((c) => c.entitled && c.enabled);
  const available = connectors.filter((c) => c.entitled && !c.enabled);
  const restricted = connectors.filter((c) => !c.entitled);

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Connector Hub
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Connected systems
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{connected.length} connected</span>{" "}
            {available.length > 0 && (
              <>· {available.length} ready to connect </>
            )}
            — authenticate once, then let your copilots read and act across them.
          </p>
        </div>
      </div>

      {/* Non-replacement callout — mirrors the Build Flow "works with your stack" panel */}
      <section className="flex items-start gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-sm font-semibold">
            Your copilots work <span className="text-primary">with</span> your existing systems.
          </h2>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
            Connect through each system's native API. Your ERP stays the system of record — copilots
            read the data they need and write approved entries back, without asking anyone to change
            how they already work.
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
            {["No rip-and-replace", "Native read/write connections", "Your system stays the source of truth"].map(
              (t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-primary" /> {t}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="space-y-8">
          {/* 1 — Connected Systems */}
          {connected.length > 0 && (
            <Section label="Connected Systems" count={connected.length}>
              {connected.map((c) => (
                <ConnectedCard key={c.key} connector={c} />
              ))}
            </Section>
          )}

          {/* 2 — Available Connectors */}
          {available.length > 0 && (
            <Section label="Available Connectors" count={available.length}>
              {available.map((c) => (
                <AvailableCard key={c.key} connector={c} />
              ))}
            </Section>
          )}

          {/* 3 — Pending Permissions */}
          {restricted.length > 0 ? (
            <Section label="Pending Permissions" count={restricted.length}>
              {restricted.map((c) => (
                <PendingCard
                  key={c.key}
                  connector={c}
                  request={requests.find(
                    (r) => r.connector_key === c.key && r.status === "pending",
                  )}
                  isAdmin={isAdmin}
                />
              ))}
            </Section>
          ) : (
            connectors.length > 0 && (
              <p className="text-xs text-muted-foreground">
                No connectors are pending — your workspace has access to the full catalog.
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}

/** Uppercase section label + count, styled like the rest of the app. */
function Section({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <span>{label}</span>
        <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
          {count}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}

/** Shared connector card visual — logo/name/kind/tools, with a per-section badge + action area. */
function ConnectorCard({
  connector,
  badge,
  actions,
}: {
  connector: ConnectorItem;
  badge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-surface p-4 transition hover:border-primary/50 hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <IntegrationLogo name={connector.name} className="h-11 w-11 shrink-0" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{connector.name}</div>
            <div className="text-xs text-muted-foreground">{connector.kind}</div>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {connector.tool_count} tools
        </span>
      </div>

      {badge && <div className="mt-3 flex items-center gap-2">{badge}</div>}
      {actions && <div className="mt-4 flex items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Reuse of the original Connect flow (Nango live / sandbox enable). Preserved verbatim. */
async function handleConnect(key: string, queryClient: ReturnType<typeof useQueryClient>) {
  const session = await api.getConnectSession(key);
  // Sandbox (no NANGO_SECRET_KEY on the backend) → just enable; no OAuth needed.
  if (session.status === "sandbox" || !session.session_token) {
    await api.configureConnector(key, { enabled: true });
    queryClient.invalidateQueries({ queryKey: ["connector-catalog"] });
    return;
  }
  // Live: open Nango's Connect UI so the user authorizes their OWN account.
  const nango = new Nango();
  // NOTE: confirm this call/return against your installed @nangohq/frontend version.
  const result: any = await nango.openConnectUI({ sessionToken: session.session_token });
  const connectionId =
    result?.connectionId ?? result?.payload?.connectionId ?? result?.connection?.connectionId;
  await api.configureConnector(key, {
    enabled: true,
    config: connectionId ? { connection_id: connectionId } : {},
  });
  queryClient.invalidateQueries({ queryKey: ["connector-catalog"] });
}

// --- Section 1: Connected -----------------------------------------------------
function ConnectedCard({ connector }: { connector: ConnectorItem }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const disconnect = async () => {
    setBusy(true);
    try {
      await api.configureConnector(connector.key, { enabled: false });
      await qc.invalidateQueries({ queryKey: ["connector-catalog"] });
      toast.success(`Disconnected ${connector.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not disconnect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConnectorCard
      connector={connector}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Connected
        </span>
      }
      actions={
        <button
          onClick={disconnect}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-destructive hover:text-destructive disabled:opacity-60"
        >
          <X className="h-3.5 w-3.5" /> Disconnect
        </button>
      }
    />
  );
}

// --- Section 2: Available -----------------------------------------------------
function AvailableCard({ connector }: { connector: ConnectorItem }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const connect = async () => {
    setBusy(true);
    try {
      await handleConnect(connector.key, qc);
      await qc.invalidateQueries({ queryKey: ["connector-catalog"] });
      toast.success(`Connected ${connector.name}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not connect.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ConnectorCard
      connector={connector}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          Not connected
        </span>
      }
      actions={
        <button
          onClick={connect}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Connect
        </button>
      }
    />
  );
}

// --- Section 3: Pending Permissions ------------------------------------------
function PendingCard({
  connector,
  request,
  isAdmin,
}: {
  connector: ConnectorItem;
  request?: AccessRequest;
  isAdmin: boolean;
}) {
  const requestAccess = useRequestAccess();
  const decide = useDecideAccessRequest();
  const grant = useSetEntitlement();

  const awaiting = (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-amber-600 dark:text-amber-400">
      <Clock className="h-3 w-3" />
      Awaiting approval
    </span>
  );

  // A pending access request already exists for this connector.
  if (request) {
    return (
      <ConnectorCard
        connector={connector}
        badge={awaiting}
        actions={
          isAdmin ? (
            <>
              <button
                onClick={() =>
                  decide.mutate(
                    { id: request.id, decision: "approve" },
                    {
                      onSuccess: () => toast.success(`Granted access to ${connector.name}.`),
                      onError: (e) =>
                        toast.error(e instanceof Error ? e.message : "Could not approve."),
                    },
                  )
                }
                disabled={decide.isPending}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-60"
              >
                <Check className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() =>
                  decide.mutate(
                    { id: request.id, decision: "reject" },
                    {
                      onSuccess: () => toast.success(`Rejected the request for ${connector.name}.`),
                      onError: (e) =>
                        toast.error(e instanceof Error ? e.message : "Could not reject."),
                    },
                  )
                }
                disabled={decide.isPending}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-destructive hover:text-destructive disabled:opacity-60"
              >
                <X className="h-3.5 w-3.5" /> Reject
              </button>
            </>
          ) : undefined
        }
      />
    );
  }

  // No pending request yet.
  return (
    <ConnectorCard
      connector={connector}
      badge={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
          Not entitled
        </span>
      }
      actions={
        isAdmin ? (
          <button
            onClick={() =>
              grant.mutate(
                { key: connector.key, allowed: true },
                {
                  onSuccess: () => toast.success(`Granted access to ${connector.name}.`),
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : "Could not grant access."),
                },
              )
            }
            disabled={grant.isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20 disabled:opacity-60"
          >
            <ShieldPlus className="h-3.5 w-3.5" /> Grant access
          </button>
        ) : (
          <button
            onClick={() =>
              requestAccess.mutate(
                { key: connector.key },
                {
                  onSuccess: () => toast.success(`Requested access to ${connector.name}.`),
                  onError: (e) =>
                    toast.error(e instanceof Error ? e.message : "Could not request access."),
                },
              )
            }
            disabled={requestAccess.isPending}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:border-primary hover:text-primary disabled:opacity-60"
          >
            <Plug className="h-3.5 w-3.5" /> Request access
          </button>
        )
      }
    />
  );
}
