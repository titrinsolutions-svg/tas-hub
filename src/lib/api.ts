/**
 * TAS Hub API client
 * Talks to the backend (Gmail, Firebase, etc.) for everything that needs server-side
 * keys, and falls back to direct Gemini API calls in the browser for AI features
 * when the backend is offline.
 */

import { GoogleGenAI } from '@google/genai';

// Backend URL — set VITE_API_URL in .env for production (Render URL)
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || 'tas-hub-local-key-2026';
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

// Lazy-init the Gemini client only if a key is available.
let _genai: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!GEMINI_API_KEY) return null;
  if (!_genai) _genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  return _genai;
}

export function hasDirectGeminiAccess(): boolean {
  return Boolean(GEMINI_API_KEY);
}

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

// ─── AI Chat ─────────────────────────────────────────────────────────────────
// Tries the backend first (which can use Ollama, Gemini server-side, custom prompts,
// etc.), then falls back to direct Gemini in the browser if the backend is offline.

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

const SYSTEM_PROMPT_TAS = `You are an executive assistant for Tish Titina, the founder of Titrin AgriSoil Solutions Ltd. — an agri-soil consulting firm in BC, Canada working on Farm Plans, ALC applications, FQA reports, CEMP, SFU, and related land/agriculture work. Be direct, concrete, and actionable. When asked for emails, write them in Tish's voice: warm but professional, not corporate. Avoid filler. Format with short paragraphs and clear next steps.`;

export async function geminiChat(
  message: string,
  history: ChatMessage[] = [],
  modelOrContext?: string,
  context?: string
): Promise<string> {
  const finalModel = modelOrContext?.includes(':') ? modelOrContext : undefined;
  const finalContext = !modelOrContext?.includes(':') ? modelOrContext : context;

  // Try backend first
  try {
    const { response } = await apiFetch('/api/ollama/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history,
        context: finalContext,
        model: finalModel,
      }),
    });
    return response;
  } catch (backendErr) {
    // Backend down — try direct Gemini if a key is configured
    const genai = getGenAI();
    if (!genai) throw backendErr;

    const contents = [
      ...history.map(m => ({ role: m.role === 'model' ? 'model' : 'user', parts: [{ text: m.content }] })),
      { role: 'user', parts: [{ text: message }] },
    ];

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents,
      config: {
        systemInstruction: finalContext ? `${SYSTEM_PROMPT_TAS}\n\nAdditional context:\n${finalContext}` : SYSTEM_PROMPT_TAS,
      },
    });
    return result.text || '';
  }
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
  // Try backend
  try {
    const { draft } = await apiFetch('/api/ollama/email-draft', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return draft;
  } catch (backendErr) {
    const genai = getGenAI();
    if (!genai) throw backendErr;

    const prompt = `Draft a professional email from Tish at Titrin AgriSoil Solutions about the following:

Project: ${params.projectName || 'General'}
Client: ${params.clientName || 'N/A'}
Type: ${params.type || 'Update'}
Notes: ${params.context || params.notes || ''}

Respond with ONLY a JSON object: {"subject": "...", "body": "..."}. No prose, no markdown fences.`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { systemInstruction: SYSTEM_PROMPT_TAS, responseMimeType: 'application/json' },
    });
    const text = result.text || '{}';
    try {
      const parsed = JSON.parse(text);
      return { subject: parsed.subject || `TAS Update: ${params.projectName}`, body: parsed.body || '' };
    } catch {
      return { subject: `TAS Update: ${params.projectName}`, body: text };
    }
  }
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
