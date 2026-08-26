'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, CheckCircle2, Palette, ChevronDown } from 'lucide-react';

export type ThemeKey = 
  | 'luxury-data' 
  | 'research-lab' 
  | 'retro-web' 
  | 'pitch-dark' 
  | 'clean-light' 
  | 'soft-blush' 
  | 'soft-mint' 
  | 'soft-peach';

export interface ThemeOption {
  key: ThemeKey;
  label: string;
  badge: string;
  isDark: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { key: 'luxury-data', label: 'Luxury Data', badge: '🍷 Wine', isDark: true },
  { key: 'research-lab', label: 'Research Lab', badge: '🟢 Emerald', isDark: true },
  { key: 'retro-web', label: 'Retro Web', badge: '⚡ Cyber', isDark: true },
  { key: 'pitch-dark', label: 'Pitch Dark', badge: '⚫ Onyx', isDark: true },
  { key: 'clean-light', label: 'Clean Light', badge: '⚪ Pure', isDark: false },
  { key: 'soft-blush', label: 'Soft Blush', badge: '🌸 Blush', isDark: false },
  { key: 'soft-mint', label: 'Soft Mint', badge: '🌿 Mint', isDark: false },
  { key: 'soft-peach', label: 'Soft Peach', badge: '🍑 Peach', isDark: false },
];

interface HeaderProps {
  onSelectSampleQuery: (query: string) => void;
  currentTheme: ThemeKey;
  onThemeChange: (theme: ThemeKey) => void;
}

export default function Header({ onSelectSampleQuery, currentTheme, onThemeChange }: HeaderProps) {
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetch('http://localhost:11434/api/tags', { method: 'GET', signal: AbortSignal.timeout(2000) })
      .then(res => setOllamaConnected(res.ok))
      .catch(() => setOllamaConnected(false));
  }, []);

  const activeOption = THEME_OPTIONS.find(t => t.key === currentTheme) || THEME_OPTIONS[0];

  return (
    <header className="border-b border-[var(--border-color)] bg-[var(--bg-card)] backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3 transition-colors duration-300">
      <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Dynamic Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--bg-app)] border border-[var(--border-color)] flex items-center justify-center shadow-md text-[var(--accent)] glow-box">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight font-['Outfit'] text-[var(--text-primary)]">
                {currentTheme === 'research-lab' ? 'RESEARCH QUERY LAB' : 'QueryPilot'}
              </h1>
              {currentTheme === 'retro-web' ? (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40">
                  SYSTEM ONLINE • v1.4.2
                </span>
              ) : (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--border-color)] text-[var(--text-primary)] opacity-80">
                  8 THEMES ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-primary)] opacity-70">
              {currentTheme === 'research-lab' 
                ? 'Academic Data Evaluation & Schema Experimentation Platform' 
                : 'Production AI Text-to-SQL Engine with 4-Stage Guard'}
            </p>
          </div>
        </div>

        {/* Status Badges & 8-Theme Dropdown Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Connection Status */}
          <div className="flex items-center space-x-2 text-xs px-3 py-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] font-mono text-[var(--text-primary)]">
            <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>
              {ollamaConnected === true ? 'Ollama Active (llama3)' : 'In-Browser SQL Engine'}
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent)]" />
          </div>

          {/* Theme Selector Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-xs font-semibold text-[var(--text-primary)] hover:border-[var(--accent)] transition"
            >
              <Palette className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Theme: {activeOption.label}</span>
              <span className="text-[10px] opacity-70">({activeOption.badge})</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-primary)] opacity-60" />
            </button>

            {dropdownOpen && (
              <>
                {/* Backdrop overlay to close dropdown */}
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-2xl z-50 p-1.5 space-y-1 font-sans text-xs animate-fade-in">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase font-bold text-[var(--text-primary)] opacity-60 border-b border-[var(--border-color)]">
                    Select Palette (8 Themes)
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                    {THEME_OPTIONS.map((t) => {
                      const isSelected = currentTheme === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => {
                            onThemeChange(t.key);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                            isSelected
                              ? 'bg-[var(--accent)] text-[var(--bg-app)] font-bold shadow'
                              : 'text-[var(--text-primary)] hover:bg-[var(--bg-input)]'
                          }`}
                        >
                          <span className="truncate">{t.label}</span>
                          <span className="text-[10px] font-mono opacity-80">{t.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
