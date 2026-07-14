import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Cpu,
  CreditCard,
  FileText,
  Gauge,
  Landmark,
  LifeBuoy,
  Lock,
  Mail,
  Moon,
  Percent,
  PieChart,
  Plug,
  Receipt,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Sun,
  TrendingUp,
  User,
  Users,
  Wand2,
  Workflow,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError, api } from "../api";
import { IntegrationLogo } from "../components/common/IntegrationLogo";
import { LogoLockup } from "../components/common/LogoLockup";
import { setStoredIndustry } from "../lib/industries";
import { ThemeProvider, useTheme } from "../lib/theme";
import { cn } from "../lib/utils";

export const Route = createFileRoute("/")({
  component: Index,
});

// ---------------- Content config ----------------

type WorkflowStep = { label: string; detail: string };
type WorkflowContent = {
  title: string;
  before: string;
  after: string;
  steps: WorkflowStep[];
};

const HERO = {
  tagline: "The AI operating system for accounting.",
  sub: "Automate AP/AR, bank reconciliation, expense management, and the month-end close. AI does the busywork and drafts every entry — your controller reviews and approves before anything posts.",
};

// The single, accounting-specific workflow shown in the before/after section.
const CLOSE_WORKFLOW: WorkflowContent = {
  title: "Invoice-to-approval, done in minutes.",
  before: "45+ minutes per invoice, keying data across email, drive, and your ERP.",
  after: "5 minutes: AI extracts, matches, and validates — you review and approve.",
  steps: [
    { label: "Invoice arrives", detail: "A vendor emails an invoice into your AP inbox." },
    { label: "Extract", detail: "Document intelligence reads line items, totals, and tax." },
    { label: "Match", detail: "3-way match against PO and receipt; duplicate check." },
    { label: "Validate", detail: "GL coding, approval routing, and policy checks applied." },
    { label: "Approve", detail: "Your controller reviews the draft and approves in one click." },
    { label: "Post", detail: "Journal entry written back to QuickBooks, Xero, or NetSuite." },
  ],
};

// ---------------- Copilot library (interactive catalog) ----------------

type CopilotGroup = "apar" | "close" | "compliance";

type Copilot = {
  group: CopilotGroup;
  label: string;
  title: string;
  goal: string;
  persona: string;
  approver: string;
  trigger: string;
  actions: string[];
  value: string[];
  // The live trace shown in the modal — each line mirrors what the copilot does.
  trace: { kind: "run" | "ok" | "wait" | "done"; text: string }[];
  runtime: string;
};

const COPILOT_GROUPS: { slug: CopilotGroup | "all"; label: string }[] = [
  { slug: "all", label: "All" },
  { slug: "apar", label: "AP / AR" },
  { slug: "close", label: "Close & Reporting" },
  { slug: "compliance", label: "Compliance & Audit" },
];

const GROUP_META: Record<CopilotGroup, { label: string; accent: string }> = {
  // Restrained, finance-appropriate accents so each family reads distinctly
  // without leaving the neutral theme.
  apar: { label: "AP / AR", accent: "#4f9dde" },
  close: { label: "Close & Reporting", accent: "#3f9a7f" },
  compliance: { label: "Compliance & Audit", accent: "#8a7fd0" },
};

const COPILOTS: Copilot[] = [
  {
    group: "apar",
    label: "AP / AR",
    title: "Invoice Processing & AP Approval Copilot",
    goal: "Validate supplier invoices, run a 3-way match, catch duplicates, and route them for approval.",
    persona: "AP Accountant",
    approver: "Controller",
    trigger: "A supplier emails an invoice to your AP inbox.",
    actions: [
      "Extracts line items, totals, and tax automatically",
      "Matches the invoice to its PO and goods receipt",
      "Flags duplicates and out-of-policy amounts",
      "Applies GL coding and routes for approval",
      "Writes a plain-language validation summary",
    ],
    value: [
      "No manual data entry",
      "Duplicate and overbilling caught before payment",
      "Faster approval cycles",
      "A clean, defensible audit trail",
    ],
    runtime: "2m 41s",
    trace: [
      { kind: "run", text: "connecting to AP inbox…" },
      { kind: "ok", text: "reading invoice_0417.pdf" },
      { kind: "ok", text: "matched vendor: Acme Supplies" },
      { kind: "ok", text: "3-way match: PO-2214 ✓ receipt ✓" },
      { kind: "ok", text: "no duplicate found" },
      { kind: "ok", text: "GL coded · validation summary ready" },
      { kind: "wait", text: "waiting on approval (Controller)" },
      { kind: "ok", text: "approved by A. Reyes" },
      { kind: "ok", text: "posted to QuickBooks · confirmation sent" },
      { kind: "done", text: "done in 2m 41s" },
    ],
  },
  {
    group: "apar",
    label: "AP / AR",
    title: "AR Collections & Dunning Copilot",
    goal: "Prioritize overdue receivables and draft personalized collection emails for your review.",
    persona: "AR Specialist",
    approver: "Controller",
    trigger: "An invoice passes its due date, or on your weekly AR run.",
    actions: [
      "Pulls the aging report and ranks accounts by risk",
      "Reconciles payments already received",
      "Drafts a tailored reminder per customer and stage",
      "Suggests next steps for high-risk accounts",
      "Logs every touch against the customer record",
    ],
    value: [
      "Lower DSO",
      "Consistent, on-time follow-up",
      "Less time chasing payments",
      "Earlier warning on at-risk accounts",
    ],
    runtime: "1m 48s",
    trace: [
      { kind: "run", text: "connecting to ERP…" },
      { kind: "ok", text: "aging report pulled · 37 open invoices" },
      { kind: "ok", text: "payments reconciled" },
      { kind: "ok", text: "12 reminders drafted by stage" },
      { kind: "ok", text: "2 accounts flagged high-risk" },
      { kind: "wait", text: "waiting on approval (Controller)" },
      { kind: "ok", text: "approved · reminders queued to send" },
      { kind: "done", text: "done in 1m 48s" },
    ],
  },
  {
    group: "apar",
    label: "AP / AR",
    title: "Vendor Onboarding & W-9 Copilot",
    goal: "Collect and verify new-vendor details, tax forms, and bank info before the first payment.",
    persona: "AP Accountant",
    approver: "Finance Manager",
    trigger: "A team member requests a new vendor be set up.",
    actions: [
      "Requests and reads the W-9 and banking details",
      "Validates TIN and checks for duplicate vendors",
      "Screens against sanctions and denied-party lists",
      "Drafts the vendor master record for review",
    ],
    value: [
      "Fewer payment errors and fraud risk",
      "No duplicate vendor records",
      "Faster, compliant onboarding",
      "Complete documentation on file",
    ],
    runtime: "2m 12s",
    trace: [
      { kind: "run", text: "connecting to email + ERP…" },
      { kind: "ok", text: "W-9 received and parsed" },
      { kind: "ok", text: "TIN validated · no duplicate vendor" },
      { kind: "ok", text: "sanctions screen clean" },
      { kind: "ok", text: "vendor record drafted" },
      { kind: "wait", text: "waiting on approval (Finance Manager)" },
      { kind: "done", text: "done in 2m 12s" },
    ],
  },
  {
    group: "close",
    label: "Close & Reporting",
    title: "Bank Reconciliation Copilot",
    goal: "Match bank transactions to your ledger and surface only the exceptions that need you.",
    persona: "Staff Accountant",
    approver: "Controller",
    trigger: "A bank feed syncs, or you start a period-end reconciliation.",
    actions: [
      "Pulls bank transactions and ledger entries",
      "Auto-matches by amount, date, and reference",
      "Groups and explains the unmatched exceptions",
      "Proposes journal entries for fees and interest",
      "Writes a reconciliation summary with the balance",
    ],
    value: [
      "Reconciliations in minutes, not hours",
      "Only true exceptions reach your desk",
      "Fewer month-end surprises",
      "A documented, reviewable match trail",
    ],
    runtime: "2m 20s",
    trace: [
      { kind: "run", text: "connecting to bank feed…" },
      { kind: "ok", text: "412 transactions pulled" },
      { kind: "ok", text: "398 auto-matched (96.6%)" },
      { kind: "ok", text: "14 exceptions grouped" },
      { kind: "ok", text: "2 fee entries proposed" },
      { kind: "wait", text: "waiting on approval (Controller)" },
      { kind: "ok", text: "approved · reconciliation closed" },
      { kind: "done", text: "done in 2m 20s" },
    ],
  },
  {
    group: "close",
    label: "Close & Reporting",
    title: "Month-End Close Copilot",
    goal: "Run the close checklist, prepare accruals and reconciliations, and track what's outstanding.",
    persona: "Financial Controller",
    approver: "CFO",
    trigger: "You kick off the close for the period.",
    actions: [
      "Works the close checklist task by task",
      "Prepares recurring accruals and prepaid schedules",
      "Reconciles key balance-sheet accounts",
      "Flags variances against prior period and budget",
      "Reports what's blocking the close in real time",
    ],
    value: [
      "A faster, more predictable close",
      "Nothing falls through the cracks",
      "Fewer late adjusting entries",
      "Clear status for the whole team",
    ],
    runtime: "4m 02s",
    trace: [
      { kind: "run", text: "loading close checklist…" },
      { kind: "ok", text: "18 of 24 tasks automated" },
      { kind: "ok", text: "accruals + prepaids prepared" },
      { kind: "ok", text: "balance-sheet accounts reconciled" },
      { kind: "ok", text: "3 variances flagged" },
      { kind: "wait", text: "waiting on approval (CFO)" },
      { kind: "done", text: "done in 4m 02s" },
    ],
  },
  {
    group: "close",
    label: "Close & Reporting",
    title: "Financial Reporting Copilot",
    goal: "Turn ledger data into an executive-ready report with variance commentary.",
    persona: "Financial Controller",
    approver: "CFO",
    trigger: "You choose a reporting period from the dashboard.",
    actions: [
      "Pulls the latest actuals and budget data",
      "Builds P&L, balance sheet, and cash flow",
      "Compares actuals against budget and prior period",
      "Flags unusual trends automatically",
      "Writes an executive summary in plain language",
    ],
    value: [
      "Faster board and management reporting",
      "Consistent, ready-to-send insights",
      "Less time in spreadsheets",
      "Earlier visibility into variances",
    ],
    runtime: "3m 05s",
    trace: [
      { kind: "run", text: "connecting to ERP…" },
      { kind: "ok", text: "actuals + budget pulled" },
      { kind: "ok", text: "P&L, BS, cash flow built" },
      { kind: "ok", text: "3 variances flagged with commentary" },
      { kind: "ok", text: "executive summary drafted" },
      { kind: "wait", text: "waiting on approval (CFO)" },
      { kind: "ok", text: "approved by J. Lin" },
      { kind: "done", text: "done in 3m 05s" },
    ],
  },
  {
    group: "compliance",
    label: "Compliance & Audit",
    title: "Expense Audit Copilot",
    goal: "Check employee expense claims against policy before you reimburse them.",
    persona: "Expense Auditor",
    approver: "Finance Manager",
    trigger: "An employee submits a receipt or expense report.",
    actions: [
      "Reads receipts and expense details automatically",
      "Verifies merchant, amount, and category",
      "Flags duplicate and split claims",
      "Checks each line against company policy",
      "Writes a short audit summary",
    ],
    value: [
      "Lower reimbursement fraud risk",
      "Policy applied the same way every time",
      "Faster reimbursements for employees",
      "Cleaner records for audit",
    ],
    runtime: "1m 22s",
    trace: [
      { kind: "run", text: "connecting to expense tool…" },
      { kind: "ok", text: "reading receipt_travel.jpg" },
      { kind: "ok", text: "merchant + amount extracted" },
      { kind: "ok", text: "no duplicate · policy check passed" },
      { kind: "ok", text: "audit summary ready" },
      { kind: "wait", text: "waiting on approval (Finance Manager)" },
      { kind: "ok", text: "approved · reimbursement queued" },
      { kind: "done", text: "done in 1m 22s" },
    ],
  },
  {
    group: "compliance",
    label: "Compliance & Audit",
    title: "Audit Preparation Copilot",
    goal: "Assemble the PBC list, pull support, and tie balances to source before the auditors arrive.",
    persona: "Assistant Controller",
    approver: "Controller",
    trigger: "You start prep for an external or internal audit.",
    actions: [
      "Builds the PBC request list from the trial balance",
      "Gathers invoices, statements, and contracts as support",
      "Ties account balances back to source documents",
      "Flags gaps and missing documentation",
      "Packages everything into an auditor-ready workpaper set",
    ],
    value: [
      "Weeks of prep compressed into days",
      "No last-minute document scrambles",
      "Every balance traceable to support",
      "A smoother, cheaper audit",
    ],
    runtime: "5m 30s",
    trace: [
      { kind: "run", text: "loading trial balance…" },
      { kind: "ok", text: "PBC list generated · 46 items" },
      { kind: "ok", text: "support gathered for 41 items" },
      { kind: "ok", text: "balances tied to source" },
      { kind: "ok", text: "5 gaps flagged for follow-up" },
      { kind: "wait", text: "waiting on approval (Controller)" },
      { kind: "done", text: "done in 5m 30s" },
    ],
  },
  {
    group: "compliance",
    label: "Compliance & Audit",
    title: "Sales Tax & Compliance Copilot",
    goal: "Check transactions for correct tax treatment and prepare filings for your review.",
    persona: "Tax Accountant",
    approver: "Controller",
    trigger: "On a filing deadline, or when new transactions sync.",
    actions: [
      "Reviews transactions for nexus and taxability",
      "Recalculates tax by jurisdiction",
      "Flags mis-charged or exempt transactions",
      "Prepares the return with supporting detail",
      "Summarizes what changed since last period",
    ],
    value: [
      "Lower risk of penalties and interest",
      "Consistent treatment across jurisdictions",
      "Filings prepared, not just calculated",
      "A documented compliance trail",
    ],
    runtime: "3m 14s",
    trace: [
      { kind: "run", text: "connecting to ERP…" },
      { kind: "ok", text: "transactions reviewed for nexus" },
      { kind: "ok", text: "tax recalculated by jurisdiction" },
      { kind: "ok", text: "4 mis-charged transactions flagged" },
      { kind: "ok", text: "return prepared with detail" },
      { kind: "wait", text: "waiting on approval (Controller)" },
      { kind: "done", text: "done in 3m 14s" },
    ],
  },
];

// ---------------- Integrations (accounting-focused) ----------------

type LandingIntegrationCategory =
  | "ERP & Accounting"
  | "Payments & Banking"
  | "Expense & Cards"
  | "Docs & Comms";

type LandingIntegration = {
  slug: string;
  name: string;
  domain: string;
  category: LandingIntegrationCategory;
  logo?: string;
};

const INTEGRATION_CATEGORIES: LandingIntegrationCategory[] = [
  "ERP & Accounting",
  "Payments & Banking",
  "Expense & Cards",
  "Docs & Comms",
];

const LANDING_INTEGRATIONS: LandingIntegration[] = [
  // ERP & Accounting
  { slug: "netsuite", name: "NetSuite", domain: "netsuite.com", category: "ERP & Accounting" },
  { slug: "sap", name: "SAP", domain: "sap.com", category: "ERP & Accounting" },
  { slug: "oracle-fusion-ebs", name: "Oracle Fusion / EBS", domain: "oracle.com", category: "ERP & Accounting" },
  { slug: "dynamics-365-finance", name: "Microsoft Dynamics 365 Finance", domain: "microsoft.com", category: "ERP & Accounting" },
  { slug: "workday-financials", name: "Workday Financials", domain: "workday.com", category: "ERP & Accounting" },
  { slug: "sage-intacct", name: "Sage Intacct", domain: "sageintacct.com", category: "ERP & Accounting" },
  { slug: "blackline", name: "BlackLine", domain: "blackline.com", category: "ERP & Accounting" },

  // Payments & Banking
  { slug: "bill", name: "BILL.com", domain: "bill.com", category: "Payments & Banking" },

  // Expense & Cards
  { slug: "coupa", name: "Coupa", domain: "coupa.com", category: "Expense & Cards" },
  { slug: "concur", name: "SAP Concur", domain: "concur.com", category: "Expense & Cards" },

  // Docs & Comms
  { slug: "salesforce", name: "Salesforce", domain: "salesforce.com", category: "Docs & Comms" },
  { slug: "microsoft-365-excel", name: "Microsoft 365 / Excel", domain: "microsoft.com", category: "Docs & Comms" },
];

// ---------------- Page ----------------

function Index() {
  // The landing page owns its own theme state (light/dark) via the shared
  // ThemeProvider, so the toggle in the nav can switch the whole marketing page.
  return (
    <ThemeProvider>
      <IndexContent />
    </ThemeProvider>
  );
}

function IndexContent() {
  const [authOpen, setAuthOpen] = useState(false);
  const navigate = useNavigate();
  const { theme } = useTheme();

  const onAuthenticated = () => {
    // The app is scoped to accounting.
    setStoredIndustry("accounting");
    navigate({ to: "/app" });
  };

  const onBookDemo = () => navigate({ to: "/demo" });

  return (
    <div
      className={cn(
        "landing-root min-h-screen bg-background text-foreground",
        theme === "dark" && "dark",
      )}
    >
      <Nav onLogin={() => setAuthOpen(true)} onBookDemo={onBookDemo} />
      <Hero onBookDemo={onBookDemo} />
      <WhyUs />
      <FlowDiagram />
      <LandingWorkflows />
      <AboutSection onBookDemo={onBookDemo} />
      <IntegrationCatalog />
      <CopilotLibrary />
      <CoreDiagram />
      <PlatformGrid />
      <CTASection onBookDemo={onBookDemo} />
      <Footer />
      {authOpen && (
        <AuthModal onClose={() => setAuthOpen(false)} onAuthenticated={onAuthenticated} />
      )}
    </div>
  );
}

// ---------------- Scroll-reveal wrapper ----------------

// Wraps children in a scroll-triggered reveal. `pop` uses a slight scale-in.
function Reveal({
  children,
  className,
  delay = 0,
  pop = false,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  pop?: boolean;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={cn(pop ? "reveal-pop" : "reveal", inView && "in-view", className)}
      style={{ transitionDelay: inView ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

// ---------------- Wired data-flow diagram ----------------

type FlowNode = { id: string; label: string; sub: string; icon: LucideIcon; y: number };

const FLOW_SOURCES: FlowNode[] = [
  { id: "bank", label: "Bank Feeds", sub: "Plaid · Mercury", icon: Landmark, y: 26 },
  { id: "inbox", label: "AP Inbox", sub: "Vendor invoices", icon: Mail, y: 104 },
  { id: "receipts", label: "Receipts", sub: "Cards & expenses", icon: Receipt, y: 182 },
  { id: "docs", label: "Invoices & POs", sub: "PDFs, scans", icon: FileText, y: 260 },
];

const FLOW_OUTPUTS: FlowNode[] = [
  { id: "journal", label: "Journal Entries", sub: "Posted to your ERP", icon: ScrollText, y: 26 },
  { id: "recon", label: "Reconciliation", sub: "Matched & cleared", icon: Workflow, y: 104 },
  { id: "reports", label: "Reports", sub: "P&L · BS · cash flow", icon: BarChart3, y: 182 },
  { id: "approvals", label: "Approvals", sub: "Human sign-off", icon: CheckCircle2, y: 260 },
];

const FLOW_DETAIL: Record<string, string> = {
  bank: "Live bank transactions stream in for matching and cash application — no CSV exports.",
  inbox: "Vendor invoices land in your AP inbox and are read, coded, and matched automatically.",
  receipts: "Card charges and employee receipts are captured and audited against policy.",
  docs: "PDFs, scans, and photos are turned into structured, ledger-ready data with confidence scores.",
  core: "The accounting core reads every document, runs the 3-way match and reconciliation, applies your controls, and drafts each entry — nothing posts without approval.",
  journal: "Approved journal entries are written straight back to QuickBooks, Xero, or NetSuite.",
  recon: "Bank, AP, and AR activity is auto-matched; only true exceptions reach your desk.",
  reports: "Statements and variance commentary are generated on demand, ready to review and send.",
  approvals: "Every drafted action routes to the right approver before it touches the ledger.",
};

const FLOW_W = 900;
const CARD_W = 168;
const CARD_H = 56;
const CORE = { left: 366, top: 132, w: 168, h: 96 };

function FlowDiagram() {
  const [active, setActive] = useState<string | null>(null);
  const { ref, inView } = useInView<HTMLDivElement>();

  const srcRightX = 24 + CARD_W;
  const coreLeftX = CORE.left;
  const coreRightX = CORE.left + CORE.w;
  const outLeftX = FLOW_W - 24 - CARD_W;
  const coreCY = CORE.top + CORE.h / 2;

  const wireIn = (n: FlowNode) => {
    const y1 = n.y + CARD_H / 2;
    const dx = (coreLeftX - srcRightX) / 2;
    return `M ${srcRightX} ${y1} C ${srcRightX + dx} ${y1}, ${coreLeftX - dx} ${coreCY}, ${coreLeftX} ${coreCY}`;
  };
  const wireOut = (n: FlowNode) => {
    const y2 = n.y + CARD_H / 2;
    const dx = (outLeftX - coreRightX) / 2;
    return `M ${coreRightX} ${coreCY} C ${coreRightX + dx} ${coreCY}, ${outLeftX - dx} ${y2}, ${outLeftX} ${y2}`;
  };

  const isActive = (side: "in" | "out", id: string) =>
    active === null || active === "core" || active === id
      ? true
      : side === "in"
        ? FLOW_SOURCES.some((s) => s.id === active)
          ? active === id
          : false
        : FLOW_OUTPUTS.some((o) => o.id === active)
          ? active === id
          : false;

  return (
    <section className="relative border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            The data flow
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Your systems in. Reviewed, posted entries out.
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Every source connects into one accounting core that reads, matches, and drafts — then
            writes approved entries back. Tap any node to see what it does.
          </p>
        </Reveal>

        <Reveal pop>
          <div className="no-scrollbar overflow-x-auto rounded-2xl border border-border bg-surface p-4 md:p-6">
            <div
              ref={ref}
              className="relative mx-auto"
              style={{ width: FLOW_W, height: CORE.top + CORE.h + 60 }}
            >
              {/* column captions */}
              <div className="absolute left-6 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Sources
              </div>
              <div
                className="absolute font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                style={{ left: CORE.left, width: CORE.w, textAlign: "center", top: 0 }}
              >
                AI Core
              </div>
              <div
                className="absolute font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
                style={{ right: 24, top: 0 }}
              >
                Outputs
              </div>

              {/* wires */}
              <svg
                className="absolute inset-0"
                width={FLOW_W}
                height={CORE.top + CORE.h + 60}
                fill="none"
              >
                {FLOW_SOURCES.map((s) => {
                  const on = isActive("in", s.id);
                  return (
                    <path
                      key={`in-${s.id}`}
                      d={wireIn(s)}
                      className={cn(
                        on ? "stroke-primary" : "stroke-border",
                        inView && on && "wire-flow",
                      )}
                      strokeWidth={on ? 2 : 1.25}
                      strokeOpacity={on ? 0.9 : 0.5}
                    />
                  );
                })}
                {FLOW_OUTPUTS.map((o) => {
                  const on = isActive("out", o.id);
                  return (
                    <path
                      key={`out-${o.id}`}
                      d={wireOut(o)}
                      className={cn(
                        on ? "stroke-primary" : "stroke-border",
                        inView && on && "wire-flow",
                      )}
                      strokeWidth={on ? 2 : 1.25}
                      strokeOpacity={on ? 0.9 : 0.5}
                    />
                  );
                })}
              </svg>

              {/* source nodes */}
              {FLOW_SOURCES.map((n) => (
                <FlowCard
                  key={n.id}
                  node={n}
                  left={24}
                  active={active === n.id}
                  onClick={() => setActive((c) => (c === n.id ? null : n.id))}
                />
              ))}

              {/* core */}
              <button
                type="button"
                onClick={() => setActive((c) => (c === "core" ? null : "core"))}
                style={{ left: CORE.left, top: CORE.top, width: CORE.w, height: CORE.h }}
                className={cn(
                  "brand-gradient absolute grid place-items-center rounded-2xl text-primary-foreground shadow-lg shadow-primary/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
                  active === "core" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "core-pulse",
                )}
              >
                <Sparkles className="h-6 w-6" />
                <span className="mt-1 text-sm font-semibold">Accounting Core</span>
                <span className="text-[10px] opacity-80">read · match · draft</span>
              </button>

              {/* output nodes */}
              {FLOW_OUTPUTS.map((n) => (
                <FlowCard
                  key={n.id}
                  node={n}
                  left={outLeftX}
                  active={active === n.id}
                  onClick={() => setActive((c) => (c === n.id ? null : n.id))}
                />
              ))}
            </div>
          </div>
        </Reveal>

        {/* detail caption */}
        <div className="mt-4 flex min-h-[2.5rem] items-center justify-center rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-center text-sm text-muted-foreground">
          {active ? (
            <span className="text-foreground/90">{FLOW_DETAIL[active]}</span>
          ) : (
            <span>Tap a source, the core, or an output to trace what happens at each step.</span>
          )}
        </div>
      </div>
    </section>
  );
}

function FlowCard({
  node,
  left,
  active,
  onClick,
}: {
  node: FlowNode;
  left: number;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = node.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ left, top: node.y, width: CARD_W, height: CARD_H }}
      className={cn(
        "absolute flex items-center gap-3 rounded-xl border bg-card px-3 text-left shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        active
          ? "border-primary ring-1 ring-primary/40"
          : "border-border hover:-translate-y-0.5 hover:border-primary/50",
      )}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">{node.label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{node.sub}</span>
      </span>
    </button>
  );
}

// ---------------- Why us ----------------

const WHY_US: { icon: LucideIcon; title: string; desc: string; featured?: boolean }[] = [
  {
    icon: Users,
    title: "Built for Accountants",
    desc: "Purpose-built for how finance teams work — GL coding, controls, and audit trails baked into every workflow.",
  },
  {
    icon: Cpu,
    title: "AI at the Core",
    desc: "Copilots automate the busywork across your ledger using cutting-edge document AI.",
    featured: true,
  },
  {
    icon: BadgeDollarSign,
    title: "Transparent Pricing",
    desc: "Flat monthly pricing tuned to your volume — no hidden fees, no surprises.",
  },
  {
    icon: Gauge,
    title: "Accuracy & Compliance",
    desc: "Policy checks and validations on every entry, so nothing posts out of line.",
  },
  {
    icon: Lock,
    title: "Confidentiality & Security",
    desc: "Bank-grade encryption, role-based access, and SOC 2 controls protect your data.",
  },
  {
    icon: LifeBuoy,
    title: "Support When You Need It",
    desc: "Reach our team over email, Slack, and Microsoft Teams — plus docs and in-app help.",
  },
];

function WhyUs() {
  return (
    <section id="why-us" className="relative overflow-hidden border-b border-border/60 py-20">
      <FinanceGlyphs />
      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mb-12 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Why us</span>
          <h2 className="mx-auto mt-2 max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Why finance teams choose us
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Expert accountants, modern automation, and the controls your close requires — under one
            roof.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_US.map((w, i) => {
            const Icon = w.icon;
            return (
              <Reveal key={w.title} pop delay={(i % 3) * 90}>
                <div
                  className={cn(
                    "flex h-full flex-col rounded-2xl border p-6 transition duration-300 hover:-translate-y-1",
                    w.featured
                      ? "brand-gradient border-transparent text-primary-foreground shadow-lg shadow-primary/30"
                      : "border-border bg-surface hover:border-primary/40 hover:shadow-md",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-xl",
                      w.featured
                        ? "bg-white/15 text-primary-foreground"
                        : "bg-primary/10 text-primary ring-1 ring-primary/15",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{w.title}</h3>
                  <p
                    className={cn(
                      "mt-1.5 text-sm leading-relaxed",
                      w.featured ? "text-primary-foreground/85" : "text-muted-foreground",
                    )}
                  >
                    {w.desc}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------------- Our services (teal band) ----------------

const SERVICES: { icon: LucideIcon; title: string; points: string[] }[] = [
  { icon: FileText, title: "Bookkeeping", points: ["Bank reconciliation", "Departmental bookkeeping", "Chart-of-accounts setup"] },
  { icon: Landmark, title: "Payroll", points: ["Payroll processing", "Compliance & filings", "Year-end T4 / W-2"] },
  { icon: BarChart3, title: "Financial Reporting", points: ["Personalized reports", "P&L statements", "Balance sheet"] },
  { icon: Receipt, title: "Accounts Payable & Receivable", points: ["Invoice processing", "3-way match", "Collections & dunning"] },
  { icon: ShieldCheck, title: "Tax & Compliance", points: ["Sales-tax filings", "Nexus review", "Audit preparation"] },
  { icon: Workflow, title: "Advisory", points: ["Cash-flow forecasting", "Month-end close", "Board reporting"] },
];

function ServicesBand() {
  return (
    <section id="services" className="relative overflow-hidden brand-gradient py-20 text-primary-foreground">
      <FinanceGlyphs onTeal />
      <div className="relative mx-auto max-w-7xl px-5">
        <Reveal className="mb-10 flex flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary-foreground/80">
            Coverage
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            One platform for every accounting workflow
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.title} pop delay={(i % 3) * 90}>
                <div className="flex h-full flex-col rounded-2xl border border-border bg-surface p-6 text-foreground shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{s.title}</h3>
                  <ul className="mt-3 space-y-2">
                    {s.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="#copilots"
            className="inline-flex items-center gap-1.5 rounded-lg bg-surface px-6 py-3 text-sm font-semibold text-primary shadow-sm transition hover:-translate-y-0.5"
          >
            View all copilots
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

// ---------------- About ----------------

const ABOUT_POINTS = [
  "Designed with CPAs and controllers, for real accounting work",
  "Configurable to your chart of accounts and close process",
  "Your team reviews and approves before anything posts",
];

function AboutSection({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section id="about" className="border-b border-border/60 py-20">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 lg:grid-cols-2">
        {/* Copy */}
        <Reveal>
          <span className="font-mono text-xs uppercase tracking-wider text-primary">About us</span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Built by accountants, for accountants
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            Our copilots handle the busywork across AP/AR, reconciliation, and the month-end close,
            so your team can focus on the work that matters. Everything is configurable to your
            ledger — with a full audit trail on every action.
          </p>
          <ul className="mt-5 space-y-2.5">
            {ABOUT_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
          <button
            onClick={onBookDemo}
            className="brand-gradient mt-7 inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:-translate-y-0.5"
          >
            Read more
            <ArrowRight className="h-4 w-4" />
          </button>
        </Reveal>

        {/* Framed visual (teal L-brackets, like the reference) */}
        <Reveal pop className="relative mx-auto w-full max-w-md">
          <span
            aria-hidden
            className="absolute -right-3 -top-3 h-24 w-24 rounded-tr-2xl border-r-2 border-t-2 border-primary"
          />
          <span
            aria-hidden
            className="absolute -bottom-3 -left-3 h-24 w-24 rounded-bl-2xl border-b-2 border-l-2 border-primary"
          />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="grid-bg flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <span className="brand-gradient grid h-7 w-7 place-items-center rounded-md text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </span>
                <span className="text-sm font-semibold">This month at a glance</span>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                On track
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              {[
                { k: "Revenue", v: "$1.28M", s: "+12% MoM" },
                { k: "Expenses", v: "$842K", s: "−3% MoM" },
                { k: "Net margin", v: "34.2%", s: "+1.8 pts" },
                { k: "Days to close", v: "4.1", s: "−2.4 days" },
              ].map((m) => (
                <div key={m.k} className="rounded-xl border border-border bg-card p-3">
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{m.k}</div>
                  <div className="mt-1 text-lg font-semibold tabular-nums">{m.v}</div>
                  <div className="text-[11px] font-medium text-emerald-500">{m.s}</div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- Workflows (same as the in-app Workflows page) ----------------

type WfStepKind = "trigger" | "extract" | "match" | "validate" | "approve" | "output";
type WfStep = { label: string; system: string; kind: WfStepKind };
type LandingWf = { id: string; name: string; flow: WfStep[] };

const WF_KIND: Record<WfStepKind, { label: string; dot: string; ring: string; text: string }> = {
  trigger: { label: "Trigger", dot: "bg-amber-400", ring: "border-amber-400/50", text: "text-amber-400" },
  extract: { label: "Extract", dot: "bg-sky-400", ring: "border-sky-400/50", text: "text-sky-400" },
  match: { label: "Match", dot: "bg-cyan-400", ring: "border-cyan-400/50", text: "text-cyan-400" },
  validate: { label: "Validate", dot: "bg-violet-400", ring: "border-violet-400/50", text: "text-violet-400" },
  approve: { label: "Approve", dot: "bg-indigo-400", ring: "border-indigo-400/50", text: "text-indigo-400" },
  output: { label: "Output", dot: "bg-emerald-400", ring: "border-emerald-400/50", text: "text-emerald-400" },
};

const LANDING_WORKFLOWS: LandingWf[] = [
  {
    id: "wf_invoice_0417",
    name: "Invoice Processing & AP Approval",
    flow: [
      { label: "Invoice arrives", system: "AP Inbox", kind: "trigger" },
      { label: "Extract line items", system: "Document AI", kind: "extract" },
      { label: "3-way match", system: "QuickBooks", kind: "match" },
      { label: "GL coding + policy", system: "Rules Engine", kind: "validate" },
      { label: "Controller approval", system: "Approvals", kind: "approve" },
      { label: "Post journal entry", system: "QuickBooks", kind: "output" },
    ],
  },
  {
    id: "wf_bankrec_jun",
    name: "Bank Reconciliation",
    flow: [
      { label: "Bank feed syncs", system: "Mercury Bank", kind: "trigger" },
      { label: "Pull transactions", system: "Bank Feed", kind: "extract" },
      { label: "Auto-match ledger", system: "Core Banking", kind: "match" },
      { label: "Group exceptions", system: "Recon Engine", kind: "validate" },
      { label: "Controller approval", system: "Approvals", kind: "approve" },
      { label: "Close reconciliation", system: "Ledger", kind: "output" },
    ],
  },
  {
    id: "wf_close_jul",
    name: "Month-End Close",
    flow: [
      { label: "Kick off close", system: "Scheduler", kind: "trigger" },
      { label: "Work checklist", system: "Close Engine", kind: "extract" },
      { label: "Prepare accruals", system: "NetSuite", kind: "match" },
      { label: "Reconcile accounts", system: "Core Banking", kind: "validate" },
      { label: "CFO approval", system: "Approvals", kind: "approve" },
      { label: "Lock period", system: "Ledger", kind: "output" },
    ],
  },
  {
    id: "wf_ar_dunning",
    name: "AR Collections & Dunning",
    flow: [
      { label: "Invoice overdue", system: "QuickBooks", kind: "trigger" },
      { label: "Rank by risk", system: "AR Engine", kind: "extract" },
      { label: "Reconcile payments", system: "Bank Feed", kind: "match" },
      { label: "Draft reminders", system: "Document AI", kind: "validate" },
      { label: "Controller approval", system: "Approvals", kind: "approve" },
      { label: "Queue emails", system: "CRM", kind: "output" },
    ],
  },
  {
    id: "wf_expense_118",
    name: "Expense Audit",
    flow: [
      { label: "Expense submitted", system: "Expense Tool", kind: "trigger" },
      { label: "Read receipts", system: "Document AI", kind: "extract" },
      { label: "Policy check", system: "Rules Engine", kind: "validate" },
      { label: "Finance approval", system: "Approvals", kind: "approve" },
      { label: "Reimburse", system: "Payroll", kind: "output" },
    ],
  },
  {
    id: "wf_vendor_nucor",
    name: "Vendor Onboarding & W-9",
    flow: [
      { label: "New vendor request", system: "Email", kind: "trigger" },
      { label: "Read W-9", system: "Document AI", kind: "extract" },
      { label: "Validate TIN + sanctions", system: "Compliance", kind: "validate" },
      { label: "Finance approval", system: "Approvals", kind: "approve" },
      { label: "Create vendor record", system: "NetSuite", kind: "output" },
    ],
  },
  {
    id: "wf_salestax_q2",
    name: "Sales Tax & Compliance",
    flow: [
      { label: "Filing deadline", system: "Scheduler", kind: "trigger" },
      { label: "Review nexus", system: "NetSuite", kind: "extract" },
      { label: "Recalculate tax", system: "Tax Engine", kind: "match" },
      { label: "Prepare return", system: "Document AI", kind: "validate" },
      { label: "Controller approval", system: "Approvals", kind: "approve" },
      { label: "File return", system: "Tax Portal", kind: "output" },
    ],
  },
  {
    id: "wf_report_jun",
    name: "Financial Reporting",
    flow: [
      { label: "Select period", system: "Dashboard", kind: "trigger" },
      { label: "Pull actuals + budget", system: "NetSuite", kind: "extract" },
      { label: "Build statements", system: "Reporting Engine", kind: "match" },
      { label: "Variance commentary", system: "Document AI", kind: "validate" },
      { label: "CFO approval", system: "Approvals", kind: "approve" },
      { label: "Publish report", system: "Reporting", kind: "output" },
    ],
  },
];

// Flow-graph geometry (mirrors the in-app Workflows page).
const WF_STEP_W = 138;
const WF_STEP_H = 52;
const WF_SYS_W = 116;
const WF_SYS_H = 36;
const WF_STEP_Y = 88;
const WF_SYS_Y = 258;
const WF_PAD = 24;
const WF_STEP_GAP = 168;

function LandingWorkflows() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = LANDING_WORKFLOWS.find((w) => w.id === activeId) ?? null;

  return (
    <section id="workflow" className="border-b border-border/60 bg-surface-2/40 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">Workflows</span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Watch a workflow run end to end
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            The same workflows that run inside the app. Pick one to trace every step and the systems
            it connects.
          </p>
        </Reveal>

        {/* Compact workflow boxes — click one to open its flow in a popup */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LANDING_WORKFLOWS.map((w) => {
            const systems = new Set(w.flow.map((s) => s.system)).size;
            return (
              <Reveal key={w.id} pop>
                <button
                  onClick={() => setActiveId(w.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
                    <Workflow className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">{w.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {w.flow.length} steps · {systems} systems
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              </Reveal>
            );
          })}
        </div>
      </div>

      {active && <WorkflowModal wf={active} onClose={() => setActiveId(null)} />}
    </section>
  );
}

function WorkflowModal({ wf, onClose }: { wf: LandingWf; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${wf.name} workflow`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between gap-4 border-b border-border bg-surface px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="brand-gradient grid h-8 w-8 place-items-center rounded-lg text-primary-foreground shadow-sm shadow-primary/25">
              <Workflow className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold tracking-tight">{wf.name}</h3>
              <p className="font-mono text-[11px] text-muted-foreground">{wf.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Flow */}
        <div className="nice-scroll overflow-x-auto p-6">
          <LandingWorkflowGraph flow={wf.flow} />
        </div>
      </div>
    </div>
  );
}

function LandingWorkflowGraph({ flow }: { flow: WfStep[] }) {
  const stepX = flow.map((_, i) => WF_PAD + WF_STEP_W / 2 + i * WF_STEP_GAP);
  const canvasW = WF_PAD * 2 + WF_STEP_W + (flow.length - 1) * WF_STEP_GAP;
  const systems = Array.from(new Set(flow.map((s) => s.system)));
  const sysX = (name: string) => {
    const i = systems.indexOf(name);
    if (systems.length === 1) return canvasW / 2;
    const usable = canvasW - WF_PAD * 2 - WF_SYS_W;
    return WF_PAD + WF_SYS_W / 2 + (i * usable) / (systems.length - 1);
  };
  const seqPath = (i: number) => {
    const x1 = stepX[i] + WF_STEP_W / 2;
    const x2 = stepX[i + 1] - WF_STEP_W / 2;
    const dx = (x2 - x1) / 2;
    return `M ${x1} ${WF_STEP_Y} C ${x1 + dx} ${WF_STEP_Y}, ${x2 - dx} ${WF_STEP_Y}, ${x2} ${WF_STEP_Y}`;
  };
  const downPath = (i: number, name: string) => {
    const x1 = stepX[i];
    const y1 = WF_STEP_Y + WF_STEP_H / 2;
    const x2 = sysX(name);
    const y2 = WF_SYS_Y - WF_SYS_H / 2;
    const dy = (y2 - y1) / 2;
    return `M ${x1} ${y1} C ${x1} ${y1 + dy}, ${x2} ${y2 - dy}, ${x2} ${y2}`;
  };
  const CANVAS_H = WF_SYS_Y + WF_SYS_H / 2 + 28;

  return (
    <div className="mx-auto" style={{ width: canvasW }}>
      <div className="relative" style={{ width: canvasW, height: CANVAS_H + 24 }}>
        <div className="absolute left-0 top-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Flow
        </div>
        <div
          className="absolute left-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground"
          style={{ top: WF_SYS_Y - WF_SYS_H / 2 - 42 }}
        >
          Connectors
        </div>

        <svg className="absolute inset-0" width={canvasW} height={CANVAS_H + 24} fill="none">
          {flow.slice(0, -1).map((_, i) => (
            <path key={`seq-${i}`} d={seqPath(i)} className="stroke-primary/70" strokeWidth={1.75} />
          ))}
          {flow.map((s, i) => (
            <path key={`down-${i}`} d={downPath(i, s.system)} className="stroke-primary/25" strokeWidth={1.25} />
          ))}
        </svg>

        {flow.map((s, i) => {
          const meta = WF_KIND[s.kind];
          return (
            <div
              key={`step-${i}`}
              style={{ left: stepX[i] - WF_STEP_W / 2, top: WF_STEP_Y - WF_STEP_H / 2, width: WF_STEP_W, height: WF_STEP_H }}
              className={cn("absolute flex flex-col justify-center rounded-md border bg-card px-2.5 shadow-sm", meta.ring)}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-semibold text-background", meta.dot)}>
                  {i + 1}
                </span>
                <span className="truncate text-[11px] font-semibold text-foreground">{s.label}</span>
              </div>
              <span className={cn("mt-0.5 pl-[22px] text-[9px] font-medium uppercase tracking-wide", meta.text)}>
                {meta.label}
              </span>
            </div>
          );
        })}

        {systems.map((name) => (
          <div
            key={`sys-${name}`}
            style={{ left: sysX(name) - WF_SYS_W / 2, top: WF_SYS_Y - WF_SYS_H / 2, width: WF_SYS_W, height: WF_SYS_H }}
            className="absolute flex items-center gap-1.5 rounded-md border border-orange-400/50 bg-card px-2.5 shadow-sm"
          >
            <Plug className="h-3 w-3 shrink-0 text-orange-400" />
            <span className="truncate text-[11px] font-medium text-foreground">{name}</span>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {(Object.keys(WF_KIND) as WfStepKind[]).map((k) => (
          <span key={k} className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
            <span className={cn("h-2 w-2 rounded-full", WF_KIND[k].dot)} />
            {WF_KIND[k].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          Connector
        </span>
      </div>
    </div>
  );
}

// ---------------- Nav ----------------

function Nav({ onLogin, onBookDemo }: { onLogin: () => void; onBookDemo: () => void }) {
  const { theme, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5">
        <a href="#" className="flex items-center">
          <LogoLockup className="ml-2" />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#why-us" className="transition hover:text-foreground">
            Why us
          </a>
          <a href="#services" className="transition hover:text-foreground">
            Services
          </a>
          <a href="#about" className="transition hover:text-foreground">
            About
          </a>
          <a href="#copilots" className="transition hover:text-foreground">
            Copilots
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={onLogin}
            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            Log in
          </button>
          <button
            onClick={onBookDemo}
            className="brand-gradient rounded-lg px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/30 transition hover:opacity-90"
          >
            Book a demo
          </button>
        </div>
      </div>
    </header>
  );
}

// ---------------- Hero ----------------

// Decorative finance motifs — faint charts, cards, coins, and currency icons that
// sit behind a section's content (pointer-events-none) to give a fintech identity
// without affecting layout. Set `onTeal` when the section has a teal background.
function FinanceGlyphs({ onTeal = false }: { onTeal?: boolean }) {
  const tone = onTeal ? "text-primary-foreground/10" : "text-primary/[0.07]";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <CreditCard className={cn("absolute left-[4%] top-[20%] h-16 w-16 -rotate-12", tone)} />
      <PieChart className={cn("absolute right-[7%] top-[16%] h-14 w-14", tone)} />
      <Coins className={cn("absolute left-[13%] bottom-[16%] h-12 w-12", tone)} />
      <Percent className={cn("absolute right-[15%] bottom-[26%] h-9 w-9", tone)} />
      <Banknote className={cn("absolute left-[46%] top-[12%] h-12 w-12 rotate-6", tone)} />
      <TrendingUp className={cn("absolute right-[40%] bottom-[14%] h-12 w-12", tone)} />
      <ArrowLeftRight className={cn("absolute left-[28%] bottom-[34%] h-9 w-9", tone)} />
    </div>
  );
}

// A faint upward "market line" chart, drawn edge-to-edge along the bottom of a section.
function MarketLine({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={cn("pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full", className)}
      viewBox="0 0 1200 160"
      preserveAspectRatio="none"
      fill="none"
    >
      <polyline
        points="0,120 90,104 180,112 270,74 360,92 450,54 540,68 630,34 720,58 810,28 900,44 990,18 1080,36 1200,14"
        stroke="currentColor"
        strokeWidth="2"
      />
      <polyline
        points="0,140 90,132 180,136 270,116 360,124 450,104 540,112 630,92 720,104 810,86 900,96 990,78 1080,90 1200,72"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.6"
        strokeDasharray="4 5"
      />
    </svg>
  );
}

const HERO_TRUST: { icon: LucideIcon; label: string }[] = [
  { icon: Landmark, label: "Works with QuickBooks, Xero & NetSuite" },
  { icon: ShieldCheck, label: "Human approval before anything posts" },
  { icon: ScrollText, label: "Full audit trail on every action" },
];

function Hero({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      {/* Decorative layer is clipped on its own so it never overflows the section. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Full-section background image — auto-switches with the active theme. */}
        <img
          src="/Background-light.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-center dark:hidden"
        />
        <img
          src="/Background-dark.png"
          alt=""
          className="absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background/80 dark:from-background/40 dark:via-background/30 dark:to-background/80" />
        <div className="absolute -top-44 left-1/2 h-[30rem] w-[60rem] -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-primary-2/20 blur-3xl" />
        {/* faint finance motifs — left side, clear of the product card */}
        <Coins className="absolute left-[3%] top-[20%] h-10 w-10 text-primary/[0.08]" />
        <PieChart className="absolute left-[16%] top-[12%] hidden h-12 w-12 text-primary/[0.07] lg:block" />
        <CreditCard className="absolute bottom-[24%] left-[6%] h-14 w-14 -rotate-12 text-primary/[0.07]" />
        <Percent className="absolute bottom-[16%] left-[24%] hidden h-8 w-8 text-primary/[0.08] lg:block" />
        <MarketLine className="text-primary/[0.08]" />
      </div>
      <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          {/* Left — copy */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Built for CFOs, controllers & finance teams
            </div>
            <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl">
              {HERO.tagline}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground md:text-lg">
              {HERO.sub}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onBookDemo}
                className="brand-gradient inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Book a demo
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#copilots"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                See the copilots
              </a>
            </div>

            {/* trust chips */}
            <div className="mt-8 flex flex-wrap gap-2">
              {HERO_TRUST.map((t) => {
                const Icon = t.icon;
                return (
                  <span
                    key={t.label}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted-foreground"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {t.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Right — close dashboard preview */}
          <HeroPreview />
        </div>
      </div>
    </section>
  );
}

// A realistic "month-end close" product preview — the accounting touch: dollar
// KPIs, a live reconciliation match list, and a drafted journal entry.
function HeroPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[28px] bg-primary/10 blur-2xl"
      />


      <div className="relative rounded-2xl border border-border bg-surface shadow-2xl">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md brand-gradient text-primary-foreground">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-sm font-semibold">Month-end close</span>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
        </div>

        <div className="space-y-4 p-4">
          {/* KPI tiles */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Cash", value: "$482,190", tone: "text-foreground" },
              { label: "Auto-matched", value: "96.6%", tone: "text-emerald-500" },
              { label: "To approve", value: "5", tone: "text-amber-500" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl border border-border bg-card p-3">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {k.label}
                </div>
                <div className={cn("mt-1 text-lg font-semibold tabular-nums", k.tone)}>
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          {/* Reconciliation match list */}
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Bank reconciliation
              </span>
              <span className="text-[10px] text-muted-foreground">398 / 412 matched</span>
            </div>
            <ul className="space-y-1.5">
              {[
                { d: "ACME SUPPLIES — INV AC-2214", a: "$14,280.00", ok: true },
                { d: "DEPOSIT — STRIPE PAYOUT", a: "$8,412.09", ok: true },
                { d: "BANK FEE — WIRE", a: "$45.00", ok: false },
              ].map((r) => (
                <li key={r.d} className="flex items-center justify-between gap-3 text-[12px]">
                  <span className="flex min-w-0 items-center gap-2">
                    {r.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    )}
                    <span className="truncate font-mono text-muted-foreground">{r.d}</span>
                  </span>
                  <span className="shrink-0 font-mono tabular-nums text-foreground">{r.a}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Drafted journal entry */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-primary">
                Drafted journal entry
              </span>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider text-amber-500">
                Needs approval
              </span>
            </div>
            <table className="w-full text-[12px]">
              <tbody className="font-mono">
                <tr>
                  <td className="py-0.5 text-foreground/90">Inventory — Materials</td>
                  <td className="py-0.5 text-right tabular-nums text-emerald-500">$12,900.00</td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">—</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-foreground/90">Sales Tax Payable</td>
                  <td className="py-0.5 text-right tabular-nums text-emerald-500">$1,200.00</td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">—</td>
                </tr>
                <tr>
                  <td className="py-0.5 text-foreground/90">Accounts Payable — Acme</td>
                  <td className="py-0.5 text-right tabular-nums text-muted-foreground">—</td>
                  <td className="py-0.5 text-right tabular-nums text-sky-500">$14,280.00</td>
                </tr>
              </tbody>
            </table>
            <div className="mt-3 flex items-center gap-2">
              <button className="brand-gradient inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve & post
              </button>
              <button className="rounded-md border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
                Review
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- Core diagram ----------------

type CoreCapability = {
  name: string;
  icon: LucideIcon;
  desc: string;
  detail: string;
  points: string[];
};

const CORE_CAPABILITIES: CoreCapability[] = [
  {
    name: "Document Intelligence",
    icon: FileText,
    desc: "Reads invoices, receipts, and statements, then extracts clean, structured data.",
    detail:
      "Turns any inbound document — PDFs, scans, or phone photos — into structured, ledger-ready data without manual keying. Every field comes with a confidence score, so low-confidence extractions are flagged for a human instead of posted blindly.",
    points: [
      "OCR for invoices, receipts, and bank statements",
      "Line-item, total, tax, and multi-currency parsing",
      "Vendor and GL account recognition",
      "Confidence scoring with human review on exceptions",
    ],
  },
  {
    name: "Ledger Sync",
    icon: Landmark,
    desc: "Two-way sync with QuickBooks, Xero, NetSuite, and Sage — coding and entries write back.",
    detail:
      "A live, two-way connection to your accounting system of record. Copilots read your chart of accounts and open items, then write approved entries straight back — no CSV exports, no re-keying, no drift between systems.",
    points: [
      "Two-way sync with QuickBooks, Xero, NetSuite & Sage",
      "Automatic GL coding from your chart of accounts",
      "Journal entry and invoice write-back",
      "Vendor, customer, and dimension mapping",
    ],
  },
  {
    name: "Reconciliation Engine",
    icon: Workflow,
    desc: "Auto-matches bank, ledger, and sub-ledger activity and surfaces only the exceptions.",
    detail:
      "Matches transactions across your bank feeds, general ledger, and AP/AR sub-ledgers automatically, then groups and explains only the exceptions that actually need a human — so reconciliations take minutes, not hours.",
    points: [
      "Auto-matching by amount, date, and reference",
      "Bank, AP, AR, and inter-company reconciliation",
      "Exceptions grouped and explained in plain language",
      "Suggested adjusting entries for fees and interest",
    ],
  },
  {
    name: "Approvals & Controls",
    icon: ShieldCheck,
    desc: "Segregation of duties, policy checks, and human sign-off before anything posts.",
    detail:
      "Every action a copilot proposes runs through your controls before it touches the ledger. Approval routing, spend thresholds, and policy checks are enforced automatically, and nothing posts without the right person signing off.",
    points: [
      "Configurable approval routing and thresholds",
      "Segregation of duties enforced by role",
      "Company policy checks on every transaction",
      "Human sign-off required before anything posts",
    ],
  },
  {
    name: "Audit Trail",
    icon: ScrollText,
    desc: "Every extraction, match, and approval is logged and traceable back to source.",
    detail:
      "A complete, tamper-evident record of everything the platform does. Each extraction, match, edit, and approval is logged with the user and timestamp and linked back to its source document — audit-ready by default.",
    points: [
      "Every action logged with user and timestamp",
      "One-click trace from entry back to source document",
      "Immutable history of edits and approvals",
      "Exportable workpaper set for auditors",
    ],
  },
  {
    name: "Reporting & Insights",
    icon: BarChart3,
    desc: "P&L, balance sheet, and cash flow with variance commentary written for you.",
    detail:
      "Turns your ledger data into board-ready reporting on demand. Statements are built, actuals compared against budget and prior period, and variances explained in plain language — ready for you to review and send.",
    points: [
      "P&L, balance sheet, and cash flow statements",
      "Budget vs actual and prior-period comparisons",
      "Automatic variance commentary",
      "Board- and management-ready exports",
    ],
  },
];

function CoreDiagram() {
  const [selected, setSelected] = useState<CoreCapability | null>(null);
  return (
    <section id="platform" className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-12 flex max-w-2xl flex-col items-center gap-3 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            The accounting core
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Every copilot runs on the same finance operating system.
          </h2>
          <p className="text-sm text-muted-foreground md:text-base">
            Instead of rebuilding the basics for every task, each copilot inherits the same six
            building blocks — document intelligence, ledger sync, reconciliation, controls, audit
            trail, and reporting — already wired together and tuned for accounting. Click any block
            to see what it does.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {CORE_CAPABILITIES.map((s, i) => {
            const Icon = s.icon;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => setSelected(s)}
                aria-label={`Learn more about ${s.name}`}
                className="group flex h-full flex-col rounded-xl border border-border bg-surface p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 md:p-6"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 transition group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">0{i + 1}</span>
                </div>
                <div className="text-base font-semibold md:text-[17px]">{s.name}</div>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {s.desc}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
                  Learn more
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {selected && <CoreModal capability={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function CoreModal({ capability, onClose }: { capability: CoreCapability; onClose: () => void }) {
  const Icon = capability.icon;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="core-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div className="flex items-center gap-4">
            <span className="brand-gradient grid h-12 w-12 shrink-0 place-items-center rounded-xl text-primary-foreground shadow-md shadow-primary/25">
              <Icon className="h-6 w-6" />
            </span>
            <div>
              <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-primary">
                Accounting core
              </span>
              <h3 id="core-title" className="mt-0.5 text-xl font-semibold tracking-tight">
                {capability.name}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <p className="text-sm leading-relaxed text-foreground/90">{capability.detail}</p>
          <div>
            <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              What it does
            </div>
            <ul className="space-y-2">
              {capability.points.map((p) => (
                <li key={p} className="flex gap-2.5 text-sm text-foreground/90">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <a
            href="#copilots"
            onClick={onClose}
            className="brand-gradient inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:opacity-95"
          >
            See the copilots that use it
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------------- Workflow ----------------

// Adds an `in-view` class the first time the element scrolls into the viewport,
// so CSS-driven reveal/draw animations fire on scroll. No-op re-observes after.
function useInView<T extends HTMLElement>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, inView };
}

function WorkflowSection({ content }: { content: WorkflowContent }) {
  const workflow = content;
  const heading = useInView<HTMLDivElement>();
  const before = useInView<HTMLDivElement>();
  const after = useInView<HTMLDivElement>();
  const timeline = useInView<HTMLDivElement>();

  return (
    <section
      id="workflow"
      className="relative overflow-hidden border-b border-border/60 bg-surface-2 py-20"
    >
      {/* soft ambient glow behind the section */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-80 w-[46rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-5xl px-5">
        <div
          ref={heading.ref}
          className={cn(
            "reveal mb-12 flex flex-col items-center gap-3 text-center",
            heading.inView && "in-view",
          )}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 font-mono text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-3 w-3" /> How it works
          </span>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            {workflow.title}
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground">
            The same six steps every time — AI does the work, your team stays in control.
          </p>
        </div>

        {/* Before → After contrast */}
        <div className="relative mb-16 grid items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div
            ref={before.ref}
            className={cn(
              "reveal rounded-2xl border border-border bg-surface/40 p-6 transition duration-300 hover:-translate-y-1 hover:border-border/80",
              before.inView && "in-view",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Before
              </span>
            </div>
            <p className="text-sm text-foreground/80">{workflow.before}</p>
          </div>
          <div className="flex items-center justify-center py-2 md:py-0">
            {/* dashed connector + arrow node */}
            <span
              aria-hidden
              className="absolute left-1/2 hidden h-px w-24 -translate-x-1/2 border-t border-dashed border-border md:block"
            />
            <div className="relative z-10 grid h-11 w-11 place-items-center rounded-full border border-primary/40 bg-background text-primary shadow-[0_0_0_5px_var(--surface-2)]">
              <ArrowRight className="arrow-float h-5 w-5" />
            </div>
          </div>
          <div
            ref={after.ref}
            className={cn(
              "reveal rounded-2xl border border-primary/40 bg-primary/5 p-6 shadow-[0_0_30px_-8px_var(--primary)] transition duration-300 hover:-translate-y-1",
              after.inView && "in-view",
            )}
            style={{ transitionDelay: after.inView ? "120ms" : "0ms" }}
          >
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                After
              </span>
            </div>
            <p className="text-sm text-foreground/90">{workflow.after}</p>
          </div>
        </div>

        {/* Connected step timeline */}
        <div ref={timeline.ref} className="relative">
          {/* far-left vertical rail + terminating arrow */}
          <span
            aria-hidden
            className={cn(
              "rail-draw absolute left-[19px] top-5 bottom-8 w-0.5 bg-gradient-to-b from-primary/50 via-border to-border",
              timeline.inView && "in-view",
            )}
          />

          <ol className="relative space-y-3">
            {workflow.steps.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? Sparkles;
              return (
                <li key={s.label} className="relative flex items-center gap-3">
                  {/* numbered badge sitting on the rail */}
                  <div className="relative z-10 flex w-10 shrink-0 justify-center">
                    <span
                      className={cn(
                        "reveal grid h-8 w-8 place-items-center rounded-full border border-primary/50 bg-background text-xs font-semibold text-primary shadow-[0_0_0_4px_var(--surface-2),0_0_12px_-2px_var(--primary)]",
                        timeline.inView && "in-view",
                      )}
                      style={{ transitionDelay: `${i * 80}ms` }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  {/* connector dot */}
                  <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                  {/* step card */}
                  <div
                    className={cn(
                      "reveal grid flex-1 grid-cols-1 overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-surface/70 to-surface-2/50 transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 sm:grid-cols-[minmax(180px,240px)_1fr]",
                      timeline.inView && "in-view",
                    )}
                    style={{ transitionDelay: `${i * 80 + 60}ms` }}
                  >
                    <div className="flex items-center gap-4 px-5 py-4">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-background/60 text-muted-foreground">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="text-[15px] font-semibold text-foreground">{s.label}</span>
                    </div>
                    <div className="flex items-center border-t border-border/60 px-5 py-4 text-sm text-muted-foreground sm:border-l sm:border-t-0">
                      {s.detail}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// Icons for the six-step flow, assigned by position (intake → extract → match →
// validate → approve → post).
const STEP_ICONS: LucideIcon[] = [Mail, FileText, Workflow, Wand2, User, CheckCircle2];

// ---------------- Copilot library (interactive catalog + modal) ----------------

function CopilotLibrary() {
  const [active, setActive] = useState<CopilotGroup | "all">("all");
  const [selected, setSelected] = useState<Copilot | null>(null);

  const items = useMemo(
    () => (active === "all" ? COPILOTS : COPILOTS.filter((c) => c.group === active)),
    [active],
  );

  return (
    <section id="copilots" className="border-b border-border/60 bg-surface-2/40 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-10 flex max-w-2xl flex-col items-center gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Copilot library
          </span>
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Pick the copilot for the work you want off your plate.
          </h2>
          <p className="text-sm text-muted-foreground">
            Every copilot follows the same shape: it starts on a trigger, handles the busywork with
            AI, and stops for your approval before anything posts. Click any card to see how it
            runs.
          </p>
        </Reveal>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-5">
          <div className="flex flex-wrap gap-1.5">
            {COPILOT_GROUPS.map((g) => (
              <CatalogChip
                key={g.slug}
                label={g.label}
                active={active === g.slug}
                onClick={() => setActive(g.slug)}
              />
            ))}
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            Showing <b className="font-medium text-primary">{items.length}</b> of {COPILOTS.length}{" "}
            copilots
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <button
              key={c.title}
              onClick={() => setSelected(c)}
              className="group flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: GROUP_META[c.group].accent }}
                >
                  {c.label}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
              </div>
              <h3 className="text-[17px] font-semibold leading-snug tracking-tight">{c.title}</h3>
              <p className="flex-1 text-sm text-muted-foreground">{c.goal}</p>
              <div className="flex items-center justify-between border-t border-dashed border-border pt-3 font-mono text-[11px] text-muted-foreground">
                <span>{c.persona}</span>
                <span className="flex items-center gap-1 text-primary">
                  <ShieldCheck className="h-3 w-3" />
                  {c.approver}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selected && <CopilotModal copilot={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function CopilotModal({ copilot, onClose }: { copilot: Copilot; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const reduceMotion =
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const accent = GROUP_META[copilot.group].accent;

  // Reveal the run trace line by line so the flow reads as something that
  // actually executes, not a static list.
  useEffect(() => {
    setStep(0);
    if (reduceMotion) {
      setStep(copilot.trace.length);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setStep(i);
      if (i >= copilot.trace.length) clearInterval(id);
    }, 340);
    return () => clearInterval(id);
  }, [copilot, reduceMotion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="copilot-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="nice-scroll max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-surface shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <span
              className="font-mono text-[10px] font-medium uppercase tracking-wider"
              style={{ color: accent }}
            >
              {copilot.label}
            </span>
            <h3 id="copilot-title" className="mt-1.5 text-2xl font-semibold tracking-tight">
              {copilot.title}
            </h3>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copilot.goal}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-0 md:grid-cols-[1fr_320px]">
          {/* Left: explanation */}
          <div className="space-y-6 p-6">
            <div>
              <div className="mb-2 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                <Zap className="h-3.5 w-3.5" style={{ color: accent }} /> Starts when
              </div>
              <p className="text-sm text-foreground/90">{copilot.trigger}</p>
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                What the AI does
              </div>
              <ul className="space-y-2">
                {copilot.actions.map((a) => (
                  <li key={a} className="flex gap-2.5 text-sm text-foreground/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: accent }} />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2.5 rounded-lg border border-primary/25 bg-primary/5 px-4 py-3 text-sm text-foreground/90">
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
              You stay in control — <b className="font-semibold text-primary">
                {copilot.approver}
              </b>{" "}
              approves before anything posts.
            </div>

            <div>
              <div className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                What you get
              </div>
              <ul className="grid gap-2 sm:grid-cols-2">
                {copilot.value.map((v) => (
                  <li key={v} className="flex gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: live run trace */}
          <div className="border-t border-border bg-surface-2/60 p-6 md:border-l md:border-t-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                Live run
              </span>
              <span className="font-mono text-[11px] text-primary">{copilot.runtime}</span>
            </div>
            <div className="space-y-2 font-mono text-[12.5px] leading-relaxed">
              {copilot.trace.map((line, i) => {
                const shown = i < step;
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 transition-opacity duration-300",
                      shown ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <TraceIcon kind={line.kind} />
                    <span
                      className={cn(
                        line.kind === "wait" && "text-amber-500 dark:text-amber-400",
                        line.kind === "done" && "font-semibold text-foreground",
                        line.kind === "run" && "text-muted-foreground",
                        line.kind === "ok" && "text-foreground/80",
                      )}
                    >
                      {line.text}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href="#cta"
                onClick={onClose}
                className="brand-gradient inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/25 transition hover:opacity-95"
              >
                Get this copilot
              </a>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/50"
              >
                Browse more
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TraceIcon({ kind }: { kind: Copilot["trace"][number]["kind"] }) {
  if (kind === "wait")
    return <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400" />;
  if (kind === "done") return <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
  if (kind === "run")
    return <span className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground">▸</span>;
  return <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />;
}

// ---------------- Integration catalog ----------------

function IntegrationCatalog() {
  const [active, setActive] = useState<LandingIntegrationCategory | "all">("all");

  const items = useMemo(
    () =>
      active === "all"
        ? LANDING_INTEGRATIONS
        : LANDING_INTEGRATIONS.filter((i) => i.category === active),
    [active],
  );

  return (
    <section id="integrations" className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <div className="mb-8 flex flex-col gap-2 text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Integrations
          </span>
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            12+ finance systems your copilots can talk to.
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Authenticate once. Read and act everywhere.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-1.5">
          <CatalogChip label="All" active={active === "all"} onClick={() => setActive("all")} />
          {INTEGRATION_CATEGORIES.map((c) => (
            <CatalogChip key={c} label={c} active={active === c} onClick={() => setActive(c)} />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((i) => (
            <div
              key={i.slug}
              className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface p-5 text-center transition hover:border-primary/50 hover:shadow-sm"
            >
              <IntegrationLogo
                name={i.name}
                domain={i.domain}
                logo={i.logo}
                className="h-12 w-12"
              />
              <div className="min-w-0">
                <div className="text-sm font-medium break-words">{i.name}</div>
                <div className="text-[11px] text-muted-foreground">{i.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CatalogChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

// ---------------- Platform grid ----------------

function PlatformGrid() {
  const rows = [
    { k: "Document Intelligence", v: "OCR for invoices, receipts, and statements with structured extraction." },
    { k: "Ledger Sync", v: "Two-way sync with QuickBooks, Xero, NetSuite, and Sage." },
    { k: "Reconciliation", v: "Auto-matching for bank, AP, AR, and inter-company activity." },
    { k: "Controls", v: "Segregation of duties, approval routing, and policy checks." },
    { k: "Audit Trail", v: "Every action logged and traceable back to source." },
    { k: "Security", v: "SSO, role-based access, encryption, and data residency controls." },
  ];
  return (
    <section className="border-b border-border/60 py-20">
      <div className="mx-auto max-w-7xl px-5">
        <Reveal className="mx-auto mb-12 max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-wider text-primary">
            Under the hood
          </span>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Enterprise-grade, built for the controls finance requires.
          </h2>
        </Reveal>
        <Reveal pop className="overflow-hidden rounded-2xl border border-border">
          {rows.map((r, i) => (
            <div
              key={r.k}
              className={`grid grid-cols-1 gap-2 px-5 py-4 md:grid-cols-[220px_1fr] ${
                i !== rows.length - 1 ? "border-b border-border" : ""
              } bg-surface`}
            >
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {r.k}
              </div>
              <div className="text-sm text-foreground/90">{r.v}</div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- CTA ----------------

function CTASection({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section id="cta" className="py-20">
      <Reveal pop className="mx-auto max-w-4xl px-5 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Give your finance team back the close.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          See how AP/AR, reconciliation, and reporting copilots run on your own stack. Book a demo
          and we'll walk you through it.
        </p>
        <button
          onClick={onBookDemo}
          className="brand-gradient mt-6 inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:-translate-y-0.5 hover:opacity-95"
        >
          Book a demo
        </button>
      </Reveal>
    </section>
  );
}

// ---------------- Footer ----------------

function Footer() {
  const columns: { title: string; links: string[] }[] = [
    { title: "Product", links: ["Copilots", "Platform", "Integrations", "Security"] },
    { title: "Solutions", links: ["Accounts payable", "Accounts receivable", "Month-end close", "Accounting firms"] },
    { title: "Company", links: ["About", "Customers", "Careers", "Contact"] },
  ];
  return (
    <footer className="border-t border-border bg-surface-2">
      <div className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center">
              <LogoLockup />
            </div>
            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              The AI operating system for accounting — AP/AR, reconciliation, close, and reporting,
              with a human in control of every entry.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
                {col.title}
              </div>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="transition hover:text-foreground">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row">
          <div>© {new Date().getFullYear()} Ledger AI OS. All rights reserved.</div>
          <div className="font-mono">The AI operating system for accounting</div>
        </div>
      </div>
    </footer>
  );
}

// ---------------- Auth modal ----------------

function AuthModal({
  onClose,
  onAuthenticated,
}: {
  onClose: () => void;
  onAuthenticated: () => void;
}) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [status, setStatus] = useState<null | string>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    firstFieldRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    firstFieldRef.current?.focus();
    setStatus(null);
  }, [tab]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 id="auth-title" className="text-lg font-semibold">
              {tab === "login" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {tab === "login"
                ? "Sign in to your workspace."
                : "Get access to your accounting copilots."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-surface-2 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
          <button
            onClick={() => setTab("login")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "login" ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Log in
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "signup" ? "bg-surface text-foreground" : "text-muted-foreground"
            }`}
          >
            Sign up
          </button>
        </div>

        {status ? (
          <div className="rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
            {status}
            <div className="mt-4">
              <button
                onClick={onClose}
                className="w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Close
              </button>
            </div>
          </div>
        ) : tab === "login" ? (
          <LoginForm firstFieldRef={firstFieldRef} onAuthenticated={onAuthenticated} />
        ) : (
          <SignupForm firstFieldRef={firstFieldRef} onAuthenticated={onAuthenticated} />
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      {children}
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary";

function isEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function LoginForm({
  firstFieldRef,
  onAuthenticated,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onAuthenticated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!isEmail(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.login(email, password);
      onAuthenticated(); // navigates into the workspace (/app)
    } catch (err) {
      let msg = "Could not reach the platform. Is the backend running?";
      if (err instanceof ApiError) {
        // The backend replied — show why (bad credentials, no tenant/org, etc.).
        msg = err.status === 401 ? "Invalid email or password." : err.message;
      }
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Work email" error={errors.email}>
        <input
          ref={firstFieldRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </Field>
      <div className="flex items-center justify-between">
        <button type="button" className="text-xs text-muted-foreground hover:text-foreground">
          Forgot password?
        </button>
      </div>
      {errors.form && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.form}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Signing in…" : "Log in"}
      </button>
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <div className="h-px w-full bg-border" />
        </div>
        <div className="relative text-center">
          <span className="bg-surface px-2 text-[11px] uppercase tracking-wider text-muted-foreground">
            or
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setErrors({ form: "SSO isn't wired yet — sign in with email + password." })}
        className="w-full rounded-md border border-border bg-background py-2 text-sm font-medium hover:border-primary"
      >
        Continue with SSO
      </button>
    </form>
  );
}

function SignupForm({
  firstFieldRef,
  onAuthenticated,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onAuthenticated: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email) errs.email = "Email is required";
    else if (!isEmail(email)) errs.email = "Enter a valid work email";
    if (!company.trim()) errs.company = "Company is required";
    if (!password || password.length < 8) errs.password = "Password must be at least 8 characters";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      await api.signup({ name, email, company, password });
      onAuthenticated(); // account created + signed in — go straight into /app
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not create your account. Try again.";
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <Field label="Full name" error={errors.name}>
        <input
          ref={firstFieldRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
          placeholder="Ada Lovelace"
        />
      </Field>
      <Field label="Work email" error={errors.email}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          placeholder="you@company.com"
          autoComplete="email"
        />
      </Field>
      <Field label="Company" error={errors.company}>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className={inputCls}
          placeholder="Acme LLP"
        />
      </Field>
      <Field label="Password" error={errors.password}>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputCls}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </Field>
      {errors.form && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errors.form}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
