import { AppData } from './types';

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
  projects: [
    {
      name: "37071 Lougheed Hwy, Dewdney — TAS 25.0098",
      client: "Wes Mader / W Mader Excavating & Trucking (wmader@telus.net) · FVRD: Austin Stobbs (astobbs@fvrd.ca)",
      badge: "sfu", badgeLabel: "SFU Application",
      status: "active",
      note: "✅ INVOICE PAID IN FULL ($3,900 Mar 25). Kathy Vink confirmed payment. ALC Application #107046 submitted and acknowledged by FVRD. Awaiting ALC planner assignment.",
      action: "Await ALC planner assignment. Project in ALC's hands.",
      actionType: "normal"
    },
    {
      name: "8646 Mandeville Ave, Burnaby — TAS 26.0001",
      client: "Billy Bi (billybiwe@gmail.com) · C. Li · Company: LCM FARM LTD. · Owner: Chenming LI",
      badge: "fp", badgeLabel: "Farm Plan",
      status: "urgent",
      note: "✅ ALL MATERIALS IN HAND — WRITE FARM PLAN NOW. Site plan received Apr 1. Floor plan (MAIN FLOOR PLAN-A1.pdf) received. CARO soil test results arrived Apr 2 (Work Order 26D0281). Crop: blueberries (confirmed). No farm road. Lot pre-1978 confirmed ✅ (ALC Plan No.7, July 1974). Full $5,250 retainer paid.",
      action: "WRITE FARM PLAN → submit to City of Burnaby + client → invoice ~$4,250+ balance.",
      actionType: "urgent"
    },
    {
      name: "13571 Blundell Rd, Richmond — TAS 26.0002",
      client: "Zack Zhai (zackzhaiyi@gmail.com) · Bob / City Concept (cityconcept@hotmail.com)",
      badge: "fp", badgeLabel: "Farm Plan + RMA",
      status: "active",
      note: "✅ CITY APPROVED — Both RMA Report and Farm Plan approved by City of Richmond. 💰 CASH PAYMENT CONFIRMED: $3,550 (RMA) + $3,550 (Farm Plan) = $7,100 cash total. NO INVOICE to be generated. CoR CD 205705 ongoing (RZ application for greenhouse).",
      action: "Collect $7,100 cash from Zack. Once received, mark project complete.",
      actionType: "normal"
    },
    {
      name: "8451 No. 5 Road (JKCE Retainer)",
      client: "JKCE Probuild — Phoebe · Judy Chu · James Wang · Councillor Kash Heed (kheed@telus.net)",
      badge: "fp", badgeLabel: "Retainer",
      status: "urgent",
      note: "🔴 STOP-WORK ORDER ESCALATION. James Hnatowich (CoR) 3-step path: (1) BP mod for retaining wall, (2) fill area drawing, (3) landscaping screening. Tish forwarded to Kash Heed, awaiting direction. Feb retainer PAID ✅. ⚠️ April invoice draft #26040208 created Apr 2 to Gavin — shows $1,575 incl. GST (expected ~$4,200). VERIFY BEFORE SENDING.",
      action: "⚠️ Review + fix JKCE April invoice amount before sending. Await Kash Heed direction → prepare fill area drawing + landscaping plan → apply for BP modification (BP 24-038247).",
      actionType: "urgent"
    },
    {
      name: "Colwood Creek Park",
      client: "City of Colwood — Ryan Campeau (rcampeau@colwood.ca)",
      badge: "alc", badgeLabel: "ALC Application",
      status: "active",
      note: "Municipal-initiated ALC exclusion application. TAS content submitted Mar 17. Ryan confirmed receipt Mar 19: 'Thanks for the well thought out content. We'll insert it into the application and keep you posted.' City handling portal submission. Invoice #26031202 outstanding ($5,250).",
      action: "Await update from Ryan on ALC portal submission. Follow up on outstanding invoice #26031202 ($5,250).",
      actionType: "normal"
    },
    {
      name: "7251 Sidaway Road, Richmond — NEW",
      client: "Lily Qian (lilyqian2012@gmail.com) · Han Le (hanle02@yahoo.com) · Susan Van der Ende (Madrone)",
      badge: "fp", badgeLabel: "Farm Plan + Road",
      status: "active",
      note: "Susan sent initial farm layout (25.0029_Fig1.pdf) to Han Le Mar 27 — asked Han to approve road/blueberry layout to finalize Farm Plan. Han confirmed keeping remaining funds on Farm Plan. Geotech received Mar 23 ✓. Project delayed 1+ year for road layout — Susan proposed estimating locations to finalize.",
      action: "Await Han Le's approval of Susan's farm layout. Coordinate with Susan once approved. Reply to Han Le re: cost/timeline. Get client agreement signed.",
      actionType: "normal"
    },
    {
      name: "Terrablue ALC Package — TAS 26.0005",
      client: "G Athwal (g@terrablue.ca) · Ram Raj (rajneshram@rocketmail.com)",
      badge: "fqa", badgeLabel: "Reclamation + FQA",
      status: "hold",
      note: "Reclamation Plan + FQA + Site Plan. Estimated $8,750 + GST. Retainer confirmed by G Athwal Mar 11 but STILL NOT received. Tish followed up Mar 16 — no response. Do not begin any work.",
      action: "Follow up AGAIN with G Athwal — retainer payment of $5,000 + GST required before any work starts",
      actionType: "urgent"
    },
    {
      name: "16960 River Road — TAS 26.0007",
      client: "Fanny Liang · Greg Howard R.P.Bio / Justin Lange / Alicia Mildner (Madrone new team) · Tony Kwan (lawyer)",
      badge: "cemp", badgeLabel: "CEMP + EIA",
      status: "active",
      note: "⚠️ DFO consultation required (Greg Howard confirmed Apr 2). Greg connecting with DFO Habitat Officer. Susan Van der Ende departing Madrone — Greg, Justin, Alicia taking over. Fanny's $10,000 check expected week of Mar 30 — NOT YET RECEIVED. Tish sent detailed Mar 31 email arguing WSA exemption + no HADD + no ESA comp needed.",
      action: "💰 Follow up with Fanny re: $10,000 check. Await Greg Howard's DFO follow-up. Await City response on rezoning. Neighbor signature still needed for tree removal.",
      actionType: "normal"
    },
    {
      name: "9431 Finn Road — TAS 26.0008",
      client: "Kush Bains (kushbains@msn.com)",
      badge: "alc", badgeLabel: "Barn Application",
      status: "hold",
      note: "Barn application revision in progress. Kush emailed Mar 11 asking for progress update (back from India). Draft reply sitting in Gmail Drafts.",
      action: "Review and send draft reply to Kush from Gmail Drafts",
      actionType: "normal"
    },
    {
      name: "Farm Road — Ecological Park / Luniu Mall — TAS 26.0009",
      client: "Luniu Mall (accounting@luniumall.com) · Harvey Du, M.Arch. BoutHouse Design (harvey.bouthouse@gmail.com) · Phoebe (JKCE) · Bob Drinkwater (knotweed QE)",
      badge: "fp", badgeLabel: "Farm Road",
      status: "active",
      note: "Mar 23: Harvey Du (BoutHouse Design) sent updated site plan — 4m Farm Road + 2.5m SRW for Blundell Rd upgrade. Tish replied asking Harvey to state road area m2 and show pre-existing road. Awaiting Harvey's response. Knotweed email (Mar 21) still UNREAD. CoR ESA DP staff comments (Mar 17) still to review. $3,000 e-transfer (Mar 13) — unmatched.",
      action: "Await Harvey Du response re: road m2. Read knotweed email. Review CoR ESA DP comments. Match $3,000 e-transfer to invoice.",
      actionType: "normal"
    },
    {
      name: "NEW INQUIRY — 22040 River Rd, Richmond (Avtar Thandi / CoR CD 207905)",
      client: "Avtar Thandi (avthandi@live.ca)",
      badge: "new", badgeLabel: "Fill App / New",
      status: "new",
      note: "Mar 23: Avtar Thandi forwarded CoR email from Mike Morin re: fill application CD 207905 at 22040 River Rd. CoR not requiring farm plan/geotech/drainage now. However, if Council authorizes forwarding to ALC, those reports will be required. Avtar seems to be seeking TAS's involvement for the ALC stage. UNREAD — reviewed by Claude EOD.",
      action: "Reply to Avtar Thandi — introduce TAS, confirm scope of work needed at ALC stage (farm plan, FQA, drainage), provide fee estimate.",
      actionType: "normal"
    },
    {
      name: "10491 Granville Ave, Richmond — TAS 26.0011",
      client: "Martin Zhang (martinzhang6288@gmail.com) · Payor: HONGXING ZHU · City: Mike Morin (CoR)",
      badge: "sfu", badgeLabel: "SFU + Farm Plan",
      status: "active",
      note: "SFU invoice paid ($3,675 ✓). Farm Plan retainer $5,000 PAID ✓. Additional $250 received Mar 26 from HONGXING ZHU (purpose unclear — needs clarification). Li Moning outlined 6 report elements. Draft reply to Li Moning in Gmail Drafts.",
      action: "⚠️ Clarify $250 payment from Hongxing Zhu. Send draft reply to Li Moning. Begin Farm Plan. Confirm $1,092 ALC fee paid to CoR.",
      actionType: "normal"
    },
    {
      name: "NDA Project — 12600–12700 Blundell Road",
      client: "Andrew Wong (andrew.wong@gcslaoc.com) — via Kevin Liu (Pack Buildings)",
      badge: "new", badgeLabel: "NDA / New",
      status: "active",
      note: "Tish replied to Andrew Mar 26 — asked for NDA to e-sign (only sees zip with final assessment), requested scope of work for retainer quote. Confidential project.",
      action: "Await Andrew's reply with NDA and scope details. Then sign NDA and provide retainer quote.",
      actionType: "normal"
    },
    {
      name: "NEW — Richmond Road Access (Han Le)",
      client: "Han Le — contact via Gmail",
      badge: "new", badgeLabel: "Road / New",
      status: "new",
      note: "Han Le inquiring about road access on Richmond agricultural property. Questions: (1) per-parcel or combined cost estimate? (2) what is included in TAS scope? Draft reply prepared in Gmail Drafts.",
      action: "Review draft reply in Gmail Drafts and send to Han Le",
      actionType: "normal"
    },
    {
      name: "NEW — Agro-Tourism Bowen Island (Raef Grohne / Stonefield Properties)",
      client: "Raef Grohne — Stonefield Properties",
      badge: "new", badgeLabel: "Agro-Tourism / New",
      status: "new",
      note: "Prospective client exploring agro-tourism options on Bowen Island. Hasn't started Farm Status application. Substantive draft reply prepared in Gmail Drafts covering TAS scope and approach.",
      action: "Review and send draft reply to Raef Grohne from Gmail Drafts",
      actionType: "normal"
    },
    {
      name: "NEW — 14651 Westminster Hwy (Colin Exo — NOI)",
      client: "Colin Exo",
      badge: "alc", badgeLabel: "NOI / New",
      status: "new",
      note: "New NOI application inquiry — 14651 Westminster Hwy. Scope and fee TBD.",
      action: "Follow up with Colin Exo to scope NOI application",
      actionType: "normal"
    },
    {
      name: "NEW — 14611 Westminster Hwy (Cattarina Chan Picketts — Closure Report)",
      client: "Cattarina Chan Picketts",
      badge: "new", badgeLabel: "Closure / New",
      status: "new",
      note: "New contact sent Removal & Remediation Order (Feb 10, 2026). Needs closure report. Draft reply prepared.",
      action: "Review draft reply and send. Assess TAS scope and fee for closure report.",
      actionType: "normal"
    },
    {
      name: "Port Coquitlam Fill Site — Anderson Restoration (NEW / Unlisted)",
      client: "Mark Anderson — Anderson Restoration & Landscaping (amamark65@gmail.com, 604-209-5921)",
      badge: "new", badgeLabel: "Site Monitoring",
      status: "new",
      note: "Active ALC-regulated fill site. Mark Anderson emailed Tish + Roy Biedrava (ALC Enforcement) Mar 17 — site closed due to wet conditions / atmospheric river. Roy Biedrava confirmed to City of Port Coquitlam (Tony) that Tish is monitoring the site. This project was not previously listed. Confirm file number and fee arrangement.",
      action: "Confirm engagement details (scope, fee, file number). Reply when site conditions improve.",
      actionType: "normal"
    },
    {
      name: "Nanaimo Sewer Upgrade — Active Earth Engineering (NEW)",
      client: "Gundeep Randhawa, PAg — Active Earth Engineering (gundeep.randhawa@activeearth.ca) via David Kim (Madrone)",
      badge: "alc", badgeLabel: "ALC Oversight",
      status: "new",
      note: "New sub-consultant engagement. David Kim (Madrone) forwarded RFP Mar 19 and intro'd Tish directly to Gundeep Randhawa (Active Earth) on Mar 20. Tish proposed $4,500 fixed fee (3 milestones: $2,000 onboarding, $1,500 mid-project, $1,000 completion). No response yet.",
      action: "Follow up with Gundeep Randhawa at Active Earth to confirm engagement.",
      actionType: "normal"
    },
    {
      name: "🆕 Riverview Ball Diamond Renewal — City of Coquitlam (NEW)",
      client: "City of Coquitlam — Irene Shams, Project Coordinator (IShams@coquitlam.ca, 604-671-0276)",
      badge: "new", badgeLabel: "Sampling / New",
      status: "new",
      note: "NEW INQUIRY received Mar 30. Irene Shams requesting sand sample collection from ROOTzone deliveries (Veratec) for laboratory testing. Subgrade prep nearing completion. Short notice — delivery timing TBD. Two attachments: Agrologist Services contract + Veratec-ROOTzone product spec.",
      action: "RESPOND TO IRENE ASAP — review attachments, confirm availability for sample collection, coordinate timing.",
      actionType: "urgent"
    },
    {
      name: "🆕 2280 No.6 Rd, Richmond — Soil Monitoring + AOR (Hilson / NEW Apr 2)",
      client: "Hilson / 庆业李 (qingye1998@gmail.com) — referred by Susan Van der Ende (Madrone)",
      badge: "new", badgeLabel: "Soil Monitoring / New",
      status: "new",
      note: "NEW inquiry Apr 2. Susan Van der Ende (Madrone) referred Hilson — Madrone lacks capacity. City (Mike Morin) requires a retained PAg for soil removal/fill permit validity. Client needs PAg oversight + closure report. Tish sent client agreement + agent auth forms Apr 2. Hilson asked about cost → Tish replied: $5,000 + GST retainer, total $5-9k range.",
      action: "Await signed client agreement + $5,000 + GST retainer from Hilson. Time-sensitive — City permit validity at stake.",
      actionType: "normal"
    },
  ],
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
