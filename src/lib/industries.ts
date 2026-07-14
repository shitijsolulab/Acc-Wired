// Shared industry catalog — used by both the landing page and the authenticated
// workspace so there is ONE source of truth for industry content. In the real
// product this would come from the tenant's config via the backend; for now it is
// static content keyed by industry slug.

export type Connector = { name: string; use: string; domain?: string };
export type Workflow = {
  title: string;
  before: string;
  after: string;
  steps: { label: string; detail: string }[];
};
export type IndustryContent = {
  heroTagline: string;
  heroSub: string;
  workflow: Workflow;
  connectors: {
    nango: Connector[];
    composio: Connector[];
    fallback?: boolean;
  };
};

export const INDUSTRIES: { slug: string; label: string; blurb: string; icon: string }[] = [
  { slug: "common", label: "All industries", blurb: "See the shared platform view", icon: "◎" },
  { slug: "accounting", label: "Accounting", blurb: "Invoices, ledger, close", icon: "₵" },
  { slug: "legal", label: "Legal", blurb: "Matters, contracts, playbooks", icon: "§" },
  { slug: "construction", label: "Construction", blurb: "RFIs, drawings, schedules", icon: "⌂" },
  { slug: "insurance", label: "Insurance", blurb: "Claims & underwriting", icon: "⛨" },
  { slug: "healthcare", label: "Healthcare", blurb: "Records & scheduling", icon: "✚" },
  { slug: "banking", label: "Banking", blurb: "Ops, KYC, servicing", icon: "🏦" },
  { slug: "manufacturing", label: "Manufacturing", blurb: "Orders, quality, supply", icon: "⚙" },
  { slug: "logistics", label: "Logistics", blurb: "Shipments & routing", icon: "✈" },
];

export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  common: {
    heroTagline: "One AI operating system. Every line of business.",
    heroSub:
      "A shared core — identity, chat, workflow engine, document intelligence, connector hub — with copilots tuned to how your industry actually works.",
    workflow: {
      title: "A generic 45–60 min task, done in 5–10.",
      before: "Manual triage across email, files, and 3+ business systems.",
      after: "AI drafts, checks, and executes. A human reviews and approves.",
      steps: [
        { label: "Intake", detail: "Email, file, or chat message arrives." },
        { label: "Parse", detail: "Document intelligence extracts structured data." },
        { label: "Enrich", detail: "Connector hub pulls context from your business systems." },
        { label: "Draft", detail: "AI produces a response, record, or action." },
        { label: "Approve", detail: "Human reviews and clicks approve." },
        { label: "Execute", detail: "Action written back into your system of record." },
      ],
    },
    connectors: {
      fallback: true,
      nango: [
        { name: "Email & Calendar", use: "Read, send, and schedule across your inbox." },
        { name: "File Storage", use: "Access documents from your team drive." },
      ],
      composio: [
        {
          name: "Line-of-Business System",
          use: "Bring your own — we scope the integration with you.",
        },
      ],
    },
  },
  accounting: {
    heroTagline: "AI that closes the books faster.",
    heroSub:
      "Invoice processing, vendor lookups, duplicate checks, and ledger updates — drafted by AI, approved by your controller.",
    workflow: {
      title: "Invoice Processing & Approval Copilot",
      before: "45+ minutes per invoice across email, drive, and ERP.",
      after: "5 minutes: review, approve, done.",
      steps: [
        { label: "Vendor emails invoice", detail: "Nango retrieves the message and attachment." },
        { label: "OCR extracts data", detail: "Line items, totals, and vendor info parsed." },
        {
          label: "Composio checks records",
          detail: "Vendor lookup + duplicate flag against QuickBooks/Xero.",
        },
        { label: "AI drafts validation", detail: "Summary of matches, mismatches, and issues." },
        { label: "Human approves", detail: "Controller clicks approve in one screen." },
        { label: "Composio posts entry", detail: "Invoice created and confirmation emailed." },
      ],
    },
    connectors: {
      nango: [
        { name: "Outlook", use: "Retrieve vendor invoices from shared inbox." },
        { name: "Gmail", use: "Retrieve vendor invoices and send confirmations." },
        { name: "Microsoft 365", use: "Auth and identity for the finance team." },
        { name: "Google Drive", use: "Access invoice PDFs and receipts." },
      ],
      composio: [
        { name: "QuickBooks", use: "Create invoices, vendors, and journal entries." },
        { name: "Xero", use: "Ledger and journal retrieval, invoice posting." },
        { name: "ERP systems", use: "Sync invoices to your ERP of record." },
      ],
    },
  },
  legal: {
    heroTagline: "AI that reads the contract before you do.",
    heroSub:
      "Matter intake, contract review, and playbook checks — drafted by AI, sent back over your existing systems.",
    workflow: {
      title: "Contract Review Copilot",
      before: "60+ minutes reading and comparing against the playbook.",
      after: "10 minutes: read the summary, adjust, send.",
      steps: [
        { label: "Contract arrives", detail: "Nango pulls the attachment from email." },
        { label: "OCR parses it", detail: "Clauses, parties, and dates extracted." },
        { label: "Composio pulls precedent", detail: "Prior matters and the firm's playbook." },
        { label: "AI flags risk", detail: "Missing clauses, deviations, and red-flag terms." },
        { label: "Lawyer reviews", detail: "Summary + inline suggestions in one view." },
        { label: "Nango sends it back", detail: "Reviewed contract returned via email." },
      ],
    },
    connectors: {
      nango: [
        { name: "Outlook", use: "Retrieve incoming contracts and correspondence." },
        { name: "SharePoint", use: "Access matter document libraries." },
        { name: "Google Drive", use: "Access shared client folders." },
      ],
      composio: [
        { name: "Clio", use: "Matter management and time capture." },
        { name: "Ironclad", use: "Contract lifecycle actions." },
        { name: "DocuSign", use: "E-signature status and send." },
      ],
    },
  },
  construction: {
    heroTagline: "AI that answers the RFI before the site does.",
    heroSub:
      "RFI response, submittal tracking, and change-order drafting — grounded in your drawings, schedules, and PM system.",
    workflow: {
      title: "RFI Copilot",
      before: "A PM chasing drawings, schedules, and spec sections for hours.",
      after: "Draft response ready in minutes, PM approves and sends.",
      steps: [
        { label: "Contractor raises RFI", detail: "Nango retrieves the email or Teams message." },
        { label: "Docs parsed", detail: "OCR + document intelligence read attachments." },
        {
          label: "Composio pulls project data",
          detail: "Drawings, schedules, specs from Procore.",
        },
        {
          label: "AI drafts a response",
          detail: "Grounded in the project record, cites drawings.",
        },
        { label: "PM approves", detail: "One-click approval with edits inline." },
        { label: "Nango sends reply", detail: "Response goes back over email or Teams." },
      ],
    },
    connectors: {
      nango: [
        { name: "Outlook", use: "Retrieve RFIs and submittals from email." },
        { name: "Microsoft Teams", use: "Read and post in project channels." },
        { name: "SharePoint", use: "Access project drawing sets." },
      ],
      composio: [
        { name: "Procore", use: "RFIs, submittals, and change orders." },
        { name: "Autodesk Construction Cloud", use: "Drawings and model coordination." },
        { name: "Oracle Primavera P6", use: "Master schedule lookups." },
      ],
    },
  },
};

export function getContent(slug: string): IndustryContent {
  return INDUSTRY_CONTENT[slug] ?? INDUSTRY_CONTENT.common;
}

// The tenant's chosen industry is remembered client-side for this POC (in the real
// product it comes from the tenant record via /api/admin/tenant).
const INDUSTRY_KEY = "aios.industry";

export function setStoredIndustry(slug: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(INDUSTRY_KEY, slug);
}

export function getStoredIndustry(): string {
  if (typeof window === "undefined") return "common";
  return window.localStorage.getItem(INDUSTRY_KEY) ?? "common";
}
