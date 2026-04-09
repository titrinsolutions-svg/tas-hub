/**
 * TAS Hub API client
 * Connects portal to the Node.js backend (Gmail, Drive, Firebase, Gemini)
 */

// Backend URL — set VITE_API_URL in .env for production (Render URL)
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'tas-hub-local-key-2026';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }

  return res.json();
}

// ─── Health ──────────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkAuthStatus(): Promise<{ authenticated: boolean; email?: string }> {
  try {
    const res = await fetch(`${API_BASE}/auth/status`, { signal: AbortSignal.timeout(3000) });
    return await res.json();
  } catch {
    return { authenticated: false };
  }
}

// ─── Hub Data (Firebase persistence) ─────────────────────────────────────────

export async function loadHubData(): Promise<Record<string, unknown> | null> {
  try {
    const { hub } = await apiFetch('/api/hub');
    return hub;
  } catch {
    return null;
  }
}

export async function saveHubData(data: Record<string, unknown>): Promise<boolean> {
  try {
    await apiFetch('/api/hub', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return true;
  } catch {
    return false;
  }
}

export async function patchHubData(partial: Record<string, unknown>): Promise<boolean> {
  try {
    await apiFetch('/api/hub', {
      method: 'PATCH',
      body: JSON.stringify(partial),
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Notes for Claude ─────────────────────────────────────────────────────────

export async function loadNotesForClaude(): Promise<string> {
  try {
    const { notes } = await apiFetch('/api/hub/notes');
    return notes || '';
  } catch {
    return '';
  }
}

export async function saveNotesForClaude(notes: string): Promise<boolean> {
  try {
    await apiFetch('/api/hub/notes', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    return true;
  } catch {
    return false;
  }
}

// ─── Gmail ───────────────────────────────────────────────────────────────────

export interface GmailDraftRequest {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}

export interface GmailDraftResponse {
  draftId: string;
  message: string;
  link: string;
}

export async function createGmailDraft(draft: GmailDraftRequest): Promise<GmailDraftResponse> {
  return apiFetch('/api/gmail/draft', {
    method: 'POST',
    body: JSON.stringify(draft),
  });
}

export interface GmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  unread: boolean;
}

export async function getInbox(hours = 48, max = 10): Promise<GmailMessage[]> {
  try {
    const { messages } = await apiFetch(`/api/gmail/inbox?hours=${hours}&max=${max}`);
    return messages || [];
  } catch {
    return [];
  }
}

export async function searchEmails(query: string, max = 10): Promise<GmailMessage[]> {
  try {
    const { messages } = await apiFetch(`/api/gmail/search?q=${encodeURIComponent(query)}&max=${max}`);
    return messages || [];
  } catch {
    return [];
  }
}

// ─── Ollama AI (Local) ────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export async function geminiChat(
  message: string,
  history: ChatMessage[] = [],
  context?: string
): Promise<string> {
  const { response } = await apiFetch('/api/ollama/chat', {
    method: 'POST',
    body: JSON.stringify({ message, history, context }),
  });
  return response;
}

export interface EmailDraftRequest {
  type?: string;
  projectName?: string;
  clientName?: string;
  clientEmail?: string;
  context?: string;
  notes?: string;
}

export interface EmailDraftResponse {
  subject: string;
  body: string;
}

export async function generateEmailDraft(params: EmailDraftRequest): Promise<EmailDraftResponse> {
  const { draft } = await apiFetch('/api/ollama/email-draft', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  return draft;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getProjects(): Promise<unknown[]> {
  try {
    const { projects } = await apiFetch('/api/projects');
    return projects || [];
  } catch {
    return [];
  }
}
