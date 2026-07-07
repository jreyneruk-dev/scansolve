import { Dumbbell, Building2, Factory, Landmark, type LucideIcon } from "lucide-react";

// Per-vertical landing-page content. Each vertical gets its own buyer, hook, and
// concrete example faults so the pages read as genuinely distinct, not templated.
// Copy is grounded in what the product does today (see docs/GTM-STRATEGY.md — do not
// promise a hook the product can't demo). Add a vertical by appending one object.

export interface Vertical {
  slug: string;
  name: string; // e.g. "Gyms & leisure"
  icon: LucideIcon;
  targetRole: string; // who the page is written for

  // SEO
  metaTitle: string;
  metaDescription: string;

  // Hero
  eyebrow: string;
  headline: string;
  sub: string;
  secondaryCta: { label: string; href: string; external?: boolean };

  // The problem
  painTitle: string;
  painIntro: string;
  pains: { title: string; body: string }[];

  // Example faults (chips)
  exampleIssues: string[];

  // How it fits
  hookTitle: string;
  hookBody: string;

  // Outcomes
  outcomes: { title: string; body: string }[];

  // FAQ
  faqs: { q: string; a: string }[];

  // ── Enrichment (optional; present once a vertical has been researched) ──
  // SEO keywords woven into the page; also used in metadata keywords.
  seoKeywords?: string[];
  // A sourced proof stat rendered as a full-width band. `sub` may be framing/opinion.
  proofStat?: { headline: string; sub: string; source?: string };
  // Named-competitor contrast callout (e.g. the "no per-seat tax" wedge).
  competitorContrast?: { heading: string; body: string };
  // Crafted on-brand hero graphic in public/verticals/ (SVG). Omit for the text hero.
  heroImage?: { src: string; alt: string };
  // On-brand SVG infographics in public/verticals/.
  infographics?: { src: string; alt: string; caption?: string }[];
}

// Pre-filled body for the "Book a 15-minute demo" mailto CTAs.
const DEMO_BODY = `Hello

I would like to set up a free 15 minute no-commitment demo of ScanSolve.

Here's some background on my interest:

Company/Organisation:
Possible Applications:


Best Regards`;

const DEMO_CTA = (subject: string) => ({
  label: "Book a 15-minute demo",
  href: `mailto:hello@scansolve.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(DEMO_BODY)}`,
  external: true,
});

export const VERTICALS: Vertical[] = [
  // ── Gyms & leisure (beachhead) ────────────────────────────────────────────
  {
    slug: "gyms",
    name: "Gyms & leisure",
    icon: Dumbbell,
    targetRole: "gym owners and duty managers",
    metaTitle: "QR issue reporting for gyms & leisure centres",
    metaDescription:
      "Broken kit gets logged the moment a member or trainer spots it. Put a QR code on every machine, staff scan to report, you fix it before members walk. Free to start.",
    eyebrow: "For gyms & leisure",
    headline: "Broken kit, logged before a member complains",
    sub: "Put a QR code on every treadmill, shower, and locker. Anyone who spots a fault scans it and tells you in about 20 seconds — no app, no login. You see it instantly and get it fixed before it costs you a membership.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why gyms lose members to maintenance",
    painIntro:
      "A treadmill goes down on a Tuesday. A member notices, says nothing, and trains somewhere else next month. The fault sat in someone's head, never logged, until it cost you a renewal.",
    pains: [
      {
        title: "Kit goes down and nobody logs it",
        body: "Staff know the third treadmill has been dead for a week. It never made it onto a list, so it never got booked in for repair.",
      },
      {
        title: "Members don't report, they leave",
        body: "Most members won't hunt down a staff member to mention a cold shower. They quietly stop coming, then mention it in a one-star review.",
      },
      {
        title: "No record of what broke, or how often",
        body: "When the same machine fails every month, you find out from the repair invoices. There's no history to argue a warranty claim or retire a lemon.",
      },
    ],
    exampleIssues: [
      "Treadmill out of order",
      "Shower running cold",
      "Locker won't lock",
      "Cable machine frayed",
      "Air con not working",
      "Toilet blocked",
      "Free weights missing",
      "Door fob failing",
    ],
    hookTitle: "A code on every machine",
    hookBody:
      "Print a sheet of QR labels and stick one on each piece of kit, each shower, each changing room. When a member or a trainer spots a problem, they point their phone camera at the nearest code, pick what's wrong, and submit. It lands in your dashboard with the exact location, so nobody's guessing which treadmill.",
    outcomes: [
      {
        title: "Fewer silent walkouts",
        body: "Members report a fault in seconds instead of walking out and posting about it. You fix the visible stuff before it dents renewals.",
      },
      {
        title: "Every fault has a home",
        body: "Broken kit gets logged, assigned, and tracked to fixed. No more relying on whoever was on shift to remember.",
      },
      {
        title: "A history you can act on",
        body: "See which machines fail most. Use it to push a warranty claim or to stop buying the brand that keeps breaking.",
      },
    ],
    faqs: [
      {
        q: "Do members need to download anything?",
        a: "No. They point their phone camera at the QR label, which opens a short web form. No app, no account. It takes about 20 seconds.",
      },
      {
        q: "Can I put a code on every machine?",
        a: "Yes. Labels are unlimited on every plan, including the free one. Most gyms tag every machine, every shower, and every changing area.",
      },
      {
        q: "What does it cost to start?",
        a: "Nothing. The Starter plan is free forever with unlimited labels. Upgrade to Prime (£15/mo flat, whole team) when you want your own logo on the report page, no ads, and instant push alerts.",
      },
      {
        q: "Can trainers and reception staff report too?",
        a: "Anyone on site can scan and report — members, trainers, cleaners, reception. Only you and your team need a login to manage what comes in.",
      },
      {
        q: "How is this cheaper than MaintainX or UpKeep?",
        a: "Those tools bill per user per month — MaintainX from $16, UpKeep from $20 — so the cost climbs every time you add a staff member. ScanSolve is one flat £15/mo for the owner plus 20 team members, and unlimited QR labels are free forever. For a single gym logging broken kit, you don't need a per-head CMMS.",
      },
    ],
    seoKeywords: [
      "gym equipment maintenance software",
      "report broken gym equipment",
      "QR code gym equipment reporting",
      "gym maintenance app no per user fee",
      "gym facility issue reporting no app",
    ],
    proofStat: {
      headline: "Gyms lose up to half their members every year.",
      sub: "A broken machine a member never reports is a renewal you never see.",
      source: "IHRSA / industry retention data",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month — a bill that grows every time your team does. ScanSolve is one flat price for the whole team, and putting a code on every machine costs nothing.",
    },
    heroImage: {
      src: "/verticals/gyms-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a gym treadmill fault",
    },
    infographics: [
      {
        src: "/verticals/flow.svg",
        alt: "Four steps: scan the code, report the fault, it gets assigned, it gets resolved",
        caption: "Scan to resolved, in four steps.",
      },
    ],
  },

  // ── Tech / workplace ──────────────────────────────────────────────────────
  {
    slug: "workplace",
    name: "Offices & workplace",
    icon: Building2,
    targetRole: "Regional Facilities Managers and Directors of Workplace Experience",
    metaTitle: "QR issue reporting for offices & workplaces",
    metaDescription:
      "A passing employee scans a QR code and logs a broken meeting room or jammed printer in seconds — no intranet login, no ticket portal. Fix workplace faults before complaints pile up.",
    eyebrow: "For tech & workplace teams",
    headline: "Fix workplace faults before the complaints reach you",
    sub: "The coffee machine's down, meeting room 3's AV won't connect, a desk sensor's stuck. Put a QR code where the fault is and any employee scans to report it in seconds. No intranet login, no ticket portal to learn.",
    secondaryCta: DEMO_CTA("ScanSolve demo — workplace"),
    painTitle: "Why workplace tickets never get raised",
    painIntro:
      "Your ticket portal works, in theory. In practice an employee with a broken monitor won't log in, find the right category, and fill a form. They message a colleague, or say nothing, and the facilities team hears about it as a complaint a week later.",
    pains: [
      {
        title: "The reporting tool has too much friction",
        body: "Intranet login, VPN, the right service-desk category — every step loses a reporter. Most faults never get logged because logging them is a chore.",
      },
      {
        title: "Faults surface as complaints, not tickets",
        body: "By the time a broken booth or a warm meeting room reaches you, three people have grumbled and none of them raised it. You're reacting late.",
      },
      {
        title: "No idea which spaces cause the most grief",
        body: "You can't see that the second-floor kitchen or the east-wing AV eats most of the team's time, because the reports never arrived in one place.",
      },
    ],
    exampleIssues: [
      "Coffee machine down",
      "Meeting room AV broken",
      "Aircon too warm",
      "Printer jammed",
      "Desk height stuck",
      "Kitchen tap leaking",
      "Booth light out",
      "Access door not reading",
    ],
    hookTitle: "Scan where the problem is",
    hookBody:
      "Stick a code on each meeting room door, each printer, each kitchen. An employee who spots a fault scans it with their phone camera, picks the issue, and it's logged against the exact room. No login, nothing to install. The facilities team sees it the moment it's raised and can fix it before it becomes a complaint.",
    outcomes: [
      {
        title: "More faults reported, earlier",
        body: "Take away the login friction and people actually report. You catch the small stuff before it turns into a formal complaint.",
      },
      {
        title: "The exact location, every time",
        body: "Each code is tied to one room or asset, so a report says 'Meeting room 3, west tower', not 'a room upstairs'. Your team goes straight there.",
      },
      {
        title: "See where the time goes",
        body: "Insights shows resolution times by location, so you can prove which spaces need investment and where the hours disappear.",
      },
    ],
    faqs: [
      {
        q: "Do employees need the company intranet or an app?",
        a: "No. They scan the code with their phone camera and fill a short web form. No intranet login, no app, no service-desk account. That friction is exactly what stops people reporting today.",
      },
      {
        q: "Does this need IT or security sign-off to trial?",
        a: "A pilot runs as a standalone web tool outside your core network, with no SSO or integration, so it sidesteps the usual security review. Employees use their phone camera; your facilities lead runs the dashboard in a browser.",
      },
      {
        q: "Can we brand the report page?",
        a: "On Prime, yes — your logo, no ads, no 'Powered by ScanSolve'. An employee scanning a code sees your workplace, not ours.",
      },
      {
        q: "How is this different from our helpdesk?",
        a: "The helpdesk is where a ticket lives once it exists. ScanSolve is how the ticket gets raised in the first place, from the spot where the fault is, by someone who would never open the helpdesk. It can feed the rest later.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those tools bill per user per month — MaintainX from $16, UpKeep from $20, and workplace platforms up to $100 — so the facilities team gets more expensive every time it grows. ScanSolve is one flat £15/mo for the owner plus 20 members, and the employees who scan and report never count as users at all.",
      },
    ],
    seoKeywords: [
      "office facilities issue reporting",
      "workplace maintenance app",
      "report office issues QR code",
      "facilities management software no per user fee",
      "no-login issue reporting",
    ],
    proofStat: {
      headline: "Most workplace faults never get logged.",
      sub: "Something's always broken. Reporting it means opening a portal nobody wants to open — so people just don't.",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX, UpKeep and the rest bill $16–45 per user, every month — so the facilities team gets more expensive every time it grows. ScanSolve is one flat price for the whole team, and the people who scan never count as users.",
    },
    heroImage: {
      src: "/verticals/workplace-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a meeting-room fault",
    },
  },

  // ── Manufacturing ─────────────────────────────────────────────────────────
  {
    slug: "manufacturing",
    name: "Manufacturing & plant",
    icon: Factory,
    targetRole: "Site Maintenance Managers and Plant Facilities Managers",
    metaTitle: "QR issue reporting for manufacturing & plant",
    metaDescription:
      "A QR code on each asset tells your technician exactly which HVAC unit or conveyor failed, with a timestamped record. Report faults from the floor in seconds — no app.",
    eyebrow: "For manufacturing & plant",
    headline: "The code on the machine says which one failed",
    sub: "Tag each asset with its own QR code. When something on the line goes wrong, an operator scans the code on that machine and the report names the exact unit, timestamped to the second. Your technician stops hunting and starts fixing.",
    secondaryCta: DEMO_CTA("ScanSolve demo — manufacturing"),
    painTitle: "Why floor faults cost more than they should",
    painIntro:
      "A conveyor stutters. The operator radios 'line two's playing up', the technician walks the length of it to find which motor, and the clock has been running the whole time. Downtime is lost output, and vague reports make it longer.",
    pains: [
      {
        title: "Reports don't say which asset",
        body: "'The compressor's noisy' means nothing when you have nine. The technician spends the first ten minutes finding the fault instead of fixing it.",
      },
      {
        title: "No timestamped record for compliance",
        body: "When health-and-safety or an auditor asks when a fault was raised and when it was cleared, memory and a paper log don't hold up.",
      },
      {
        title: "Faults get radioed, not recorded",
        body: "A verbal handover between shifts loses half the detail. The next crew inherits a problem nobody wrote down.",
      },
    ],
    exampleIssues: [
      "Conveyor belt slipping",
      "HVAC unit overheating",
      "Guard rail loose",
      "Compressor leaking",
      "Pallet wrapper jammed",
      "Emergency stop faulty",
      "Coolant low",
      "Forklift charger down",
    ],
    hookTitle: "One code per asset",
    hookBody:
      "Give each machine, panel, and unit its own QR label. An operator who spots a fault scans that asset's code, picks what's wrong, and submits from the floor. The report carries the exact asset and a timestamp, so the technician knows what and where before setting off — and you keep a dated record of every fault and fix.",
    outcomes: [
      {
        title: "Faster to the right machine",
        body: "The report names the asset, so the technician goes straight to it. Less walking the line, less downtime per fault.",
      },
      {
        title: "A dated record of every fault",
        body: "Every report is timestamped when raised and when resolved. Export it as CSV for a health-and-safety file or a warranty claim.",
      },
      {
        title: "Nothing lost between shifts",
        body: "A scanned report survives the handover. The next crew sees exactly what's open and where.",
      },
    ],
    faqs: [
      {
        q: "Can each machine have its own code?",
        a: "Yes. Each label maps to one asset, and labels are unlimited on every plan. Tag every machine, panel, and access point on the floor.",
      },
      {
        q: "Is there a timestamped record for audits?",
        a: "Every report records when it was raised and, once closed, when it was resolved. On Prime you can export the data as CSV for a compliance file or a warranty claim.",
      },
      {
        q: "Do operators need an app or a login?",
        a: "No. They scan the asset's code with a phone camera and fill a short form. No app, no account. Only your maintenance team logs in to manage the queue.",
      },
      {
        q: "Does it integrate with our CMMS?",
        a: "A pilot runs standalone with no integration, so you can prove operators will scan and the data is accurate before involving IT. Integrations sit in the Enterprise tier for when you're ready to connect it.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those tools bill per user per month — MaintainX from $16, UpKeep from $20 — so giving every operator a way to report gets expensive fast. ScanSolve is one flat £15/mo for the whole maintenance team, and the operators who scan a code aren't users at all. It complements a CMMS rather than replacing it.",
      },
    ],
    seoKeywords: [
      "manufacturing maintenance QR code",
      "asset fault reporting",
      "report machine faults from the floor",
      "timestamped maintenance audit trail",
      "plant maintenance reporting no app",
    ],
    proofStat: {
      headline: "Equipment failure causes 42% of unplanned downtime.",
      sub: "Every minute a technician spends finding which asset failed is downtime you're paying for.",
      source: "Aberdeen / industry downtime data",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "A CMMS like MaintainX or UpKeep bills $16–45 per user, so giving every operator a way to report gets expensive fast. With ScanSolve the operators who scan aren't users — you pay one flat price.",
    },
    heroImage: {
      src: "/verticals/manufacturing-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for an HVAC unit fault",
    },
  },

  // ── Financial services ────────────────────────────────────────────────────
  {
    slug: "financial-services",
    name: "Financial services",
    icon: Landmark,
    targetRole: "Directors of Facilities Management and Building Managers",
    metaTitle: "QR issue reporting for financial services facilities",
    metaDescription:
      "An independent, timestamped log of every facility fault, raised to resolved. Hold outsourced vendors to their SLA with data, not anecdote. Staff scan to report, no app.",
    eyebrow: "For financial services facilities",
    headline: "A timestamped record your vendor can't argue with",
    sub: "When facilities is outsourced, you're trusting the vendor's own numbers. Put a QR code in every zone, let staff report faults in seconds, and keep your own dated log of when each issue was raised and when it was actually fixed.",
    secondaryCta: DEMO_CTA("ScanSolve demo — financial services"),
    painTitle: "Why outsourced facilities are hard to hold to account",
    painIntro:
      "Your FM contract has SLAs. Proving a breach is another matter, because the only record of when a fault was raised and cleared belongs to the vendor you're trying to hold to account.",
    pains: [
      {
        title: "The vendor owns the only record",
        body: "You raise a fault, the vendor logs it on their system, and their report says it was fixed on time. You have no independent record to check it against.",
      },
      {
        title: "Duplicate call-outs, no visibility",
        body: "The same fault gets reported three times by three people because there's no shared place to see it's already in hand. You pay for the repeat visits.",
      },
      {
        title: "SLA reviews run on anecdote",
        body: "At the quarterly review you argue from memory and a few emails while the vendor arrives with a tidy report. Data wins that meeting; you don't have any.",
      },
    ],
    exampleIssues: [
      "Lift out of service",
      "Reception aircon down",
      "Washroom leak",
      "Meeting room heating stuck",
      "Lighting fault",
      "Access barrier jammed",
      "Vending machine down",
      "Carpet trip hazard",
    ],
    hookTitle: "Your record, not theirs",
    hookBody:
      "Place a code in each zone — reception, each floor, the washrooms, the plant areas. Staff scan to report a fault the moment they see it, and every report is timestamped when raised. When it's cleared, that's timestamped too. You hold an independent log of raise-to-resolve for every issue, separate from whatever the vendor's own system says.",
    outcomes: [
      {
        title: "Independent SLA evidence",
        body: "You have your own dated record of when a fault was raised and when it was resolved, so a quarterly review runs on data instead of memory.",
      },
      {
        title: "Fewer duplicate call-outs",
        body: "Everyone sees a fault is already logged, so it doesn't get reported and charged three times over.",
      },
      {
        title: "See where problems cluster",
        body: "Resolution times and report volume by zone show which areas cost you the most attention, so you can push the vendor where it matters.",
      },
    ],
    faqs: [
      {
        q: "Does this replace our FM provider's system?",
        a: "No. It sits alongside as your own independent record. The vendor keeps working the way they do; you gain a timestamped log of raise-to-resolve that you control and can check their numbers against.",
      },
      {
        q: "Can staff report without an app or account?",
        a: "Yes. Anyone scans the zone's code with a phone camera and submits a short form. No app, no login. Only your team logs in to see the queue and the record.",
      },
      {
        q: "How do we get the SLA data out?",
        a: "Insights shows resolution times by location, and on Prime you can export the underlying data as CSV to take into a vendor review.",
      },
      {
        q: "Is it secure enough for a bank or insurer to trial?",
        a: "A pilot runs as a standalone web tool outside your core network, with no SSO or integration, so it bypasses the full security review. That's by design for a 30-day trial; SSO, audit logging, and a DPA come with an Enterprise contract.",
      },
      {
        q: "Is this another per-seat SaaS bill on top of our FM contract?",
        a: "No. ScanSolve is one flat price for your team, not a per-head licence. You already pay the FM provider; this adds your own independent record of every fault, raised to resolved, for a fixed monthly cost.",
      },
    ],
    seoKeywords: [
      "facilities SLA tracking",
      "outsourced FM vendor accountability",
      "independent maintenance record",
      "facilities issue reporting financial services",
      "vendor SLA evidence",
    ],
    proofStat: {
      headline: "60–70% of FM work is outsourced. Under 30% is measured against an SLA.",
      sub: "Without your own record of raise-to-resolve, the vendor's numbers are the only numbers.",
      source: "FM vendor-management data",
    },
    competitorContrast: {
      heading: "One flat price",
      body: "This isn't another per-seat SaaS bill on top of your FM contract. ScanSolve is one flat price for your team — an independent record of every fault, raised to resolved, that sits alongside the vendor's system.",
    },
    heroImage: {
      src: "/verticals/financial-services-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a lift out of service",
    },
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}
