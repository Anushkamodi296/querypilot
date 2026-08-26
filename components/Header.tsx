'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Sparkles, CheckCircle2, Moon, Sun, Zap } from 'lucide-react';

export type ThemeMode = 'dark' | 'light' | 'cyberpunk';

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

  const themeOptions: { mode: ThemeMode; label: string; icon: any }[] = [
    { mode: 'dark', label: 'Dark', icon: Moon },
    { mode: 'light', label: 'Light', icon: Sun },
    { mode: 'cyberpunk', label: 'Neon', icon: Zap },
  ];

  return (
    <header className="border-b border-white/10 bg-surface/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3.5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25 glow-box">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-extrabold tracking-tight font-['Outfit'] gradient-text">QueryPilot</h1>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                AI SQL v1.0
              </span>
            </div>
            <p className="text-xs text-gray-400 opacity-90">AI Text-to-SQL Engine with 4-Stage Safety Guard</p>
          </div>
        </div>

        {/* Status Badge & Theme Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          {/* LLM Connection Status */}
          <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-xl border backdrop-blur-md font-mono ${
            ollamaConnected === true 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : ollamaConnected === false 
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              : 'bg-gray-800/50 text-gray-400 border-gray-700'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>
              {ollamaConnected === true 
                ? 'Ollama Active (llama3)' 
                : ollamaConnected === false 
                ? 'Smart In-Browser Engine' 
                : 'Connecting...'}
            </span>
            {ollamaConnected === true ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : ollamaConnected === false ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            ) : null}
          </div>

          {/* Theme Control Toggle Pills */}
          <div className="flex items-center p-1 rounded-xl bg-card border border-white/10 text-xs font-medium">
            {themeOptions.map((t) => {
              const Icon = t.icon;
              const isActive = currentTheme === t.mode;
              return (
                <button
                  key={t.mode}
                  onClick={() => onThemeChange(t.mode)}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md font-semibold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
