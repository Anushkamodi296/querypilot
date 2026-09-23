'use client';

import React, { useState, useEffect } from 'react';
import { Settings, X, Key, Cpu, Sparkles, Check, Eye, EyeOff, ShieldCheck, Server, HelpCircle } from 'lucide-react';
import { AISettings, AIProvider, getStoredAISettings, saveStoredAISettings, DEFAULT_AI_SETTINGS } from '@/lib/aiClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (newSettings: AISettings) => void;
}

export default function SettingsModal({ isOpen, onClose, onSettingsSaved }: SettingsModalProps) {
  const [settings, setSettings] = useState<AISettings>(DEFAULT_AI_SETTINGS);
  const [showOpenAiKey, setShowOpenAiKey] = useState(false);
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showDeepseekKey, setShowDeepseekKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredAISettings());
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    saveStoredAISettings(settings);
    onSettingsSaved(settings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const providers: { key: AIProvider; name: string; badge: string; desc: string }[] = [
    {
      key: 'mock',
      name: 'Built-in Mock AI Engine',
      badge: '⚡ Zero Config / No Key Required',
      desc: 'Instant client-side Text-to-SQL engine with zero network calls and zero API cost.'
    },
    {
      key: 'openai',
      name: 'OpenAI API',
      badge: 'GPT-4o-mini / GPT-4o',
      desc: 'Connect your OpenAI API key for advanced natural language understanding.'
    },
    {
      key: 'groq',
      name: 'Groq Cloud API',
      badge: 'Llama 3.3 70B (Ultra Fast)',
      desc: 'Blazing-fast inference using Groq LPUs.'
    },
    {
      key: 'deepseek',
      name: 'DeepSeek AI',
      badge: 'DeepSeek-V3 / DeepSeek-R1',
      desc: 'Reasoning-heavy AI models tailored for code and SQL.'
    },
    {
      key: 'ollama',
      name: 'Ollama Local LLM',
      badge: 'Local Machine / Private',
      desc: 'Connect to Ollama running locally at http://localhost:11434.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent)] glow-box">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold tracking-tight font-['Outfit']">AI Engine & Provider Settings</h3>
              <p className="text-xs text-[var(--text-primary)] opacity-70">
                100% Client-Side Privacy: Keys are stored exclusively in your browser&apos;s localStorage.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[var(--bg-input)] hover:border-[var(--accent)] border border-[var(--border-color)] flex items-center justify-center transition text-[var(--text-primary)] opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Privacy Security Banner */}
          <div className="flex items-start space-x-3 p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs font-sans">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300">Client-Side Key Guarantee: </span>
              <span>Your API keys never leave your browser. All requests are dispatched directly from your device to provider endpoints or processed locally.</span>
            </div>
          </div>

          {/* Provider Selector Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)] mb-2">
              Select AI Engine Provider
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {providers.map((p) => {
                const isSelected = settings.provider === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setSettings({ ...settings, provider: p.key })}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--text-primary)] ring-1 ring-[var(--accent)] shadow-md'
                        : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[var(--accent)]/60 text-[var(--text-primary)] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-bold text-sm font-['Outfit']">{p.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[var(--accent)]" />}
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--accent)] self-start font-medium">
                      {p.badge}
                    </span>
                    <p className="text-[11px] opacity-75 line-clamp-2">{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Form per Provider */}
          <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] space-y-4">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--accent)] flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Provider Configuration & Credentials
            </h4>

            {settings.provider === 'mock' && (
              <div className="text-xs text-[var(--text-primary)] opacity-80 space-y-1">
                <p className="font-semibold text-emerald-400">✨ Built-in Mock AI Engine Active</p>
                <p>No API key required! Converts natural language prompts into valid SQLite queries using local pattern matching and schema DDL analysis.</p>
              </div>
            )}

            {settings.provider === 'openai' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">OpenAI API Key</label>
                  <div className="relative">
                    <input
                      type={showOpenAiKey ? 'text' : 'password'}
                      value={settings.openaiApiKey}
                      onChange={(e) => setSettings({ ...settings, openaiApiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAiKey(!showOpenAiKey)}
                      className="absolute right-3 top-2.5 text-[var(--text-primary)] opacity-60 hover:opacity-100"
                    >
                      {showOpenAiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">OpenAI Model</label>
                  <input
                    type="text"
                    value={settings.openaiModel}
                    onChange={(e) => setSettings({ ...settings, openaiModel: e.target.value })}
                    placeholder="gpt-4o-mini"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {settings.provider === 'groq' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">Groq API Key</label>
                  <div className="relative">
                    <input
                      type={showGroqKey ? 'text' : 'password'}
                      value={settings.groqApiKey}
                      onChange={(e) => setSettings({ ...settings, groqApiKey: e.target.value })}
                      placeholder="gsk_..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGroqKey(!showGroqKey)}
                      className="absolute right-3 top-2.5 text-[var(--text-primary)] opacity-60 hover:opacity-100"
                    >
                      {showGroqKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">Groq Model</label>
                  <input
                    type="text"
                    value={settings.groqModel}
                    onChange={(e) => setSettings({ ...settings, groqModel: e.target.value })}
                    placeholder="llama-3.3-70b-versatile"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {settings.provider === 'deepseek' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">DeepSeek API Key</label>
                  <div className="relative">
                    <input
                      type={showDeepseekKey ? 'text' : 'password'}
                      value={settings.deepseekApiKey}
                      onChange={(e) => setSettings({ ...settings, deepseekApiKey: e.target.value })}
                      placeholder="sk-..."
                      className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeepseekKey(!showDeepseekKey)}
                      className="absolute right-3 top-2.5 text-[var(--text-primary)] opacity-60 hover:opacity-100"
                    >
                      {showDeepseekKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">DeepSeek Model</label>
                  <input
                    type="text"
                    value={settings.deepseekModel}
                    onChange={(e) => setSettings({ ...settings, deepseekModel: e.target.value })}
                    placeholder="deepseek-chat"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}

            {settings.provider === 'ollama' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">Ollama Host URL</label>
                  <input
                    type="text"
                    value={settings.ollamaUrl}
                    onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                    placeholder="http://localhost:11434"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-semibold mb-1">Ollama Model</label>
                  <input
                    type="text"
                    value={settings.ollamaModel}
                    onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                    placeholder="llama3"
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2 text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <button
            type="button"
            onClick={() => setSettings(DEFAULT_AI_SETTINGS)}
            className="text-xs text-[var(--text-primary)] opacity-60 hover:opacity-100 font-mono underline"
          >
            Reset to Defaults
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 shadow-lg transition flex items-center space-x-2"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Saved to LocalStorage!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Save AI Configuration</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
