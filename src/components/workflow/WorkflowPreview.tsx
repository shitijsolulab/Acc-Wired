import { useQuery } from "@tanstack/react-query";
import {
  Circle,
  GitBranch,
  Play,
  Plug,
  ScanLine,
  Search,
  Send,
  Shuffle,
  Sparkles,
  UserCheck,
  Workflow as WorkflowIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { api, type WorkflowDefinitionSpec } from "../../api";
import { cn } from "../../lib/utils";
import { IntegrationLogo } from "../common/IntegrationLogo";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

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

// One lucide glyph per step type; falls back to a neutral dot.
const TYPE_ICON: Record<string, LucideIcon> = {
  "connector.call": Plug,
  "document.parse": ScanLine,
  "document.retrieve": Search,
  "ai.action": Sparkles,
  approval: UserCheck,
  branch: GitBranch,
  notify: Send,
  transform: Shuffle,
  trigger: Play,
  manual: Play,
};

const iconFor = (t: string): LucideIcon => TYPE_ICON[t] ?? Circle;

/* ─────────────────────────  Full-definition shapes (loose)  ───────────────────────── */

type FullStep = {
  id: string;
  type: string;
  name: string;
  config?: {
    connector?: string;
    tool?: string;
    prompt?: string;
    prompt_text?: string;
    approver_persona?: string;
    condition?: string;
    arguments?: { endpoint?: string };
  };
};
type FullDef = { steps?: FullStep[]; connectors_required?: string[]; business_goal?: string };

const stripNango = (s: string) => s.replace(/^nango\./, "");

// Map a connector key to its brand: name + (where a shared Google favicon would be
// ambiguous) an explicit product logo, so the footer chips render real brand marks —
// same approach as the integrations catalog. Unknown keys fall back to a monogram.
type Brand = { name: string; domain?: string; logo?: string };

const CONNECTOR_BRANDS: Record<string, Brand> = {
  "nango.google-mail": {
    name: "Gmail",
    domain: "mail.google.com",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/gmail_2020q4_48dp.png",
  },
  "nango.google-sheet": {
    name: "Google Sheets",
    domain: "sheets.google.com",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png",
  },
  "nango.google-drive": {
    name: "Google Drive",
    domain: "drive.google.com",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
  },
  "nango.quickbooks": { name: "QuickBooks", domain: "quickbooks.intuit.com" },
};
const brandFor = (key: string): Brand =>
  CONNECTOR_BRANDS[key] ?? { name: stripNango(key) };

/* ─────────────────────────  Component  ───────────────────────── */

export function WorkflowPreview({
  def,
  open,
  onOpenChange,
}: {
  def: WorkflowDefinitionSpec | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Fetch the FULL definition (per-step config) only while the panel is open.
  const { data: fullRaw, isLoading } = useQuery({
    queryKey: ["workflow-definition", def?.pack_key, def?.workflow_key],
    queryFn: () => api.getWorkflowDefinition(def!.workflow_key, def!.pack_key),
    enabled: open && !!def,
  });
  const full = fullRaw as unknown as FullDef | undefined;

  // Prefer the full definition (has config); fall back to the list spec for instant structure.
  const steps: FullStep[] = full?.steps ?? def?.steps ?? [];
  const connectors: string[] = full?.connectors_required ?? def?.connectors_required ?? [];
  const description = def?.description ?? full?.business_goal;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <SheetHeader className="space-y-1.5 border-b border-border px-5 py-4 pr-10 text-left">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <WorkflowIcon className="h-3.5 w-3.5 text-primary" />
            Workflow preview
          </div>
          <SheetTitle className="text-base leading-snug">{def?.name ?? "Workflow"}</SheetTitle>
          {description && (
            <SheetDescription className="text-xs leading-relaxed">{description}</SheetDescription>
          )}
        </SheetHeader>

        {/* Tabs: Flow | Details */}
        <Tabs defaultValue="flow" className="flex min-h-0 flex-1 flex-col">
          <div className="px-5 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="flow" className="flex-1">
                Flow
              </TabsTrigger>
              <TabsTrigger value="details" className="flex-1">
                Details
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Flow — clean VERTICAL step list (top→bottom, scrolls if long). */}
          <TabsContent value="flow" className="mt-0 min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <ol className="relative">
              {steps.map((s, i) => {
                const mm = meta(s.type);
                const Icon = iconFor(s.type);
                const last = i === steps.length - 1;
                return (
                  <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {/* Vertical connector line down to the next step. */}
                    {!last && (
                      <span
                        aria-hidden
                        className="absolute left-4 top-9 bottom-0 -translate-x-1/2 w-px bg-border"
                      />
                    )}
                    {/* Numbered, type-colored circle badge. */}
                    <span
                      className={cn(
                        "relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                        mm.badge,
                      )}
                    >
                      {i + 1}
                    </span>
                    {/* Step card: type icon tile + full name + type label. */}
                    <div className="min-w-0 flex-1 rounded-lg border border-border bg-card px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid h-6 w-6 shrink-0 place-items-center rounded-md",
                            mm.badge,
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {mm.label}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-snug text-foreground">
                        {s.name}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
            {steps.length === 0 && (
              <p className="text-xs text-muted-foreground">No steps defined.</p>
            )}
          </TabsContent>

          {/* Details — a readable per-step spec. */}
          <TabsContent value="details" className="mt-0 min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {description && (
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{description}</p>
            )}
            {isLoading && !full && (
              <p className="mb-3 text-[11px] text-muted-foreground">Loading step details…</p>
            )}
            <div className="space-y-2.5">
              {steps.map((s) => (
                <StepDetail key={s.id} step={s} />
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer — Connections used (compact brand logos). */}
        {connectors.length > 0 && (
          <div className="border-t border-border px-5 py-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Plug className="h-3 w-3" />
              Connections used
            </div>
            <div className="flex flex-wrap gap-1.5">
              {connectors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5 text-xs text-foreground"
                >
                  <IntegrationLogo
                    name={brandFor(c).name}
                    domain={brandFor(c).domain}
                    logo={brandFor(c).logo}
                    className="h-5 w-5 text-[9px]"
                  />
                  {brandFor(c).name}
                </span>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* ─────────────────────────  Per-step detail block  ───────────────────────── */

function StepDetail({ step }: { step: FullStep }) {
  const mm = meta(step.type);
  const cfg = step.config ?? {};
  const usesConnector = step.type === "connector.call" || step.type === "notify";
  const promptText = cfg.prompt_text ?? cfg.prompt;

  return (
    <div className={cn("rounded-lg border border-l-[3px] border-border bg-card px-3 py-2.5", mm.accent)}>
      <div className="text-[13px] font-medium leading-snug text-foreground">{step.name}</div>
      <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {mm.label}
        <span className="ml-1.5 font-mono normal-case tracking-normal opacity-70">{step.type}</span>
      </div>

      {usesConnector && (cfg.tool || cfg.arguments?.endpoint) && (
        <div className="mt-1.5 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
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

      {step.type === "ai.action" && promptText && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Prompt:</span>{" "}
          {promptText.length > 160 ? `${promptText.slice(0, 160)}…` : promptText}
        </p>
      )}

      {step.type === "approval" && cfg.approver_persona && (
        <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Approver:</span>{" "}
          <span className="capitalize">{cfg.approver_persona}</span>
        </p>
      )}

      {step.type === "branch" && cfg.condition && (
        <p className="mt-1.5 break-all text-[11px] leading-snug text-muted-foreground">
          <span className="font-medium text-foreground">Condition:</span>{" "}
          <span className="font-mono">{cfg.condition}</span>
        </p>
      )}
    </div>
  );
}
