import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Send, Loader2, Bot, User,
  Trash2, Copy, CheckCircle2, AlertCircle, ChevronDown, Zap
} from 'lucide-react';
import { geminiChat, hasDirectGeminiAccess, ChatMessage } from '../lib/api';

interface GeminiChatProps {
  backendAvailable: boolean;
}

const QUICK_PROMPTS = [
  'What are the most urgent items on my plate right now?',
  'Draft a project status update email for Mandeville',
  'What invoices are outstanding and overdue?',
  'Summarize what I need to do this week',
  "Help me write a follow-up email for a client who hasn't responded",
];

// Ollama models (shown when backend is available)
const OLLAMA_MODELS = [
  { id: 'gemma4:latest', name: 'Gemma 4', description: "Google's newest — 9.6 GB" },
  { id: 'qwen3.5:latest', name: 'Qwen 3.5', description: 'Latest Qwen reasoning — 6.6 GB' },
  { id: 'qwen2.5:latest', name: 'Qwen 2.5', description: 'Excellent reasoning — 4.7 GB' },
  { id: 'mistral:latest', name: 'Mistral', description: 'Quality + speed — 4.4 GB' },
  { id: 'gemma3:4b', name: 'Gemma 3', description: 'Fast & lightweight — 3.3 GB' },
];

export function GeminiChat({ backendAvailable }: GeminiChatProps) {
  const directAvailable = hasDirectGeminiAccess();
  const aiAvailable = backendAvailable || directAvailable;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState(OLLAMA_MODELS[0].id);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading || !aiAvailable) return;
    setInput('');
    setError('');
    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);
    try {
      const modelArg = backendAvailable ? selectedModel : undefined;
      const response = await geminiChat(messageText, messages, modelArg);
      setMessages([...updatedHistory, { role: 'model', content: response }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      setMessages(updatedHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMessage = (content: string) =>
    content.split('\n').map((line, i) => {
      const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: html || '&nbsp;' }} />;
    });

  if (!aiAvailable) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Assistant</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="font-black text-amber-800">AI Unavailable</p>
          <p className="text-sm text-amber-700">
            Start the TAS Hub backend <strong>or</strong> set <code className="bg-amber-100 px-1 rounded">VITE_GEMINI_API_KEY</code> in your <code className="bg-amber-100 px-1 rounded">.env.local</code> to enable direct Gemini access.
          </p>
        </div>
      </div>
    );
  }

  const modeLabel = backendAvailable
    ? `Ollama · ${OLLAMA_MODELS.find(m => m.id === selectedModel)?.name || selectedModel}`
    : 'Gemini 2.0 Flash (Direct)';

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Assistant</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {backendAvailable ? (
              <div className="relative">
                <button
                  onClick={() => setShowModelSelector(!showModelSelector)}
                  className="flex items-center gap-1.5 text-xs text-violet-600 font-bold uppercase tracking-widest hover:text-violet-800 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
                >
                  {modeLabel}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showModelSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-64"
                  >
                    {OLLAMA_MODELS.map(model => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModel(model.id); setShowModelSelector(false); }}
                        className={`w-full text-left px-3 py-2.5 text-xs font-medium transition-colors border-b last:border-0 border-slate-50 ${
                          selectedModel === model.id
                            ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-600'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold">{model.name}</div>
                        <div className="text-[10px] text-slate-400">{model.description}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            ) : (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold uppercase tracking-widest px-2 py-1 bg-emerald-50 rounded-lg">
                <Zap className="w-3 h-3" />
                {modeLabel}
              </span>
            )}
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">TAS Context</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setError(''); }}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-lg">TAS AI Assistant</p>
                <p className="text-sm text-slate-500 mt-1">{modeLabel} · Ask about projects, draft emails, get summaries</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Quick prompts</p>
              {QUICK_PROMPTS.map((prompt, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => send(prompt)}
                  className="w-full text-left px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-brand-blue' : 'bg-gradient-to-br from-violet-500 to-purple-600'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`group relative max-w-[80%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-brand-blue text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  {formatMessage(msg.content)}
                </div>
                <button
                  onClick={() => copyMessage(msg.content, i)}
                  className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600"
                >
                  {copiedId === i
                    ? <><CheckCircle2 className="w-3 h-3 text-green-500" /> Copied</>
                    : <><Copy className="w-3 h-3" /> Copy</>
                  }
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking…</span>
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/50 flex items-end gap-3 p-3">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about projects, draft an email, get a summary…"
          rows={1}
          className="flex-1 resize-none text-sm font-medium text-slate-700 outline-none leading-relaxed py-2 px-2 max-h-32 overflow-y-auto"
          style={{ minHeight: '40px' }}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = Math.min(el.scrollHeight, 128) + 'px';
          }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-center text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
