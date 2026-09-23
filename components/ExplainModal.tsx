'use client';

import React from 'react';
import { Bot, X, Zap, Database, Filter, GitMerge, BarChart2, Layers, CheckCircle, Copy, Check } from 'lucide-react';
import { QueryExplanationResult } from '@/lib/aiClient';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  explanation: QueryExplanationResult | null;
  sqlQuery: string;
  loading: boolean;
}

export default function ExplainModal({ isOpen, onClose, explanation, sqlQuery, loading }: ExplainModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyExplanation = () => {
    if (!explanation) return;
    const text = `QUERY EXPLANATION:\n${explanation.summary}\n\nINTENT:\n${explanation.intent}\n\nTARGET TABLES:\n${explanation.tables.join(', ')}\n\nJOINS:\n${explanation.joins.join('\n')}\n\nFILTERS:\n${explanation.filters.join('\n')}\n\nOPTIMIZATIONS:\n${explanation.optimizations.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="glass-card w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--accent)] glow-box">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold tracking-tight font-['Outfit']">AI Query Explainer & Optimizer</h3>
                {explanation?.providerUsed && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30">
                    {explanation.providerUsed}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-primary)] opacity-70">
                Plain-English breakdown of query logic, relationships, filters, and performance tips.
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
          {/* Active SQL Code Preview */}
          <div className="p-3.5 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] font-mono text-xs text-[var(--text-primary)] overflow-x-auto">
            <span className="text-[10px] uppercase font-bold text-[var(--accent)] block mb-1">Active SQL Query:</span>
            <code className="whitespace-pre-wrap">{sqlQuery || '-- No active query'}</code>
          </div>

          {loading ? (
            <div className="py-12 text-center space-y-3">
              <Bot className="w-10 h-10 text-[var(--accent)] mx-auto animate-bounce" />
              <p className="text-sm font-mono font-bold text-[var(--text-primary)]">Analyzing Query Execution Structure & Optimizations...</p>
              <p className="text-xs text-[var(--text-primary)] opacity-60">Scanning schema joins, column projections, and foreign key indexes.</p>
            </div>
          ) : explanation ? (
            <div className="space-y-5 text-xs">
              {/* High-Level Summary Card */}
              <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-2">
                <h4 className="font-bold text-sm font-['Outfit'] text-[var(--accent)] flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Query Overview & Intent
                </h4>
                <p className="text-xs text-[var(--text-primary)] leading-relaxed font-sans">{explanation.summary}</p>
                <div className="pt-2 text-[11px] font-mono text-[var(--text-primary)] opacity-80 border-t border-[var(--border-color)]">
                  <span className="font-bold text-[var(--accent)]">Intent: </span>
                  <span>{explanation.intent}</span>
                </div>
              </div>

              {/* Component Breakdown Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Tables */}
                <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-2">
                  <h5 className="font-mono font-bold text-[11px] uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-[var(--accent)]" /> Target Tables ({explanation.tables.length})
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {explanation.tables.map((t, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] font-mono text-[11px] font-bold text-[var(--accent)]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Joins */}
                <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-2">
                  <h5 className="font-mono font-bold text-[11px] uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <GitMerge className="w-3.5 h-3.5 text-[var(--accent)]" /> Joins & Relationships
                  </h5>
                  <ul className="space-y-1 text-[11px] font-mono opacity-90">
                    {explanation.joins.map((j, idx) => (
                      <li key={idx} className="truncate" title={j}>• {j}</li>
                    ))}
                  </ul>
                </div>

                {/* Filters */}
                <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-2">
                  <h5 className="font-mono font-bold text-[11px] uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-[var(--accent)]" /> Where Filters & Conditions
                  </h5>
                  <ul className="space-y-1 text-[11px] font-mono opacity-90">
                    {explanation.filters.map((f, idx) => (
                      <li key={idx}>• {f}</li>
                    ))}
                  </ul>
                </div>

                {/* Aggregations */}
                <div className="p-4 rounded-2xl bg-[var(--bg-input)] border border-[var(--border-color)] space-y-2">
                  <h5 className="font-mono font-bold text-[11px] uppercase tracking-wider text-[var(--text-primary)] flex items-center gap-2">
                    <BarChart2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Aggregations & Grouping
                  </h5>
                  <ul className="space-y-1 text-[11px] font-mono opacity-90">
                    {explanation.aggregations.map((a, idx) => (
                      <li key={idx}>• {a}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Performance Optimization Suggestions */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 space-y-2">
                <h4 className="font-bold text-sm font-['Outfit'] text-amber-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" /> Performance Optimization Suggestions
                </h4>
                <div className="space-y-2 pt-1 font-sans text-xs">
                  {explanation.optimizations.map((opt, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-card)] border border-amber-500/20 text-amber-100 font-mono text-[11px]">
                      {opt}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs opacity-60">No explanation available.</div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
          <button
            type="button"
            onClick={handleCopyExplanation}
            disabled={!explanation}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-[var(--border-color)] hover:border-[var(--accent)] text-[var(--text-primary)] transition flex items-center space-x-2 disabled:opacity-50"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">Copied Breakdown!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Explanation</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-[var(--accent)] text-[var(--bg-app)] hover:opacity-90 shadow-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
