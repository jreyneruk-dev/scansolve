// Competitor comparison pages (/compare/[competitor]). These double as outreach
// collateral, so they must be HONEST: MaintainX and UpKeep are deeper CMMS platforms
// than ScanSolve. We acknowledge that plainly and win on the real wedge — flat price vs
// per-seat, a free tier, and being right-sized for teams that just need fault reporting.
// Pricing is "as publicly listed"; the page carries a dated disclaimer.

export interface CompareRow {
  feature: string;
  scansolve: boolean | string;
  competitor: boolean | string;
}

export interface Comparison {
  slug: string; // "maintainx"
  competitor: string; // "MaintainX"
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  headline: string;
  sub: string;
  // pricing snapshot
  pricingLine: string; // one honest sentence about their pricing
  pricingMath: { team: string; competitorCost: string; scansolveCost: string };
  rows: CompareRow[];
  competitorStrengths: string[]; // where the competitor is genuinely stronger
  scansolveWins: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  asOf: string; // pricing/feature snapshot date
  sources: string[];
}

export const COMPARISONS: Comparison[] = [
  // ── ScanSolve vs MaintainX ──────────────────────────────────────────────
  {
    slug: "maintainx",
    competitor: "MaintainX",
    metaTitle: "ScanSolve vs MaintainX",
    metaDescription:
      "MaintainX is a full CMMS billed per user. ScanSolve is flat-price QR fault reporting with a free tier. An honest side-by-side so you can pick the right fit.",
    eyebrow: "ScanSolve vs MaintainX",
    headline: "A full CMMS, or flat-price fault reporting?",
    sub: "MaintainX is a deep maintenance-management platform billed per user. ScanSolve is a lean, flat-priced way to get faults reported and tracked. Here's an honest side-by-side so you can pick the one that fits.",
    pricingLine:
      "MaintainX has a free Basic tier, then paid plans from about $16/user/mo (Essentials) up to $49/user/mo (Premium), plus custom Enterprise. It's billed per user, per month.",
    pricingMath: {
      team: "A 10-person facilities team",
      competitorCost: "MaintainX Essentials ≈ $160/mo (~$1,920/yr); Premium ≈ $490/mo",
      scansolveCost: "ScanSolve Prime £15/mo flat for the whole team — or free on Starter",
    },
    rows: [
      { feature: "Pricing model", scansolve: "Flat, per organisation", competitor: "Per user, per month" },
      { feature: "Free plan", scansolve: "Yes — unlimited QR labels", competitor: "Yes — Basic (limited)" },
      { feature: "Cost to add your team", scansolve: "Included up to 20 (Prime)", competitor: "Per extra user" },
      { feature: "QR fault reporting, no login for reporters", scansolve: true, competitor: true },
      { feature: "Preventive-maintenance scheduling", scansolve: false, competitor: true },
      { feature: "Work orders & assignment", scansolve: "Basic (assign + status)", competitor: "Advanced" },
      { feature: "Asset & parts/inventory management", scansolve: false, competitor: true },
      { feature: "Reporting & analytics", scansolve: "Resolution-time Insights (Prime)", competitor: "Advanced" },
      { feature: "Integrations (Slack/Teams/API)", scansolve: "Enterprise (planned)", competitor: true },
      { feature: "Setup time", scansolve: "Minutes", competitor: "Longer (CMMS onboarding)" },
    ],
    competitorStrengths: [
      "Preventive-maintenance scheduling and recurring work orders",
      "Deep work-order workflows, procedures and checklists",
      "Asset and parts/inventory management",
      "A large integration catalogue and an API",
      "Advanced reporting plus Enterprise controls (SSO, audit logs)",
    ],
    scansolveWins: [
      {
        title: "One flat price, no per-seat tax",
        body: "Prime is £15/mo for the owner plus 20 team members. MaintainX bills per user, so the cost climbs every time your team grows. For a small facilities team, that's a four-figure annual bill versus a flat monthly one.",
      },
      {
        title: "Unlimited QR labels, free to start",
        body: "The Starter plan is free forever with unlimited labels, so you can put a code on every asset and room at no cost and see whether the reporting habit sticks before you pay anything.",
      },
      {
        title: "Live in minutes, not a rollout",
        body: "There's no CMMS to configure. Print labels, stick them up, and people report by scanning. Most teams are running the same afternoon.",
      },
      {
        title: "Right-sized for reporting",
        body: "If you don't need scheduled preventive maintenance or parts inventory, a full CMMS is more than you'll use. ScanSolve does the report-and-track job and stops there.",
      },
    ],
    faqs: [
      {
        q: "Is ScanSolve a replacement for MaintainX?",
        a: "Not for a full CMMS. If you need preventive-maintenance scheduling, parts inventory, and deep work-order workflows, MaintainX is built for that. ScanSolve covers the report-and-track layer: anyone scans a QR to log a fault, and your team tracks it to resolved — for a flat price, no per-seat bill.",
      },
      {
        q: "How does the pricing actually compare?",
        a: "MaintainX bills per user per month (from about $16, up to about $49 on Premium). ScanSolve Prime is £15/mo flat for the owner plus 20 team members, and Starter is free with unlimited QR labels. For a small facilities team, that's the difference between a four-figure annual bill and a flat monthly one.",
      },
      {
        q: "Can people report faults without an account?",
        a: "Yes, in both tools. ScanSolve reporters scan a QR and submit with no login or app; MaintainX also supports public work requests. The cost difference is in the seats for the team who manage and action the work.",
      },
      {
        q: "When is MaintainX the better choice?",
        a: "When maintenance is your core operation and you'll use scheduled preventive maintenance, inventory, and deep work-order management across a large technician team. Buy the depth if you'll use it.",
      },
    ],
    asOf: "July 2026",
    sources: [
      "https://www.getmaintainx.com/pricing",
      "https://www.capterra.com/p/179296/GetMaintainx/pricing/",
    ],
  },

  // ── ScanSolve vs UpKeep ─────────────────────────────────────────────────
  {
    slug: "upkeep",
    competitor: "UpKeep",
    metaTitle: "ScanSolve vs UpKeep",
    metaDescription:
      "UpKeep is a per-user CMMS with no permanent free plan. ScanSolve is flat-price QR fault reporting with a free tier. An honest side-by-side.",
    eyebrow: "ScanSolve vs UpKeep",
    headline: "A per-seat CMMS, or flat-price reporting?",
    sub: "UpKeep is a mobile-first maintenance-management platform billed per user, with no permanent free plan. ScanSolve is a lean, flat-priced fault-reporting tool with a free tier. Here's the honest comparison.",
    pricingLine:
      "UpKeep is billed per user, per month, from about $20/user and rising with the tier. It has no permanent free plan.",
    pricingMath: {
      team: "A 10-person facilities team",
      competitorCost: "UpKeep from ≈ $200/mo (~$2,400/yr) and up",
      scansolveCost: "ScanSolve Prime £15/mo flat for the whole team — or free on Starter",
    },
    rows: [
      { feature: "Pricing model", scansolve: "Flat, per organisation", competitor: "Per user, per month" },
      { feature: "Free plan", scansolve: "Yes — unlimited QR labels", competitor: false },
      { feature: "Cost to add your team", scansolve: "Included up to 20 (Prime)", competitor: "Per extra user" },
      { feature: "QR fault reporting, no login for reporters", scansolve: true, competitor: true },
      { feature: "Preventive-maintenance scheduling", scansolve: false, competitor: true },
      { feature: "Work orders & assignment", scansolve: "Basic (assign + status)", competitor: "Advanced" },
      { feature: "Asset & inventory management", scansolve: false, competitor: true },
      { feature: "Reporting & analytics", scansolve: "Resolution-time Insights (Prime)", competitor: "Advanced" },
      { feature: "Integrations (Slack/Teams/API)", scansolve: "Enterprise (planned)", competitor: true },
      { feature: "Setup time", scansolve: "Minutes", competitor: "Longer (CMMS onboarding)" },
    ],
    competitorStrengths: [
      "Preventive-maintenance scheduling and work orders",
      "Asset and inventory management",
      "Mobile-first technician workflows",
      "Meter readings and advanced reporting",
      "Integrations and enterprise controls",
    ],
    scansolveWins: [
      {
        title: "One flat price, no per-seat tax",
        body: "Prime is £15/mo for the owner plus 20 members. UpKeep bills per user, so a growing team means a growing bill every month.",
      },
      {
        title: "A genuinely free tier",
        body: "UpKeep has no permanent free plan. ScanSolve Starter is free forever with unlimited QR labels, so you can prove the reporting habit before paying anything.",
      },
      {
        title: "Live in minutes, not a rollout",
        body: "No CMMS to configure. Print labels, stick them up, and people report by scanning — most teams are running the same afternoon.",
      },
      {
        title: "Right-sized for reporting",
        body: "If you don't need scheduled preventive maintenance or inventory, a full CMMS is more than you'll use. ScanSolve does the report-and-track job and stops there.",
      },
    ],
    faqs: [
      {
        q: "Is ScanSolve a replacement for UpKeep?",
        a: "Not for a full CMMS. If you need preventive-maintenance scheduling, asset and inventory management, and deep technician workflows, UpKeep is built for that. ScanSolve covers the report-and-track layer for a flat price, no per-seat bill.",
      },
      {
        q: "How does the pricing compare?",
        a: "UpKeep bills per user per month (from about $20) with no permanent free plan. ScanSolve Prime is £15/mo flat for the owner plus 20 members, and Starter is free with unlimited QR labels.",
      },
      {
        q: "Can people report faults without an account?",
        a: "Yes, in both tools. ScanSolve reporters scan a QR and submit with no login; UpKeep supports request submissions too. The cost difference is in the seats for the team who manage the work.",
      },
      {
        q: "When is UpKeep the better choice?",
        a: "When maintenance is your core operation and you'll use scheduled PM, asset/inventory management, and mobile technician workflows at scale. Buy the depth if you'll use it.",
      },
    ],
    asOf: "July 2026",
    sources: [
      "https://upkeep.com/pricing/",
      "https://upkeep.com/maintenance-software-for/facility-management/",
    ],
  },
];

export function getComparison(slug: string): Comparison | undefined {
  return COMPARISONS.find((c) => c.slug === slug);
}
