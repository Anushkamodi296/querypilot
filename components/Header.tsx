'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Cpu, Database, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface HeaderProps {
  onSelectSampleQuery: (query: string) => void;
}

export default function Header({ onSelectSampleQuery }: HeaderProps) {
  const [ollamaConnected, setOllamaConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Ollama endpoint is active locally
    fetch('http://localhost:11434/api/tags', { method: 'GET', signal: AbortSignal.timeout(2000) })
      .then(res => setOllamaConnected(res.ok))
      .catch(() => setOllamaConnected(false));
  }, []);

  const sampleQueries = [
    'Show top 5 highest spending customers',
    'List all products with stock under 50 items',
    'Show recent active sales',
    'What categories have the highest average product price?'
  ];

  return (
    <header className="border-b border-border/80 bg-surface/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Terminal className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-white font-['Outfit']">QueryPilot</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                v1.0 Ready
              </span>
            </div>
            <p className="text-xs text-gray-400">AI Text-to-SQL Engine with 4-Stage Ambiguity & Safety Guard</p>
          </div>
        </div>

        {/* Status Badge & Sample Queries */}
        <div className="flex flex-wrap items-center gap-3">
          {/* LLM Connection Status */}
          <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border ${
            ollamaConnected === true 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : ollamaConnected === false 
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}>
            <Cpu className="w-3.5 h-3.5" />
            <span>
              {ollamaConnected === true 
                ? 'Ollama Local Active (llama3)' 
                : ollamaConnected === false 
                ? 'Fallback Smart Engine (Ollama Offline)' 
                : 'Checking LLM Host...'}
            </span>
            {ollamaConnected === true ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : ollamaConnected === false ? (
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            ) : null}
          </div>

          {/* Quick Prompts Dropdown / Pill buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Try:
            </span>
            {sampleQueries.slice(0, 2).map((sq, i) => (
              <button
                key={i}
                onClick={() => onSelectSampleQuery(sq)}
                className="text-xs bg-card hover:bg-surface-hover text-gray-300 hover:text-white px-2.5 py-1 rounded-md border border-border/60 transition duration-150 truncate max-w-[200px]"
                title={sq}
              >
                {sq}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
