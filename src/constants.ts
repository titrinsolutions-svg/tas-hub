import { AppData, Project } from './types';
import projectsData from './data/projects.json';

const PROJECTS_FROM_JSON = projectsData as Project[];

export const LOGOS = {
  white: '/logo-white.png',
  color: '/logo-color.png'
};

export const SOIL_TEXTURES = [
  'Sand', 'Loamy Sand', 'Sandy Loam', 'Loam', 'Silt Loam', 'Silt',
  'Sandy Clay Loam', 'Clay Loam', 'Silty Clay Loam', 'Sandy Clay', 'Silty Clay', 'Clay'
];

export const SOIL_MOISTURE = [
  'Dry', 'Damp', 'Moist', 'Wet', 'Saturated'
];

export const DRAINAGE_CLASSES = [
  'Very Rapidly Drained', 'Rapidly Drained', 'Well Drained', 
  'Moderately Well Drained', 'Imperfectly Drained', 'Poorly Drained', 'Very Poorly Drained'
];

export const LCA_CLASSES = [
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7'
];

export const LCA_SUBCLASSES = [
  'A - Droughtiness', 'D - Undesirable structure', 'F - Low fertility', 
  'I - Inundation', 'M - Moisture deficiency', 'N - Salinity', 
  'P - Stoniness', 'R - Shallow depth to bedrock', 'S - Combination of subclasses',
  'T - Topography', 'W - Excess water', 'X - Cumulative minor limitations'
];

export const MUNSELL_HUES = [
  '10R', '2.5YR', '5YR', '7.5YR', '10YR', '2.5Y', '5Y'
];

export const INITIAL_DATA: AppData = {
  lastUpdated: "2026-04-02",
  stats: {
    projects: 25,
    outstanding: "~$14,550",
    received: "$26,850",
    actions: 25
  },
  upcoming: [
    "✅ Apr 1 — Billy's site plan received! CARO soil results in Apr 2. WRITE FARM PLAN NOW for 8646 Mandeville Ave → submit → invoice ~$4,250+.",
    "⚠️ REVIEW — JKCE April invoice draft #26040208 shows $1,575 incl. GST — expected ~$4,200. Verify amount before sending!",
    "💰 OVERDUE — Fanny Liang $10,000 check (was expected week of Mar 30). Follow up now.",
    "🆕 NEW — Hilson (2280 No.6 Rd) — client agreement sent Apr 2. Awaiting signed docs + $5,000 retainer. Time-sensitive (City permit).",
    "📬 UNREAD — Greg Howard (Madrone) replied re: 16960 River Rd — DFO consultation still required. Read and flag for Fanny.",
    "🔴 ASAP — Finish NOI for 10220 Blundell Road, then invoice.",
    "🔴 ASAP — Begin Farm Plan for 10491 Granville Ave — retainer paid, work to start.",
    "🔴 ASAP — Send Gmail Drafts: David Kim (Madrone MSA), Li Moning (10491 Granville).",
    "🔴 8451 No.5 Road — Still awaiting Kash Heed direction on City's 3 conditions.",
    "💰 AWAITING — Collect $7,100 cash from Zack Zhai (13571 Blundell). No invoice.",
    "📄 READ — Peter Zhang unread email (Mar 24): 'Proposed Lavender Land project - 19740 River Road' with PDF.",
    "This week — Reply to Gurveer Nagra, Avtar Thandi, Luis Fang, Kush Bains (Gmail Drafts).",
    "This week — Await Han Le approval of Susan's farm layout (7251 Sidaway).",
    "May 1 — BCIA insurance renewal payment due via HUB International portal.",
  ],
  moneyTracker: {
    incoming: [
      { label: "Fanny — 16960 River Rd (advisory continuation)", amount: "$10,000", when: "THIS WEEK (check)", type: "exp" },
      { label: "Zack — 13571 Blundell (RMA + Farm Plan) CASH", amount: "$7,100", when: "Awaiting", type: "cash" },
      { label: "JKCE — March 2026 Retainer (INVOICE NOW!)", amount: "$4,200", when: "END OF MARCH", type: "needed" },
      { label: "8646 Mandeville — Billy (balance, after farm plan)", amount: "est. ~$4,250+", when: "After completion", type: "exp" },
      { label: "10220 Blundell Rd — NOI (invoice after done)", amount: "TBD", when: "After NOI", type: "exp" },
      { label: "19740 River Rd — Peter Zhang — PAID ✅ + bonus", amount: "Bonus TBD", when: "On completion", type: "done" },
    ],
    outstanding: [
      { inv: "#26031202", label: "Colwood Creek Park — ALC App", amount: "$5,250" },
      { inv: "#26022303", label: "18400 River Rd — Peter Zhang / Bene Canada", amount: "$5,250" },
      { inv: "#26020201", label: "22865 14th Ave", amount: "$4,050" },
    ]
  },
  unmatched: [
    { date: "Feb 20", name: "1201816 BC LTD.", amount: "$1,250", note: "Unknown company — search Gmail to identify" },
    { date: "Mar 13", name: "Luniu Mall / $3,000 e-transfer", amount: "$3,000", note: "Received Mar 13 — confirm which invoice this applies to (likely Farm Road TAS 26.0009)" },
  ],
  resolved: [
    { date: "Mar 26", name: "HONGXING ZHU", amount: "$250", note: "⚠️ 10491 Granville Ave — purpose unclear. Previous: $3,675 (SFU) + $5,000 (retainer). Needs clarification." },
    { date: "Mar 25", name: "W. MADER EXCAVATING & TRUCKING", amount: "$3,900", note: "✓ Invoice #26032001 PAID IN FULL — 37071 Lougheed Hwy SFU Application. Kathy Vink confirmed payment." },
    { date: "Mar 25", name: "PATRICK TELMOSSE-BAGATAVICIU", amount: "$1,312.50", note: "✓ Retainer credit from cancelled 24411 56th Ave project. Message: 'Agricultural advisory services'. RESOLVED." },
    { date: "Mar 24", name: "HONGXING ZHU", amount: "$5,000", note: "✓ Martin Zhang / 10491 Granville Ave — Farm Plan retainer." },
    { date: "Mar 13", name: "LCM FARM LTD.", amount: "$3,000", note: "✓ Billy Bi / Mandeville — payment 1 of 2 for $5,250 retainer" },
    { date: "?", name: "BILLY BI (2nd payment)", amount: "$2,250", note: "✓ Billy Bi / Mandeville — payment 2 of 2. Full $5,250 retainer received." },
    { date: "Mar 10", name: "HONGXING ZHU", amount: "$3,675", note: "✓ Martin Zhang / 10491 Granville — Invoice #26022503 (SFU App)" },
    { date: "Feb 24", name: "ATHIANA ACRES", amount: "$3,675", note: "✓ 12910 No.2 Rd — final retainer, project closed" },
  ],
  weeklyActions: [
    { pri: "h", lane: "now", project: "🏆 8646 Mandeville Ave — WRITE FARM PLAN NOW", task: "✅ All materials received! Site plan from Billy (Apr 1), floor plan (MAIN FLOOR PLAN-A1.pdf), CARO soil results (Apr 2, Work Order 26D0281). Crop: blueberries (confirmed). No farm road. Owner: Chenming LI. Pre-1978 lot confirmed ✅. Write farm plan → submit to City of Burnaby → invoice ~$4,250+ balance." },
    { pri: "h", lane: "now", project: "⚠️ JKCE April Invoice — VERIFY BEFORE SENDING", task: "Invoice #26040208 draft created Apr 2 to Gavin (gavin@jkceprobuild.com). Amount shows $1,575 incl. GST — expected ~$4,200 ($4,000 + GST). ⚠️ Amount may be wrong. Review draft in Gmail, correct if needed, then send." },
    { pri: "h", lane: "now", project: "8451 No. 5 Road — JKCE Stop-Work Escalation 🔴", task: "Still awaiting Kash Heed direction on City's 3 conditions. No new emails today. Do NOT respond to City until Kash confirms. Prepare: fill area drawing + landscaping plan + BP modification (BP 24-038247)." },
    { pri: "h", lane: "now", project: "Terrablue — G Athwal — RETAINER NOT RECEIVED (3+ weeks)", task: "Retainer confirmed Mar 11, followed up Mar 16 — NO RESPONSE for 3+ weeks. Do NOT start work. Follow up AGAIN immediately. $5,000 + GST required. g@terrablue.ca / rajneshram@rocketmail.com" },
    { pri: "h", lane: "now", project: "10220 Blundell Road — Finish NOI", task: "Complete NOI application. Submit. Then invoice client." },
    { pri: "h", lane: "now", project: "10491 Granville Ave — BEGIN Farm Plan (Retainer Paid ✓)", task: "$5,000 retainer received. SEND draft reply to Li Moning (Gmail Drafts). Begin Farm Plan. ⚠️ Clarify $250 extra from Hongxing Zhu. Confirm $1,092 ALC fee paid to CoR." },
    { pri: "h", lane: "now", project: "Gmail Drafts — Send Outstanding Replies", task: "Multiple drafts undelivered: David Kim (Madrone MSA), Li Moning (Granville), Kush Bains (Finn Road). Send all." },
    { pri: "m", lane: "week", project: "16960 River Rd — Fanny Payment OVERDUE + DFO Flag", task: "💰 Fanny's $10,000 check expected week of Mar 30 — still not received Apr 2. Follow up. ALSO: Greg Howard (Madrone, new team) replied Apr 2 — DFO consultation still required (Fanny's observations not sufficient as QP). Greg connecting with DFO Habitat Officer. Read email and flag for Fanny re: DFO process." },
    { pri: "m", lane: "week", project: "7251 Sidaway Road — Susan Sent Farm Layout to Han Le", task: "Susan sent initial farm layout (Fig1.pdf) to Han Le Mar 27 — asked for approval of road/blueberry layout. Han confirmed keeping funds on Farm Plan. Await Han's layout approval → coordinate with Susan to finalize." },
    { pri: "m", lane: "week", project: "19740 River Rd — READ Peter Zhang's Unread Email", task: "UNREAD email from Peter (Mar 24): 'Proposed Lavender Land project - 19740 River Road' with WeChat chat + PDF. Review and determine action needed." },
    { pri: "m", lane: "week", project: "Gurveer Nagra — 14300 Burrows Rd", task: "Reply re: ALR nursery/retail/food trucks/events questions. Potential Farm Plan client." },
    { pri: "m", lane: "week", project: "Avtar Thandi — 22040 River Rd", task: "Reply — confirm TAS scope for ALC stage, provide fee estimate." },
    { pri: "m", lane: "week", project: "Luis Fang — 11388 Westminster Hwy (NOI Referral)", task: "Susan referred Luis for ALC NOI. Reach out: introduce TAS, explain process, fee estimate." },
    { pri: "m", lane: "week", project: "Active Earth / Gundeep — Nanaimo Sewer", task: "Follow up on $4,500 engagement. No response yet from Gundeep." },
    { pri: "m", lane: "week", project: "Patrick Telmosse — $1,312.50 Received ✅", task: "Retainer credit e-transfer received Mar 25 ('Agricultural advisory services'). RESOLVED. Send acknowledgment/draft reply from Gmail Drafts." },
    { pri: "l", lane: "watching", project: "37071 Lougheed Hwy — Wes Mader (ALC Processing)", task: "Invoice PAID ✅ ($3,900 Mar 25). Kathy Vink confirmed. ALC Application #107046 submitted. Awaiting ALC planner assignment." },
    { pri: "l", lane: "watching", project: "13571 Blundell Rd — Zack (Cash Awaiting)", task: "Both reports approved ✅. Cash $7,100 still outstanding. No invoice. No emails this week." },
    { pri: "l", lane: "watching", project: "Colwood Creek Park — Invoice Outstanding", task: "Content submitted. City processing. Invoice #26031202 ($5,250) outstanding. No emails from Ryan this week." },
    { pri: "l", lane: "watching", project: "NDA Project — Andrew Wong (Blundell Rd)", task: "Awaiting Andrew's reply with NDA + scope. No emails this week." },
    { pri: "l", lane: "watching", project: "Farm Road / Luniu Mall (TAS 26.0009)", task: "Product list + photos received Mar 25. Still awaiting Harvey Du re: road m2. Knotweed email UNREAD. $3,000 e-transfer unmatched." },
    { pri: "l", lane: "watching", project: "Port Coquitlam Fill Site — Mark Anderson", task: "Site closed (wet weather). Confirm fee/scope when reopens." },
    { pri: "l", lane: "watching", project: "Lavenderland — Sherry Fang", task: "Fee breakdown sent Mar 25. Awaiting signed agreement + retainer." },
    { pri: "l", lane: "watching", project: "Colin / Urban Soils — 14651 Westminster Hwy", task: "Awaiting correct signed agreement + retainer." },
    { pri: "l", lane: "watching", project: "Aaron Wee — Junior Field Worker", task: "Awaiting rate proposal. First trial: Richmond soil pits." },
    { pri: "l", lane: "watching", project: "Helen Zhou — Bookkeeper Questions", task: "Review and reply to bookkeeping questions (Mar 22). Don't let sit too long." },
    { pri: "l", lane: "watching", project: "BCIA Insurance Renewal — May 1 Deadline", task: "Payment due May 1 via HUB International portal." },
    { pri: "l", lane: "watching", project: "Madrone Collaboration — David Kim", task: "Draft MSA/phased approach in Gmail Drafts. Send when ready." },
    { pri: "l", lane: "watching", project: "8167 256 St — Josh Isaak (Post-Meeting)", task: "Site meeting was Mar 23 (one week ago). No follow-up visible. Follow up to determine scope." },
    { pri: "l", lane: "watching", project: "Finn Road / Kush Bains (TAS 26.0008)", task: "Draft reply in Gmail Drafts. No new emails from Kush." },
  ],
  projects: PROJECTS_FROM_JSON,
  invoices: {
    outstanding: [
      { num: "26031202", client: "City of Colwood — ALC Application", issued: "Mar 12, 2026", amount: "$5,250", status: "outstanding" },
      { num: "26022303", client: "18400 River Road (Peter Zhang / Bene Canada)", issued: "Feb 23, 2026", amount: "$5,250", status: "outstanding" },
      { num: "26020201", client: "22865 14th Ave", issued: "Feb 2, 2026", amount: "$4,050", status: "outstanding" },
    ],
    paid: [
      { num: "26031201", client: "JKCE Probuild — Feb 2026 Retainer ✅ PAID Mar 27", issued: "Mar 12, 2026", amount: "$4,200", status: "paid" },
      { num: "26032001", client: "Wes Mader — 37071 Lougheed Hwy SFU Application", issued: "Mar 20, 2026", amount: "$3,900", status: "paid" },
      { num: "26032002", client: "Martin Zhang — 10491 Granville Ave Farm Plan Retainer", issued: "Mar 20, 2026", amount: "$5,250", status: "paid" },
      { num: "26022503", client: "Martin Zhang — 10491 Granville SFU App", issued: "Feb 25, 2026", amount: "$3,675", status: "paid" },
    ],
    unmatched: [
      { date: "Feb 20", from: "1201816 BC LTD.", amount: "$1,250" },
      { date: "Mar 13", from: "Luniu Mall (e-transfer)", amount: "$3,000" },
    ],
    totals: {
      outstanding: "$14,550",
      paidConfirmed: "$22,537",
      unmatchedReceipts: "$4,250",
      totalInvoiced2026: "$41,337"
    }
  },
  emailTemplates: [
    {
      title: "📄 Invoice — Sending an Invoice",
      tag: "Invoicing",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "Invoice #26XXXXXX — [Project Address] — [Service]",
      body: `Hi [Client Name],

Please find attached Invoice #[INVOICE NUMBER] for [brief description, e.g., "the March 2026 monthly retainer" / "preparation of the Farm Plan at [address]"].

Invoice Details:
• Invoice #: [NUMBER]
• Amount: $[AMOUNT] + GST
• Total: $[TOTAL incl. GST]
• Payment due: Upon receipt

Payment can be made by e-transfer to titrinsolutions@gmail.com. Please use the invoice number as the reference.

Please don't hesitate to reach out if you have any questions.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "✅ Payment Received — Acknowledgment",
      tag: "Invoicing",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "Re: Invoice #26XXXXXX — Payment Confirmed",
      body: `Hi [Client Name],

Thank you — I've received your payment of $[AMOUNT] for Invoice #[NUMBER]. We're all set.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "📝 Draft Report — Sending for Client Review",
      tag: "Reports",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "DRAFT — [Report Type] — [Address] — For Your Review",
      body: `Hi [Client Name],

Please find attached the draft [Farm Plan / FQA / LCA / RMA Report] for [property address] for your review.

Please look over the attached document and let me know if you have any questions, corrections, or additional information to add. Once confirmed, I will finalize and apply my professional stamp.

A few items I'd like your confirmation on:
• [Item 1 — e.g., confirm crop types and acreages listed are accurate]
• [Item 2 — e.g., confirm barn dimensions]
• [Item 3 if applicable]

Please reply with any comments at your earliest convenience.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "📦 Final Report — Stamped and Delivered",
      tag: "Reports",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "FINAL — [Report Type] — [Address] — Tishtaar Titina, PAg, MSc",
      body: `Hi [Client Name],

Please find attached the finalized and stamped [Farm Plan / FQA / LCA / CEMP / RMA Report] for [property address], prepared by Tishtaar Titina, PAg, MSc, Titrin AgriSoil Solutions Ltd.

This report is ready for submission to [City of Richmond / City of Burnaby / ALC / other authority]. Please let me know if the receiving authority requests any further information or revisions.

It has been a pleasure working with you on this project. Please don't hesitate to reach out if anything else is needed.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "🤝 New Client — Agreement & Quote",
      tag: "New Client",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "TAS Client Agreement — [Property Address]",
      body: `Hi [Client Name],

Thank you for reaching out to Titrin AgriSoil Solutions Ltd. (TAS). I'm pleased to assist you with [description of work].

Attached please find our Client Agreement outlining the scope of work and fee structure. The estimated fee for this engagement is $[AMOUNT] + GST.

To proceed, please:
1. Review and sign the attached agreement
2. Return a signed copy to this email address
3. Provide the retainer payment of $[RETAINER AMOUNT] + GST by e-transfer to titrinsolutions@gmail.com

Once I receive the signed agreement and retainer, I will schedule a site visit and begin work.

Please don't hesitate to reach out if you have any questions.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "🔔 Follow-Up — No Response",
      tag: "Follow-Up",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "Following Up — [Project / Subject]",
      body: `Hi [Client Name],

I wanted to follow up on my previous email regarding [brief description].

Could you please let me know [your thoughts / if you've received the document / your availability]?

Please don't hesitate to reach out if you have any questions.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "📅 Site Visit — Confirmation",
      tag: "Scheduling",
      toPlaceholder: "client@email.com",
      subjectPlaceholder: "Site Visit Confirmation — [Address] — [Date]",
      body: `Hi [Client Name],

This email confirms our site visit at [property address] on [Day, Date] at [TIME].

Please ensure that [access is available / gates are unlocked / a representative is present].

If you need to reschedule, please let me know as soon as possible.

See you then.

Best, T

--
Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    },
    {
      title: "🏛️ Submission to Municipality or ALC",
      tag: "Regulatory",
      toPlaceholder: "staff@city.ca",
      subjectPlaceholder: "[Report Type] Submission — [Address] — [Client] — TAS File [YY.XXXX]",
      body: `Dear [Staff Name],

Please find attached the [Farm Plan / Fill Quality Assessment / RMA Report / ALC Application package] for the property at [address], prepared by Tishtaar Titina, PAg, MSc, on behalf of [Client Name].

The attached report has been prepared in accordance with [applicable bylaw / ALC policy / Riparian Areas Regulation] and addresses the requirements for [brief description].

Please let me know if any additional information is required to complete the review.

Sincerely,

Tishtaar Titina, PAg, MSc
Titrin AgriSoil Solutions Ltd.
778-885-9771 | titrinsolutions@gmail.com | titrin.com
TAS File No. [YY.XXXX]

This e-mail message, including any attachments, is for the sole use of the intended recipient(s) and may contain confidential and privileged information. Any unauthorized review, use, disclosure or distribution is prohibited. If you are not the intended recipient, please contact the sender by reply e-mail and destroy all copies of the original message.`
    }
  ]
};
