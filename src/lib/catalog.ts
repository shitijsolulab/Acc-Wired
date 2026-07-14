// Sample integrations catalog — the "Nango-style" API catalog that powers both the
// public landing grid and the in-app Connector Hub. In the real product this list
// comes from the connectors service; until that endpoint exists, this static
// catalog gives the catalog UI a full, realistic shape to render.
//
// `domain` feeds the Clearbit logo CDN (https://logo.clearbit.com/<domain>); when a
// logo fails to load the UI falls back to the integration's initials.

export type IntegrationCategory =
  "Accounting" | "Banking" | "Construction" | "HR & ATS" | "Productivity";

export type Integration = {
  slug: string;
  name: string;
  domain: string;
  category: IntegrationCategory;
  /** True for the auth/comms platform (Nango), false for action platform (Composio). */
  auth?: boolean;
  /**
   * Explicit logo URL. Use when the favicon service can't distinguish a brand —
   * e.g. Google Workspace apps all share the google.com favicon, so each needs
   * its own product logo.
   */
  logo?: string;
};

export const CATEGORIES: IntegrationCategory[] = [
  "Accounting",
  "Banking",
  "Construction",
  "HR & ATS",
  "Productivity",
];

export const INTEGRATIONS: Integration[] = [
  // Accounting
  {
    slug: "quickbooks",
    name: "QuickBooks",
    domain: "quickbooks.intuit.com",
    category: "Accounting",
  },
  { slug: "xero", name: "Xero", domain: "xero.com", category: "Accounting" },
  { slug: "netsuite", name: "NetSuite", domain: "netsuite.com", category: "Accounting" },
  { slug: "sage", name: "Sage", domain: "sage.com", category: "Accounting" },
  { slug: "freshbooks", name: "FreshBooks", domain: "freshbooks.com", category: "Accounting" },
  { slug: "bill", name: "BILL", domain: "bill.com", category: "Accounting" },

  // Banking
  { slug: "plaid", name: "Plaid", domain: "plaid.com", category: "Banking", auth: true },
  { slug: "stripe", name: "Stripe", domain: "stripe.com", category: "Banking" },
  { slug: "brex", name: "Brex", domain: "brex.com", category: "Banking" },
  { slug: "ramp", name: "Ramp", domain: "ramp.com", category: "Banking" },
  { slug: "mercury", name: "Mercury", domain: "mercury.com", category: "Banking" },
  { slug: "wise", name: "Wise", domain: "wise.com", category: "Banking" },

  // Construction
  { slug: "procore", name: "Procore", domain: "procore.com", category: "Construction" },
  {
    slug: "autodesk",
    name: "Autodesk Construction Cloud",
    domain: "autodesk.com",
    category: "Construction",
  },
  {
    slug: "buildertrend",
    name: "Buildertrend",
    domain: "buildertrend.com",
    category: "Construction",
  },
  { slug: "fieldwire", name: "Fieldwire", domain: "fieldwire.com", category: "Construction" },
  { slug: "bluebeam", name: "Bluebeam", domain: "bluebeam.com", category: "Construction" },
  {
    slug: "primavera",
    name: "Oracle Primavera P6",
    domain: "oracle.com",
    category: "Construction",
  },

  // HR & ATS
  { slug: "workday", name: "Workday", domain: "workday.com", category: "HR & ATS" },
  { slug: "greenhouse", name: "Greenhouse", domain: "greenhouse.io", category: "HR & ATS" },
  { slug: "lever", name: "Lever", domain: "lever.co", category: "HR & ATS" },
  { slug: "bamboohr", name: "BambooHR", domain: "bamboohr.com", category: "HR & ATS" },
  { slug: "gusto", name: "Gusto", domain: "gusto.com", category: "HR & ATS" },
  { slug: "rippling", name: "Rippling", domain: "rippling.com", category: "HR & ATS" },

  // Productivity
  { slug: "notion", name: "Notion", domain: "notion.so", category: "Productivity" },
  { slug: "confluence", name: "Confluence", domain: "atlassian.com", category: "Productivity" },
  { slug: "airtable", name: "Airtable", domain: "airtable.com", category: "Productivity" },
  {
    slug: "gsheets",
    name: "Google Sheets",
    domain: "sheets.google.com",
    category: "Productivity",
    logo: "https://ssl.gstatic.com/images/branding/product/2x/sheets_2020q4_48dp.png",
  },
  {
    slug: "gcalendar",
    name: "Google Calendar",
    domain: "calendar.google.com",
    category: "Productivity",
    auth: true,
    logo: "https://ssl.gstatic.com/images/branding/product/2x/calendar_2020q4_48dp.png",
  },
  {
    slug: "gdrive",
    name: "Google Drive",
    domain: "drive.google.com",
    category: "Productivity",
    auth: true,
    logo: "https://ssl.gstatic.com/images/branding/product/2x/drive_2020q4_48dp.png",
  },
];

export function logoUrl(domain: string): string {
  // Google's favicon service returns the site's real brand icon and is far more
  // reliable than the (now-defunct) Clearbit logo CDN. sz=128 keeps it crisp.
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function initials(name: string): string {
  return name
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
