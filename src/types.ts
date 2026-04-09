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
  notesForClaude: string;
}
