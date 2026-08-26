'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Sparkles, CheckCircle2, ShieldCheck, Layers, Sparkle } from 'lucide-react';

export type ThemeMode = 'luxury' | 'research' | 'oldweb';

interface HeaderProps {
  onSelectSampleQuery: (query: string) => void;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export default function Header({ onSelectSampleQuery, currentTheme, onThemeChange }: HeaderProps) {
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('http://localhost:11434/api/tags', { method: 'GET', signal: AbortSignal.timeout(2000) })
      .then(res => setOllamaConnected(res.ok))
      .catch(() => setOllamaConnected(false));
  }, []);

  const themeOptions: { mode: ThemeMode; label: string; iconStr: string }[] = [
    { mode: 'luxury', label: '🟣 Luxury Data', iconStr: '🟣' },
    { mode: 'research', label: '🟢 Research Lab', iconStr: '🟢' },
    { mode: 'oldweb', label: '🩵 Retro Web', iconStr: '🩵' },
  ];

  return (
    <header className="border-b border-[var(--border-color)] bg-[var(--bg-surface)] backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3 transition-colors duration-300">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Dynamic Branding based on Theme */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center shadow-lg text-[var(--accent-color)] glow-box">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight font-['Outfit'] gradient-text">
                {currentTheme === 'research' ? 'RESEARCH QUERY LAB' : 'QueryPilot'}
              </h1>
              {currentTheme === 'oldweb' ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#FF4D00]/20 text-[#FF4D00] border border-[#FF4D00]/40">
                  SYSTEM ONLINE • v1.4.2
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-secondary)]">
                  SQL ENGINE READY
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] opacity-90">
              {currentTheme === 'research' 
                ? 'Academic Data Evaluation & Schema Experimentation Platform' 
                : 'Production AI Text-to-SQL Engine with 4-Stage Guard'}
            </p>
          </div>
        </div>

        {/* Status Badges & Theme Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Retro Badges for OldWeb Mode */}
          {currentTheme === 'oldweb' && (
            <div className="hidden xl:flex items-center space-x-2 text-[10px] font-mono font-bold">
              <span className="px-2 py-1 bg-[#B8E7F5]/10 text-[#B8E7F5] border border-[#B8E7F5]/30 rounded">
                [MODE: HYPER-SQL]
              </span>
              <span className="px-2 py-1 bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/30 rounded">
                [LATENCY: &lt;5ms]
              </span>
            </div>
          )}

          {/* Connection Status */}
          <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-xl border backdrop-blur-md font-mono ${
            ollamaConnected === true 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)]'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>
              {ollamaConnected === true 
                ? 'Ollama Active (llama3)' 
                : 'In-Browser Engine Active'}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-color)]" />
          </div>

          {/* Theme Selector Pills */}
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-xs font-medium">
            {themeOptions.map((t) => {
              const isActive = currentTheme === t.mode;
              return (
                <button
                  key={t.mode}
                  onClick={() => onThemeChange(t.mode)}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--accent-color)] text-[var(--bg-primary)] font-bold shadow-md'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
