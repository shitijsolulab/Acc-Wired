import { useQuery } from "@tanstack/react-query";
import { Plug } from "lucide-react";

import { api, type WorkflowDefinitionSpec } from "../../api";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";

/* ─────────────────────────  Type palette (mirrors WorkflowFlow)  ───────────────────────── */

type Meta = { label: string; dot: string; badge: string; accent: string };

const TYPE_META: Record<string, Meta> = {
  "connector.call": { label: "CONNECTOR", dot: "bg-amber-500", badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400", accent: "border-l-amber-500" },
  "document.parse": { label: "EXTRACT", dot: "bg-sky-500", badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400", accent: "border-l-sky-500" },
  "document.retrieve": { label: "RETRIEVE", dot: "bg-sky-500", badge: "bg-sky-500/15 text-sky-600 dark:text-sky-400", accent: "border-l-sky-500" },
  "ai.action": { label: "AI", dot: "bg-violet-500", badge: "bg-violet-500/15 text-violet-600 dark:text-violet-400", accent: "border-l-violet-500" },
  approval: { label: "APPROVAL", dot: "bg-fuchsia-500", badge: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400", accent: "border-l-fuchsia-500" },
  notify: { label: "NOTIFY", dot: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", accent: "border-l-emerald-500" },
  branch: { label: "BRANCH", dot: "bg-orange-500", badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400", accent: "border-l-orange-500" },
  transform: { label: "TRANSFORM", dot: "bg-teal-500", badge: "bg-teal-500/15 text-teal-600 dark:text-teal-400", accent: "border-l-teal-500" },
};

const meta = (t: string): Meta =>
  TYPE_META[t] ?? {
    label: t.toUpperCase(),
    dot: "bg-muted-foreground",
    badge: "bg-muted text-muted-foreground",
    accent: "border-l-border",
  };

/* ─────────────────────────  Full-definition shapes (loose)  ───────────────────────── */

type FullStep = {
  id: string;
  type: string;
  name: string;
  config?: {
    connector?: string;
    tool?: string;
    prompt_text?: string;
    arguments?: { endpoint?: string };
  };
};
type FullDef = { steps?: FullStep[]; connectors_required?: string[] };

const stripNango = (s: string) => s.replace(/^nango\./, "");
const usesConnector = (t: string) => t === "connector.call" || t === "notify";

/* ─────────────────────────  Component  ───────────────────────── */

export function WorkflowDialog({
  def,
  open,
  onOpenChange,
}: {
  def: WorkflowDefinitionSpec;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Fetch the FULL definition (per-step config) only when opened.
  const { data: fullRaw, isLoading } = useQuery({
    queryKey: ["workflow-definition", def.workflow_key, def.pack_key],
    queryFn: () => api.getWorkflowDefinition(def.workflow_key, def.pack_key),
    enabled: open,
  });
  const full = fullRaw as unknown as FullDef | undefined;

  // Prefer the full definition (has config); fall back to the list spec for instant structure.
  const steps: FullStep[] = full?.steps ?? def.steps.map((s) => ({ ...s }));
  const connectors: string[] = full?.connectors_required ?? def.connectors_required;

  const n = Math.max(steps.length, 1);
  const m = Math.max(connectors.length, 1);

  // Best-effort: which connector node does a connector-using step point at?
  const connectorIndex = (ref?: string): number => {
    if (!ref) return -1;
    let idx = connectors.findIndex((c) => c === ref);
    if (idx < 0) idx = connectors.findIndex((c) => stripNango(c) === stripNango(ref));
    return idx;
  };

  // Curves: from each connector-using step (top) DOWN to its connector node (bottom).
  const links = steps
    .map((s, i) => ({ i, j: usesConnector(s.type) ? connectorIndex(s.config?.connector) : -1 }))
    .filter((l) => l.j >= 0);

  // SVG coordinate space is 0..100 in x (maps across the width) and 0..100 in y (the band).
  const stepX = (i: number) => ((i + 0.5) / n) * 100;
  const connX = (j: number) => ((j + 0.5) / m) * 100;

  const typesPresent = Array.from(new Set(steps.map((s) => s.type)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{def.name}</DialogTitle>
          {def.description && <DialogDescription>{def.description}</DialogDescription>}
        </DialogHeader>

        <div className="rounded-xl border border-border bg-surface p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Flow
            </span>
            {isLoading && (
              <span className="text-[10px] text-muted-foreground">Loading details…</span>
            )}
          </div>

          <TooltipProvider delayDuration={80}>
            {/* Step nodes — equal fractional columns so the row always FITS (no scroll). */}
            <div
              className="grid gap-2"
              style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
            >
              {steps.map((s, i) => {
                const mm = meta(s.type);
                return (
                  <Tooltip key={s.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "cursor-default rounded-lg border border-l-[3px] border-border bg-card px-2.5 py-2 transition hover:border-primary/50 hover:shadow-sm",
                          mm.accent,
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                              mm.badge,
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="truncate text-[12px] font-medium text-foreground">
                            {s.name}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-1 pl-[26px]">
                          <span className={cn("h-1.5 w-1.5 rounded-full", mm.dot)} />
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {mm.label}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs bg-card text-foreground shadow-md ring-1 ring-border">
                      <StepDetail step={s} />
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>

            {/* Curve band linking connector-using steps to their connector nodes. */}
            <div className="relative h-14">
              {connectors.length > 0 && (
                <svg
                  className="absolute inset-0 h-full w-full text-amber-500/50"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <g fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke">
                    {links.map((l) => {
                      const sx = stepX(l.i);
                      const cx = connX(l.j);
                      return (
                        <path
                          key={`${l.i}-${l.j}`}
                          d={`M ${sx} 0 C ${sx} 55, ${cx} 45, ${cx} 100`}
                          vectorEffect="non-scaling-stroke"
                        />
                      );
                    })}
                  </g>
                </svg>
              )}
            </div>

            {/* Connector nodes. */}
            {connectors.length > 0 && (
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${m}, minmax(0, 1fr))` }}
              >
                {connectors.map((c) => (
                  <div
                    key={c}
                    className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-2"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Plug className="h-3 w-3" />
                    </span>
                    <span className="truncate text-[12px] font-medium text-foreground">
                      {stripNango(c)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TooltipProvider>

          {/* Type legend. */}
          {typesPresent.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3">
              {typesPresent.map((t) => {
                const mm = meta(t);
                return (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", mm.dot)} />
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {mm.label}
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────  Hover detail  ───────────────────────── */

function StepDetail({ step }: { step: FullStep }) {
  const mm = meta(step.type);
  const cfg = step.config ?? {};
  return (
    <div className="space-y-1">
      <div className="text-[13px] font-semibold leading-tight">{step.name}</div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {mm.label}
        <span className="ml-1 font-mono normal-case tracking-normal opacity-70">{step.type}</span>
      </div>
      {usesConnector(step.type) && (cfg.tool || cfg.arguments?.endpoint) && (
        <div className="pt-0.5 text-[11px] leading-snug text-muted-foreground">
          {cfg.tool && (
            <div>
              <span className="font-medium text-foreground">Tool:</span> {cfg.tool}
            </div>
          )}
          {cfg.arguments?.endpoint && (
            <div className="break-all">
              <span className="font-medium text-foreground">Endpoint:</span> {cfg.arguments.endpoint}
            </div>
          )}
        </div>
      )}
      {step.type === "ai.action" && cfg.prompt_text && (
        <p className="pt-0.5 text-[11px] leading-snug text-muted-foreground">
          {cfg.prompt_text.length > 160 ? `${cfg.prompt_text.slice(0, 160)}…` : cfg.prompt_text}
        </p>
      )}
    </div>
  );
}
