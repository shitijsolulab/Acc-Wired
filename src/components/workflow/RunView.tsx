import { Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  UserCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { useRun, useDecideRun } from "../../api";
import { LoadingState } from "../common/states";
import { cn } from "../../lib/utils";

/* ─────────────────────────  Run status (header badge)  ───────────────────────── */

type RunStatusMeta = { label: string; cls: string; spin?: boolean };

const RUN_STATUS_META: Record<string, RunStatusMeta> = {
  running: { label: "Running…", cls: "bg-sky-500/10 border-sky-500/30 text-sky-500", spin: true },
  awaiting_approval: {
    label: "Awaiting approval",
    cls: "bg-amber-500/10 border-amber-500/30 text-amber-500",
  },
  completed: { label: "Completed", cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" },
  rejected: { label: "Rejected", cls: "bg-destructive/10 border-destructive/30 text-destructive" },
};

const FALLBACK_RUN_STATUS: RunStatusMeta = {
  label: "Pending",
  cls: "bg-muted border-border text-muted-foreground",
};

/* ─────────────────────────  Step status (node decoration)  ───────────────────────── */

// One decoration per step status — accent border, badge tint, and the icon shown in
// the numbered badge slot. Mirrors the compact-node visual language of WorkflowFlow.
type StepStatusMeta = {
  accent: string; // left border colour
  badge: string; // numbered-badge background/text
  card: string; // extra card classes (opacity / pulse)
  label?: string; // small status tag under the name
  labelCls?: string;
};

const STEP_STATUS_META: Record<string, StepStatusMeta> = {
  completed: {
    accent: "border-l-emerald-500",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    card: "",
  },
  running: {
    accent: "border-l-sky-500",
    badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    card: "border-sky-500/40",
    label: "running",
    labelCls: "text-sky-500",
  },
  awaiting_approval: {
    accent: "border-l-amber-500",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    card: "border-amber-500/40 animate-pulse",
    label: "awaiting approval",
    labelCls: "text-amber-500",
  },
  skipped: {
    accent: "border-l-border",
    badge: "bg-muted text-muted-foreground",
    card: "opacity-50",
    label: "skipped",
    labelCls: "text-muted-foreground",
  },
  pending: {
    accent: "border-l-border",
    badge: "bg-muted text-muted-foreground",
    card: "opacity-60",
  },
};

const fallbackStepMeta = (): StepStatusMeta => ({
  accent: "border-l-border",
  badge: "bg-muted text-muted-foreground",
  card: "",
});

function StepIcon({ status, index }: { status: string; index: number }) {
  if (status === "completed") return <Check className="h-3 w-3" />;
  if (status === "running") return <Loader2 className="h-3 w-3 animate-spin" />;
  if (status === "awaiting_approval") return <Clock className="h-3 w-3" />;
  return <>{index + 1}</>;
}

/* ─────────────────────────  Component  ───────────────────────── */

export function RunView({ runId }: { runId: string }) {
  const { data: run, isLoading } = useRun(runId);
  const decide = useDecideRun();

  if (isLoading) return <LoadingState label="Loading run…" />;

  if (!run) {
    return (
      <div className="space-y-4">
        <BackLink />
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          This run could not be found.
        </div>
      </div>
    );
  }

  const runMeta = RUN_STATUS_META[run.status] ?? FALLBACK_RUN_STATUS;

  const onDecide = (decision: "approve" | "reject") =>
    decide.mutate(
      { runId, decision },
      {
        onSuccess: () =>
          toast.success(decision === "approve" ? "Run approved." : "Run rejected."),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Could not submit your decision."),
      },
    );

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <BackLink />
          <h1 className="mt-2 truncate text-2xl font-semibold tracking-tight text-foreground">
            {run.name}
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{run.run_id}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
            runMeta.cls,
          )}
        >
          {runMeta.spin && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {runMeta.label}
        </span>
      </div>

      {/* Flow graph */}
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Flow
        </div>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2.5">
          {run.steps.map((s, i) => {
            const m = STEP_STATUS_META[s.status] ?? fallbackStepMeta();
            return (
              <div key={s.id} className="flex items-center">
                <div
                  title={`${s.name} · ${s.type} · ${s.status}`}
                  className={cn(
                    "w-[172px] shrink-0 rounded-lg border border-l-[3px] border-border bg-card px-3 py-2.5 transition",
                    m.accent,
                    m.card,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                        m.badge,
                      )}
                    >
                      <StepIcon status={s.status} index={i} />
                    </span>
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {s.name}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 pl-7">
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {s.type}
                    </span>
                    {m.label && (
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider",
                          m.labelCls,
                        )}
                      >
                        · {m.label}
                      </span>
                    )}
                  </div>
                </div>
                {i < run.steps.length - 1 && (
                  <div className="mx-1.5 h-px w-6 shrink-0 bg-gradient-to-r from-border via-border to-transparent" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Approval gate */}
      {run.status === "awaiting_approval" && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <UserCheck className="h-4 w-4 text-amber-500" />
            Waiting for your approval
          </div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {run.summary ?? "Review the run so far and approve to continue, or reject to stop it."}
          </p>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onDecide("approve")}
              disabled={decide.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-1.5 text-sm font-medium text-emerald-600 transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-400"
            >
              {decide.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Approve
            </button>
            <button
              onClick={() => onDecide("reject")}
              disabled={decide.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-1.5 text-sm font-medium text-destructive transition hover:bg-destructive/20 disabled:opacity-60"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Result */}
      {run.status === "completed" && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
          <div>
            <div className="text-sm font-semibold text-foreground">Workflow completed</div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {run.summary ?? "Workflow completed."}
            </p>
          </div>
        </div>
      )}

      {run.status === "rejected" && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <div className="text-sm font-semibold text-foreground">This run was rejected.</div>
            {run.summary && (
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {run.summary}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function BackLink() {
  return (
    <Link
      to="/app/workflows"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to workflows
    </Link>
  );
}
