import {
  Dumbbell,
  Building2,
  Factory,
  Landmark,
  ShoppingBag,
  Hotel,
  TrainFront,
  GraduationCap,
  Briefcase,
  Home,
  Wrench,
  type LucideIcon,
} from "lucide-react";

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
        a: "Nothing. The Starter plan is free forever with unlimited labels. Upgrade to Prime (£15/mo flat, whole team) when you want your own logo on the report page and instant push alerts.",
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
        a: "On Prime, yes — your logo replaces the 'Powered by ScanSolve' badge. An employee scanning a code sees your workplace, not ours.",
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

  // ── Retail ────────────────────────────────────────────────────────────────
  {
    slug: "retail",
    name: "Retail",
    icon: ShoppingBag,
    targetRole: "store managers and area managers",
    metaTitle: "QR issue reporting for retail stores",
    metaDescription:
      "Staff scan a code and log a warm chiller or a dead light in seconds — no app, no login. Head office sees every store's faults in one place. Free to start.",
    eyebrow: "For retail",
    headline: "The fault on the shop floor, logged before it costs a sale",
    sub: "Put a QR code on every chiller, fitting room, and light panel. Staff scan and report in about 20 seconds — no app, no login. You see it the moment it's raised, across every store.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why store faults cost more than the repair",
    painIntro:
      "A chiller drifts warm on a Saturday. The duty manager means to phone it in, gets pulled to a till, and forgets. By Monday it's a skip full of stock and a repair bill.",
    pains: [
      {
        title: "Faults get mentioned, not logged",
        body: "Staff tell whoever's nearest. It never reaches a list, so it never gets booked in, and the same fault resurfaces next week.",
      },
      {
        title: "Head office is blind between visits",
        body: "You learn how a store is really running from an area visit or an invoice. By then the customer already saw the dead lighting and the taped-off fitting room.",
      },
      {
        title: "No history to argue with",
        body: "When the same chiller fails every month you have nothing dated to take to the supplier, or to justify replacing it.",
      },
    ],
    exampleIssues: [
      "Chiller not cold",
      "Lighting out",
      "Fitting room broken",
      "Freezer door seal",
      "Till point fault",
      "Toilet blocked",
      "Escalator stopped",
      "Signage damaged",
    ],
    hookTitle: "A code on every asset that matters",
    hookBody:
      "Print labels and stick one on each chiller, fitting room, and back-of-house door. Anyone on shift who spots a problem points a phone at the nearest code, picks what's wrong, and submits. It lands with the exact store and asset, so nobody is decoding \"the fridge is playing up\" three days later.",
    outcomes: [
      {
        title: "Faults reported on shift",
        body: "The person who spots it reports it in seconds, instead of hoping to remember at the end of a shift.",
      },
      {
        title: "One view across every store",
        body: "Every site reports into the same dashboard, so you can see which stores are struggling without driving to them.",
      },
      {
        title: "A dated record per asset",
        body: "See which units fail repeatedly. Use it on a warranty claim, or to stop replacing the same part twice a year.",
      },
    ],
    faqs: [
      {
        q: "Do staff need an app or a login?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no account. Only your managers log in to see what's come in.",
      },
      {
        q: "Can we use it across every store?",
        a: "Yes. Labels and locations are unlimited on every plan, including the free one, so you can tag every asset in every store without a bill per site.",
      },
      {
        q: "What does it cost to start?",
        a: "Nothing. Starter is free forever with unlimited labels. Prime is £15/mo flat for the owner plus 20 team members, when you want your own branding and instant alerts.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20 — so a multi-store team gets expensive fast. ScanSolve is one flat price for the team, and the staff who scan a code aren't users at all.",
      },
    ],
    seoKeywords: [
      "retail store maintenance software",
      "report broken store equipment",
      "QR code retail issue reporting",
      "multi-site retail facilities management",
      "shop floor fault reporting",
    ],
    proofStat: {
      headline: "The fault your customer sees is the one nobody logged.",
      sub: "Staff spot it on shift and mean to report it. If reporting takes more than a few seconds, it doesn't happen.",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month — so every store manager you add costs more. ScanSolve is one flat price for the whole team, and tagging every asset in every store costs nothing.",
    },
    heroImage: {
      src: "/verticals/retail-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a retail chiller fault",
    },
  },

  // ── Hotels ────────────────────────────────────────────────────────────────
  {
    slug: "hotels",
    name: "Hotels",
    icon: Hotel,
    targetRole: "hotel maintenance and duty managers",
    metaTitle: "QR issue reporting for hotels",
    metaDescription:
      "Housekeeping scans a code and logs a broken aircon or a leaking shower in seconds — no app. Fix guest-facing faults before they become a one-star review. Free to start.",
    eyebrow: "For hotels",
    headline: "Fix it before it becomes a one-star review",
    sub: "Put a QR code in every room and plant area. Housekeeping or a guest scans and reports a fault in about 20 seconds — no app, no login. You fix it before checkout, not after the review lands.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why guest-facing faults hit revenue",
    painIntro:
      "A room's aircon fails on a Friday. Housekeeping notices, mentions it at handover, and it doesn't get written down. The guest never rings reception. They write it on Booking.com instead.",
    pains: [
      {
        title: "Housekeeping spots it, the log loses it",
        body: "The person who sees the fault has their hands full. A verbal handover or a note on a pad is where most faults die.",
      },
      {
        title: "Guests don't tell you, they tell the internet",
        body: "Most guests won't ring down about a dripping shower. They mention it in a review, where it costs you the next booking too.",
      },
      {
        title: "No record of which rooms keep failing",
        body: "The same units fail again and again, and it only shows up in the repair invoices, never in time to plan a replacement.",
      },
    ],
    exampleIssues: [
      "Aircon broken",
      "TV no signal",
      "Shower leaking",
      "No hot water",
      "Door lock faulty",
      "Toilet running",
      "Kettle missing",
      "Light out",
    ],
    hookTitle: "A code in every room",
    hookBody:
      "Stick a label inside each room, plant room, and corridor. When housekeeping or a guest spots a problem, they point a phone at it, pick the fault, and submit. It reaches maintenance with the room number attached, so nobody is chasing \"a shower on the third floor\".",
    outcomes: [
      {
        title: "Faults caught before checkout",
        body: "The fault is logged the moment it's seen, so you have hours to fix it rather than reading about it a week later.",
      },
      {
        title: "Fewer reviews about the basics",
        body: "Aircon, hot water, and the TV are what reviews punish. Catching them early protects the rating that drives your bookings.",
      },
      {
        title: "A record per room",
        body: "See which rooms and which units fail most, and plan the refurb from evidence rather than a hunch.",
      },
    ],
    faqs: [
      {
        q: "Do guests or housekeeping need an app?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no account. Only your team logs in to manage what comes in.",
      },
      {
        q: "Can we put a code in every room?",
        a: "Yes. Labels are unlimited on every plan, including the free one. Most hotels tag every room plus the plant and back-of-house areas.",
      },
      {
        q: "Can we brand the report page?",
        a: "On Prime, yes — your logo replaces the \"Powered by ScanSolve\" badge. A guest scanning a code in your room sees your hotel, not us.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20 — so putting reporting in every housekeeper's hands gets expensive. ScanSolve is one flat £15/mo for the team, and the people who scan a code aren't users.",
      },
    ],
    seoKeywords: [
      "hotel maintenance software",
      "hotel room fault reporting",
      "QR code hotel maintenance",
      "housekeeping maintenance reporting app",
      "hotel facilities issue reporting",
    ],
    proofStat: {
      headline: "One bad review sends 22% of bookers elsewhere. Four sends 70%.",
      sub: "Aircon, hot water and the shower are what reviews punish, and they're exactly what gets spotted on a round and never logged.",
      source: "Go Fish Digital review-impact survey",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month — so every housekeeper who needs to report costs you more. ScanSolve is one flat price for the team, and the people scanning codes never count as users.",
    },
    heroImage: {
      src: "/verticals/hotels-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a hotel room aircon fault",
    },
  },

  // ── Rail & transport ──────────────────────────────────────────────────────
  {
    slug: "rail",
    name: "Rail & transport",
    icon: TrainFront,
    targetRole: "fleet and station facilities managers",
    metaTitle: "QR issue reporting for rail and transport",
    metaDescription:
      "Staff and passengers scan a code in a carriage or station and report a blocked toilet or a broken door in seconds — no app. Every report names the exact unit. Free to start.",
    eyebrow: "For rail & transport",
    headline: "The report names the carriage, not \"somewhere on the 08:14\"",
    sub: "Put a QR code in each carriage, toilet, and station area. Staff, cleaners, or passengers scan and report in about 20 seconds — no app, no login. Every report carries the exact unit and the time.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why faults on a moving fleet go unfixed",
    painIntro:
      "A toilet goes out of service somewhere on a six-car set. The cleaner knows, the guard knows, and by the time it reaches the depot nobody can say which unit or when. So it runs another day out of service.",
    pains: [
      {
        title: "Reports don't name the unit",
        body: "\"A toilet's out on the Brighton service\" means little to a depot with a hundred vehicles. The fault gets found by whoever trips over it next.",
      },
      {
        title: "Nothing survives the handover",
        body: "Crews change, cleaners rotate, and a verbal report evaporates. The next shift inherits a fault nobody wrote down.",
      },
      {
        title: "Passengers see it before you do",
        body: "The people who notice most are the ones with no way to tell you, so the first you hear is a complaint or a post online.",
      },
    ],
    exampleIssues: [
      "Toilet blocked",
      "Door won't close",
      "Seat damaged",
      "Light out",
      "Aircon off",
      "Graffiti",
      "Litter overflowing",
      "Screen blank",
    ],
    hookTitle: "A code in every carriage",
    hookBody:
      "Put a label in each carriage, toilet, and station zone. Anyone who spots a fault — a cleaner, the guard, a passenger — points a phone at the nearest code and submits. The report carries the exact vehicle and location, timestamped, so the depot knows what's waiting before the unit arrives.",
    outcomes: [
      {
        title: "The exact unit, every time",
        body: "Each code maps to one carriage or zone, so a report says which vehicle and where, not a rough guess.",
      },
      {
        title: "Nothing lost at handover",
        body: "A scanned report outlives the shift. The next crew and the depot see exactly what's open.",
      },
      {
        title: "Passengers can tell you",
        body: "Give the people who see the fault first a way to report it in seconds, with no app and no account.",
      },
    ],
    faqs: [
      {
        q: "Do passengers need an app?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no account. Only your team logs in to manage reports.",
      },
      {
        q: "Does it work on a moving train with patchy signal?",
        a: "The reporter needs a connection to submit, so codes work best where there's mobile coverage or onboard Wi-Fi. Stations, depots and most urban routes are fine; on a rural stretch a report may have to wait for signal. There's no offline queue today.",
      },
      {
        q: "Can we tag every carriage?",
        a: "Yes. Labels and locations are unlimited on every plan, including the free one, so you can tag every vehicle and every station zone.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20 — so a large fleet team is a growing per-head bill. ScanSolve is one flat price for the team, and the crew, cleaners and passengers who scan a code aren't users.",
      },
    ],
    seoKeywords: [
      "rail maintenance reporting",
      "train carriage fault reporting",
      "QR code rail facilities",
      "station maintenance software",
      "passenger fault reporting",
    ],
    proofStat: {
      headline: "The people who see the fault first can't tell you.",
      sub: "Cleaners, crew and passengers spot it in the carriage. Without a way to report in seconds, it reaches the depot late, or never.",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month, so widening reporting across a fleet team costs more every time. ScanSolve is one flat price, and the crew, cleaners and passengers who scan a code never count as users.",
    },
    heroImage: {
      src: "/verticals/rail-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a train carriage fault",
    },
  },

  // ── Schools ───────────────────────────────────────────────────────────────
  {
    slug: "schools",
    name: "Schools",
    icon: GraduationCap,
    targetRole: "site managers, caretakers and business managers",
    metaTitle: "QR issue reporting for schools",
    metaDescription:
      "Staff scan a code and log a cold radiator, a dead projector, or a trip hazard in seconds — no app, no login. The site team sees every job in one place. Free to start.",
    eyebrow: "For schools",
    headline: "The caretaker can't be everywhere. The codes can.",
    sub: "Put a QR code in every classroom, corridor, and plant room. Any member of staff scans and reports a fault in about 20 seconds — no app, no login. The site team sees it the moment it's raised.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why school jobs pile up",
    painIntro:
      "A radiator's cold in Block C. A teacher mentions it in the corridor, the caretaker is already dealing with a leak, and it never gets written down. Three weeks later it's still cold, and now it's a complaint.",
    pains: [
      {
        title: "Jobs get reported in the corridor",
        body: "Staff tell whoever they pass. Nothing reaches a list, so the site team works from memory and from whoever asked most recently.",
      },
      {
        title: "Safety jobs sit in the same pile",
        body: "A trip hazard and a wobbly projector arrive by the same informal route, so the urgent one isn't obvious until somebody gets hurt.",
      },
      {
        title: "No record when it matters",
        body: "When you need to show a job was raised and cleared — for a governor, an inspection, or an insurer — memory and a notepad don't stand up.",
      },
    ],
    exampleIssues: [
      "Heating off",
      "Projector broken",
      "Tap leaking",
      "Trip hazard",
      "Door won't lock",
      "Window stuck",
      "Light out",
      "Toilet blocked",
    ],
    hookTitle: "A code in every room",
    hookBody:
      "Print labels and put one in each classroom, corridor, and plant room. When a teacher or a cleaner spots something, they point a phone at the nearest code, pick the fault, and submit. It reaches the site team with the exact room and a timestamp, so nothing depends on catching the caretaker between lessons.",
    outcomes: [
      {
        title: "Every job in one list",
        body: "Staff report in seconds from the room, so the site team works from a real list instead of corridor conversations.",
      },
      {
        title: "Safety jobs surface fast",
        body: "A trip hazard gets logged the moment it's seen and can be prioritised, rather than waiting for someone to mention it.",
      },
      {
        title: "A dated record",
        body: "Every job is timestamped when raised and when cleared. Useful for governors, insurers, and anyone asking what happened.",
      },
    ],
    faqs: [
      {
        q: "Do staff need an app or a login?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no account. Only your site team logs in to manage the jobs.",
      },
      {
        q: "Can pupils report things too?",
        a: "That's your call — anyone who can scan a code can report. Some schools put codes in staff areas only; others tag toilets and corridors so pupils can flag problems. You choose where the codes go.",
      },
      {
        q: "Can we tag every classroom?",
        a: "Yes. Labels are unlimited on every plan, including the free one, so you can tag every room, corridor and plant area at no cost.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20 — which is unworkable if you want every teacher able to report. ScanSolve is one flat £15/mo for the site team, and the staff who scan a code aren't users at all.",
      },
    ],
    seoKeywords: [
      "school maintenance software",
      "school site manager reporting",
      "QR code school facilities",
      "report school building faults",
      "caretaker job reporting",
    ],
    proofStat: {
      headline: "£13.8bn — the maintenance backlog across England's schools.",
      sub: "Around one in six pupils learns in a building needing major repair. The jobs that never get logged are how a backlog starts.",
      source: "National Audit Office, October 2024",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month — unworkable when you want every teacher able to report. ScanSolve is one flat price for the site team, and the staff who scan a code never count as users.",
    },
    heroImage: {
      src: "/verticals/schools-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a school classroom fault",
    },
  },

  // ── Serviced offices & co-working ─────────────────────────────────────────
  {
    slug: "serviced-offices",
    name: "Serviced offices",
    icon: Briefcase,
    targetRole: "co-working and serviced-office operators",
    metaTitle: "QR issue reporting for serviced offices & co-working",
    metaDescription:
      "Members scan a code and report a dead coffee machine or broken meeting-room AV in seconds — no app, no Slack thread. Fix it before it dents renewals. Free to start.",
    eyebrow: "For serviced offices & co-working",
    headline: "Members notice everything. Give them a way to tell you.",
    sub: "Put a QR code in every meeting room, kitchen, and booth. Members scan and report in about 20 seconds — no app, no login, no Slack thread to chase. You fix it before it shows up at renewal.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why small faults cost members",
    painIntro:
      "The coffee machine dies on a Tuesday. Three members notice, one mentions it in a Slack channel nobody owns, and it's still dead on Friday. None of them raise it again. They just remember it at renewal.",
    pains: [
      {
        title: "Complaints scatter across channels",
        body: "A Slack message, a word at the desk, an email to someone's personal inbox. There's no single place a fault lands, so half of them evaporate.",
      },
      {
        title: "Members stop telling you",
        body: "People report a fault once. If nothing visibly happens, they stop bothering and start counting it against the value of the desk.",
      },
      {
        title: "You can't see which spaces cost you",
        body: "Meeting-room AV and the second-floor kitchen might eat most of your team's time, and you'd never know, because the reports never pooled anywhere.",
      },
    ],
    exampleIssues: [
      "Wi-Fi down",
      "AC too cold",
      "Coffee machine out",
      "Meeting room AV",
      "Printer jammed",
      "Booth light out",
      "Kitchen tap leaking",
      "Door fob failing",
    ],
    hookTitle: "A code in every space",
    hookBody:
      "Stick a label in each meeting room, kitchen, booth, and washroom. A member who spots a problem points a phone at it, picks the fault, and submits. It lands with the exact space attached. No Slack thread, no login, no waiting for someone to be at the desk.",
    outcomes: [
      {
        title: "Faults land in one place",
        body: "Every report pools in one dashboard instead of scattering across Slack, email, and the front desk.",
      },
      {
        title: "Members see things get fixed",
        body: "A fault raised in seconds and closed quickly is what makes a space feel properly run. That's what renews desks.",
      },
      {
        title: "See which spaces need work",
        body: "Insights shows resolution times by location, so you can prove which rooms deserve the budget.",
      },
    ],
    faqs: [
      {
        q: "Do members need an app or an account?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no login. Only your team logs in to manage what comes in.",
      },
      {
        q: "Can we brand the report page?",
        a: "On Prime, yes — your logo replaces the \"Powered by ScanSolve\" badge. A member scanning a code sees your space, not us.",
      },
      {
        q: "Can we tag every room?",
        a: "Yes. Labels are unlimited on every plan, including the free one, so you can tag every meeting room, booth, and kitchen at no cost.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20, and workplace platforms up to $100 — so the bill grows with your team. ScanSolve is one flat £15/mo, and the members who scan a code never count as users.",
      },
    ],
    seoKeywords: [
      "coworking space maintenance",
      "serviced office facilities management",
      "QR code member issue reporting",
      "meeting room fault reporting",
      "managed office maintenance software",
    ],
    proofStat: {
      headline: "Members report a fault once.",
      sub: "If nothing visibly happens, they stop telling you and start counting it against the desk at renewal.",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX, UpKeep and the workplace platforms bill $16–100 per user, per month — a bill that grows with your team. ScanSolve is one flat price, and the members who scan a code never count as users.",
    },
    heroImage: {
      src: "/verticals/serviced-offices-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a meeting-room fault",
    },
  },

  // ── Residential blocks ────────────────────────────────────────────────────
  {
    slug: "residential",
    name: "Residential blocks",
    icon: Home,
    targetRole: "block and property managers, and managing agents",
    metaTitle: "QR issue reporting for residential blocks",
    metaDescription:
      "Residents scan a code in the lobby and report a broken lift or a leak in seconds — no app, no phone tag. Every report is dated and tracked to done. Free to start.",
    eyebrow: "For residential blocks",
    headline: "Residents stop chasing when they can see it's logged",
    sub: "Put a QR code in every lobby, bin store, and plant room. Residents scan and report a communal fault in about 20 seconds — no app, no login. Every report is dated and tracked through to done.",
    secondaryCta: { label: "See pricing", href: "/pricing" },
    painTitle: "Why communal repairs turn into complaints",
    painIntro:
      "The lift goes out on a Saturday. Four residents email, two ring the out-of-hours line, and one posts in the WhatsApp group. You get the same fault six times, and none of them know it's already in hand.",
    pains: [
      {
        title: "The same fault arrives six ways",
        body: "Emails, calls, and a WhatsApp group. You spend the morning working out whether it's one problem or four, while residents assume nobody's listening.",
      },
      {
        title: "Residents chase because they can't see progress",
        body: "Once a resident reports something, silence looks like inaction. So they chase, and the chasing costs more time than the repair.",
      },
      {
        title: "Nothing dated when it's disputed",
        body: "At a service-charge query or a dispute, \"we dealt with it promptly\" needs a date. Scattered emails don't give you one.",
      },
    ],
    exampleIssues: [
      "Lift not working",
      "Communal light out",
      "Bin store full",
      "Water leak",
      "Entry door fault",
      "Car park gate",
      "Fire door propped",
      "Corridor damage",
    ],
    hookTitle: "A code in every communal space",
    hookBody:
      "Put a label in each lobby, bin store, car park, and plant room. A resident who spots a fault points a phone at it, picks the problem, and submits. It arrives with the exact block and location, dated, and they can leave an email to get updates. So they stop chasing you.",
    outcomes: [
      {
        title: "One fault, one record",
        body: "Six residents reporting the same lift becomes one tracked job instead of a morning of triage.",
      },
      {
        title: "Residents stop chasing",
        body: "They can leave an email and get updates as it moves, so silence stops looking like inaction.",
      },
      {
        title: "A dated record for disputes",
        body: "Every report is timestamped when raised and when cleared. That's the evidence you need at a service-charge query.",
      },
    ],
    faqs: [
      {
        q: "Do residents need an app?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no account. They can leave an email if they want updates.",
      },
      {
        q: "Won't we get duplicate or nuisance reports?",
        a: "Reports are rate-limited per reporter, and duplicates are easy to spot because each one carries the exact location, so you close them into a single job. A code only opens your block's form.",
      },
      {
        q: "Can we tag every block?",
        a: "Yes. Labels and locations are unlimited on every plan, including the free one, so you can tag every block, lobby, and plant room at no cost.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20 — so a managing agent's team is a growing per-head bill. ScanSolve is one flat £15/mo, and the residents who scan a code never count as users.",
      },
    ],
    seoKeywords: [
      "residential block maintenance",
      "managing agent repairs reporting",
      "QR code communal repairs",
      "leaseholder fault reporting",
      "property management issue tracking",
    ],
    proofStat: {
      headline: "One broken lift. Six reports. No shared record.",
      sub: "Residents chase because silence looks like inaction. A dated, tracked report is what stops the chasing.",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month — so every property manager you add costs more. ScanSolve is one flat price for the team, and the residents who scan a code never count as users.",
    },
    heroImage: {
      src: "/verticals/residential-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a communal lift fault",
    },
  },

  // ── FM companies ──────────────────────────────────────────────────────────
  {
    slug: "fm-companies",
    name: "FM companies",
    icon: Wrench,
    targetRole: "facilities management contractors running multiple client sites",
    metaTitle: "QR issue reporting for facilities management companies",
    metaDescription:
      "Client-site staff scan a code and report a fault in seconds — no app, no helpdesk call. You get a timestamped record per site and one list across the contract. Free to start.",
    eyebrow: "For FM companies",
    headline: "Every client site reporting into one place",
    sub: "Put QR codes across each client site. Their staff and visitors scan and report a fault in about 20 seconds — no app, no login, no call to your helpdesk. You get a dated record per site and one list across the contract.",
    secondaryCta: DEMO_CTA("ScanSolve demo — FM companies"),
    painTitle: "Why the first report is the expensive one",
    painIntro:
      "A client's aircon fails. Their staff ring your helpdesk, describe the wrong room, and your engineer arrives with the wrong part. The SLA clock started the moment somebody picked up the phone, and the callback is on you.",
    pains: [
      {
        title: "Reports arrive by phone, and vague",
        body: "\"The aircon's out upstairs\" costs an engineer a visit to find out what and where. First-time fix suffers, and so does the margin.",
      },
      {
        title: "You're judged on a clock you can't see start",
        body: "The SLA runs from when the fault was raised. If that moment lives in a phone call, you're proving your performance from memory.",
      },
      {
        title: "No single view across sites",
        body: "Each contract reports differently, so you can't see which sites eat the most hours until the month-end review.",
      },
    ],
    exampleIssues: [
      "Aircon down",
      "Door fob failing",
      "Leak reported",
      "Light out",
      "Lift fault",
      "Washroom closed",
      "Heating off",
      "Window damaged",
    ],
    hookTitle: "A code on every client site",
    hookBody:
      "Tag each client's rooms and assets with a label. Their staff report a fault by pointing a phone at the nearest code, with no call to your helpdesk and no app. Each report carries the exact site, location, and a timestamp, so your engineer knows what and where before setting off, and you hold a dated record of when the clock started.",
    outcomes: [
      {
        title: "Better first-time fix",
        body: "The report names the site and the asset, so an engineer turns up knowing what they're fixing instead of diagnosing on arrival.",
      },
      {
        title: "A dated record per site",
        body: "Every fault is timestamped when raised and when cleared. That's your evidence at the contract review, rather than a recollection.",
      },
      {
        title: "Fewer calls to the helpdesk",
        body: "Client staff report in seconds from where the fault is, so routine faults stop arriving as phone calls.",
      },
    ],
    faqs: [
      {
        q: "Do client staff need an app or an account?",
        a: "No. They point a phone camera at the code and fill a short form. No app, no login. Only your team logs in to manage what comes in.",
      },
      {
        q: "Can we brand it for each client?",
        a: "On Prime your own logo replaces the ScanSolve badge, so the report page carries your brand rather than ours. Per-client custom domains and full white-label sit in the Enterprise tier.",
      },
      {
        q: "Does it give us a multi-site SLA dashboard?",
        a: "Not today, and we'd rather say so. You get a timestamped raise-to-resolve record per site, a dashboard per organisation, and Insights with resolution times by location, exportable as CSV on Prime. A cross-contract SLA dashboard and vendor scorecards are Enterprise roadmap, not shipped.",
      },
      {
        q: "How is this cheaper than a CMMS like MaintainX or UpKeep?",
        a: "Those bill per user per month — MaintainX from $16, UpKeep from $20 — so widening reporting across client sites is a growing per-head bill. ScanSolve is one flat £15/mo per organisation, and the client staff who scan a code never count as users.",
      },
    ],
    seoKeywords: [
      "facilities management contractor software",
      "multi-site fault reporting",
      "QR code FM reporting",
      "client site maintenance reporting",
      "first-time fix reporting",
    ],
    proofStat: {
      headline: "Under 30% of FM operations measure contractor performance against a documented SLA.",
      sub: "When the clock starts in a phone call, you're proving your performance from memory.",
      source: "FM vendor-management data",
    },
    competitorContrast: {
      heading: "No per-seat tax",
      body: "MaintainX and UpKeep bill $16–20 per user, per month — so putting reporting on every client site is a bill that grows with every head. ScanSolve is one flat price, and the client staff who scan a code never count as users.",
    },
    heroImage: {
      src: "/verticals/fm-companies-hero.svg",
      alt: "A ScanSolve QR label beside a phone showing the report form for a client-site aircon fault",
    },
  },
];

export function getVertical(slug: string): Vertical | undefined {
  return VERTICALS.find((v) => v.slug === slug);
}
