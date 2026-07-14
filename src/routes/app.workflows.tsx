import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  ClipboardCheck,
  Loader2,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { useWorkflows } from "../api";
import { EmptyState, LoadingState } from "../components/common/states";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/app/workflows")({ component: Workflows });

/* ─────────────────────────  Status styling  ───────────────────────── */

// Keyed by known status strings, with a neutral fallback so unrecognized
// statuses from the backend still render safely.
const STATUS_META: Record<string, { label: string; cls: string }> = {
  running: { label: "Running", cls: "bg-sky-500/10 border-sky-500/30 text-sky-500" },
  awaiting_approval: { label: "Awaiting Approval", cls: "bg-amber-500/10 border-amber-500/30 text-amber-500" },
  completed: { label: "Completed", cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" },
  failed: { label: "Failed", cls: "bg-destructive/10 border-destructive/30 text-destructive" },
};

const FALLBACK_STATUS_CLS = "bg-muted border-border text-muted-foreground";

/* ─────────────────────────  Page  ───────────────────────── */

function Workflows() {
  const { data: workflows = [], isLoading } = useWorkflows();

  const running = workflows.filter((w) => w.status === "running").length;
  const pending = workflows.filter((w) => w.status === "awaiting_approval").length;
  const completed = workflows.filter((w) => w.status === "completed").length;

  return (
    <div className="space-y-7">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <WorkflowIcon className="h-3.5 w-3.5 text-primary" />
          Workflows
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          Running workflows
        </h1>
        <p className="mt-1.5 max-w-xl text-sm text-muted-foreground">
          Every durable workflow running across your organization — click one to see its flow and the
          systems it connects.
        </p>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={Loader2} label="Running" value={running} tone="text-sky-500" />
        <Kpi icon={ClipboardCheck} label="Awaiting Approval" value={pending} tone="text-amber-500" />
        <Kpi icon={CheckCircle2} label="Completed" value={completed} tone="text-emerald-500" />
        <Kpi icon={WorkflowIcon} label="Total" value={workflows.length} tone="text-foreground" />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState label="Loading workflows…" />
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={WorkflowIcon}
          title="No workflows yet"
          description="Workflows will appear here as they run across your organization."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-medium">Workflow</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Waiting For</th>
                  <th className="px-5 py-3 font-medium">Decision</th>
                  <th className="px-5 py-3 text-right font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {workflows.map((w) => {
                  const meta = STATUS_META[w.status];
                  return (
                    <tr key={w.workflow_id} className="transition-colors hover:bg-surface-2/50">
                      <td className="px-5 py-3">
                        <div className="font-medium text-foreground">{w.summary ?? w.type}</div>
                        <div className="font-mono text-xs text-muted-foreground">{w.workflow_id}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            meta?.cls ?? FALLBACK_STATUS_CLS,
                          )}
                        >
                          {w.status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
                          {meta?.label ?? w.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">—</td>
                      <td className="px-5 py-3">
                        {w.decision ? (
                          <span className="capitalize">{w.decision}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
                        {new Date(w.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <Icon className={cn("h-4 w-4", tone)} />
      </div>
      <div className={cn("mt-2 text-2xl font-semibold tabular-nums", tone)}>{value}</div>
    </div>
  );
}
