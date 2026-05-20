export type ProjectStatus = 'active' | 'urgent' | 'hold' | 'new';
export type ProjectBadge = 'fp' | 'alc' | 'fqa' | 'cemp' | 'sfu' | 'new';
export type ActionPriority = 'h' | 'm' | 'l';
export type ActionLane = 'now' | 'week' | 'watching';
export type MoneyType = 'exp' | 'cash' | 'needed' | 'done';
export type InvoiceStatus = 'outstanding' | 'paid';

export interface MoneyItem {
  label: string;
  amount: string;
  when: string;
  type: MoneyType;
}

export interface OutstandingInvoice {
  inv: string;
  label: string;
  amount: string;
}

export interface UnmatchedPayment {
  date: string;
  name: string;
  amount: string;
  note: string;
}

export interface ResolvedPayment {
  date: string;
  name: string;
  amount: string;
  note: string;
}

export interface WeeklyAction {
  pri: ActionPriority;
  lane: ActionLane;
  project: string;
  task: string;
  id?: string;
}

export interface Project {
  name: string;
  client: string;
  badge: ProjectBadge;
  badgeLabel: string;
  status: ProjectStatus;
  note: string;
  action: string;
  actionType: 'normal' | 'urgent';
  id?: string;
}

export interface Invoice {
  num: string;
  client: string;
  issued: string;
  amount: string;
  status: InvoiceStatus;
  id?: string;
}

export interface EmailTemplate {
  title: string;
  tag: string;
  toPlaceholder: string;
  subjectPlaceholder: string;
  body: string;
}

export interface AppData {
  lastUpdated: string;
  stats: {
    projects: number;
    outstanding: string;
    received: string;
    actions: number;
  };
  upcoming: string[];
  moneyTracker: {
    incoming: MoneyItem[];
    outstanding: OutstandingInvoice[];
  };
  unmatched: UnmatchedPayment[];
  resolved: ResolvedPayment[];
  weeklyActions: WeeklyAction[];
  projects: Project[];
  invoices: {
    outstanding: Invoice[];
    paid: Invoice[];
    unmatched: { date: string; from: string; amount: string }[];
    totals: {
      outstanding: string;
      paidConfirmed: string;
      unmatchedReceipts: string;
      totalInvoiced2026: string;
    };
  };
  emailTemplates: EmailTemplate[];
}

export type NoteAuthor = 'tish' | 'ai' | 'field';

export interface NoteEntry {
  id: string;
  author: NoteAuthor;
  ts: string; // ISO timestamp
  text: string;
  tags?: string[];
  resolved?: boolean;
}

// ── Field data collection (ALC P-10 raw evidence) ───────────────────────────
// Captured on phone in TAS Hub. Deep analysis (horizon detection, SIFT lookup,
// drainage class derivation, LCA classification) happens in Claude Cowork on
// desktop with Opus from these raw inputs.

export type DrainageClassObserved =
  | 'Rapidly Drained'
  | 'Well Drained'
  | 'Moderately Well Drained'
  | 'Imperfectly Drained'
  | 'Poorly Drained'
  | 'Very Poorly Drained';

export type SlopeAspect = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW' | 'level';
export type SlopeGradient = 'level' | 'gentle' | 'moderate' | 'strong' | 'steep';
export type LandUseObserved =
  | 'pasture'
  | 'crop'
  | 'fallow'
  | 'orchard'
  | 'developed'
  | 'mixed'
  | 'forested'
  | 'other';
export type VegetationObserved =
  | 'grasses'
  | 'shrubs'
  | 'trees'
  | 'mixed'
  | 'cleared'
  | 'crop'
  | 'other';

export interface PitObservation {
  id: string;
  pitNumber: number;                 // TP1, TP2, etc. — auto-assigned
  excavatedAt: string;               // ISO timestamp
  gps?: { lat: number; lng: number; accuracyM?: number };

  // Raw measurements (tape measure + eyes)
  pitBaseDepthCm?: number;           // where shovel stopped / refusal
  waterTablePresent?: boolean;
  waterTableDepthCm?: number;        // if present
  rootingDepthCm?: number;           // deepest visible root

  // Liability context
  hoursSinceLastRain?: number;       // auto-flagged if low; Cowork uses for non-rainfall-period framing
  rainfallNote?: string;             // free text, e.g. "atmospheric river two days ago"

  // Evidence
  profilePhotoId?: string;           // REQUIRED to submit — photo with tape measure
  landscapePhotoId?: string;         // optional context shot
  fieldNotes?: string;               // free-form, used sparingly

  // Lightweight AI hints (from phone-side Gemini Flash, NOT authoritative)
  aiQualityFlags?: string[];         // e.g. ["tape not visible", "image too dark"]
  aiMunsellEstimate?: string;        // sanity check on-site
  aiTextureEstimate?: string;
}

export interface SiteObservations {
  // Tech-observed (only at the site)
  currentLandUse?: LandUseObserved;
  vegetation?: VegetationObserved;
  slopeAspect?: SlopeAspect;         // phone compass auto-populates, manual override allowed
  slopeGradient?: SlopeGradient;
  pondingEvidence?: boolean;
  pondingNote?: string;              // location, persistence

  adjacentLandUse?: {
    north?: string;
    south?: string;
    east?: string;
    west?: string;
  };

  // Sizing (used for pit density check)
  assessmentAreaHa?: number;         // hectares — for P-10 §3.1 density check

  generalNotes?: string;
}

export interface UserEdits {
  lastManualEdit?: string;
  completedActions: (number | string)[];
  deletedActions: (number | string)[];
  customActions: WeeklyAction[];
  deletedProjects: string[];
  customProjects: Project[];
  projectOverrides: Record<string, Partial<Project>>;
  actionOverrides: Record<number | string, Partial<WeeklyAction>>;
  invoiceOverrides: Record<string, Partial<Invoice>>;
  deletedInvoices: string[];
  customInvoices: Invoice[];
  deletedUpcoming: number[];
  customUpcoming: { id: string; text: string }[];
  notesForClaude: string; // legacy free-form notes (kept for backwards compat)
  noteJournal: NoteEntry[]; // structured two-way comms log
}
