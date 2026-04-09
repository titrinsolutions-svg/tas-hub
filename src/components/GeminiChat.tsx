import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Send, Loader2, Bot, User,
  Trash2, Copy, CheckCircle2, AlertCircle, ChevronDown
} from 'lucide-react';
import { geminiChat, ChatMessage } from '../lib/api';

interface GeminiChatProps {
  backendAvailable: boolean;
}

const QUICK_PROMPTS = [
  'What are the most urgent items on my plate right now?',
  'Draft a project status update email for Mandeville',
  'What invoices are outstanding and overdue?',
  'Summarize what I need to do this week',
  'Help me write a follow-up email for a client who hasn\'t responded',
];

// Available AI models (newest first)
const AVAILABLE_MODELS = [
  { id: 'gemma4:latest', name: 'Gemma 4 (Latest)', description: 'Google\'s newest model - 9.6GB' },
  { id: 'qwen3.5:latest', name: 'Qwen 3.5 (Latest)', description: 'Latest Qwen reasoning - 6.6GB' },
  { id: 'qwen3-coder:30b', name: 'Qwen 3-Coder (Largest)', description: 'Most powerful - 18GB' },
  { id: 'qwen2.5:latest', name: 'Qwen 2.5', description: 'Excellent reasoning - 4.7GB' },
  { id: 'mistral:latest', name: 'Mistral (Balanced)', description: 'Quality + speed - 4.4GB' },
  { id: 'neural-chat:latest', name: 'Neural Chat (Intel)', description: 'Business optimized - 4.1GB' },
  { id: 'llama2-uncensored:latest', name: 'LLaMA 2 Unrestricted', description: 'Meta\'s model - 3.8GB' },
  { id: 'gemma3:4b', name: 'Gemma 3 (Lightweight)', description: 'Fast & small - 3.3GB' },
];

export function GeminiChat({ backendAvailable }: GeminiChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id); // Default: Gemma 4
  const [showModelSelector, setShowModelSelector] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput('');
    setError('');

    const userMessage: ChatMessage = { role: 'user', content: messageText };
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      // Send the selected model to the backend
      const response = await geminiChat(messageText, messages, selectedModel);
      setMessages([...updatedHistory, { role: 'model', content: response }]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to get response');
      setMessages(updatedHistory);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
    setError('');
  };

  const formatMessage = (content: string) => {
    // Basic markdown: bold, line breaks
    return content
      .split('\n')
      .map((line, i) => {
        const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
      });
  };

  if (!backendAvailable) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 pb-12">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Assistant</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
          <p className="font-black text-amber-800">Backend Offline</p>
          <p className="text-sm text-amber-700">
            The TAS Hub backend needs to be running to use the AI assistant.
            Start the server and refresh to connect.
          </p>
        </div>
      </div>
    );
  }

  const currentModelName = AVAILABLE_MODELS.find(m => m.id === selectedModel)?.name || 'Unknown';

  return (
    <div className="max-w-2xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">AI Assistant</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
              >
                <span className="text-violet-600">{currentModelName}</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {/* Dropdown Menu */}
              {showModelSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-1 left-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 w-64"
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelSelector(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                        selectedModel === model.id
                          ? 'bg-violet-50 text-violet-700 border-l-2 border-violet-600'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="font-bold">{model.name}</div>
                      <div className="text-[10px] text-slate-500">{model.description}</div>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">TAS Context</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
          >
            <Trash2 className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6 pt-4"
          >
            {/* Welcome */}
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="font-black text-slate-800 text-lg">Ollama AI for TAS</p>
                <p className="text-sm text-slate-500 mt-1">
                  {currentModelName} · Ask about projects, draft emails, get summaries
                </p>
              </div>
            </div>

            {/* Quick prompts */}
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
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-slate-800'
                  : 'bg-gradient-to-br from-violet-500 to-purple-600'
              }`}>
                {msg.role === 'user'
                  ? <User className="w-4 h-4 text-white" />
                  : <Bot className="w-4 h-4 text-white" />
                }
              </div>

              {/* Bubble */}
              <div className={`group relative max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-slate-800 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
                }`}>
                  {formatMessage(msg.content)}
                </div>
                {/* Copy button */}
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

        {/* Loading indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
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

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-sm"
          >
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
          {isLoading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Send className="w-4 h-4" />
          }
        </button>
      </div>

      <p className="text-center text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
