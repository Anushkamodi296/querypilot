'use client';

import React, { useState, useEffect } from 'react';
import Header, { ThemeMode } from '@/components/Header';
import SchemaExplorer from '@/components/SchemaExplorer';
import StageTracker from '@/components/StageTracker';
import ClarificationModal from '@/components/ClarificationModal';
import SqlViewer from '@/components/SqlViewer';
import DataTable from '@/components/DataTable';
import Toast, { ToastMessage } from '@/components/Toast';
import { Send, Sparkles, RefreshCw, Database, ShieldAlert, Play, Trash2, Command, Code2, FlaskConical, Terminal } from 'lucide-react';
import { QueryApiResponse } from '@/app/api/query/route';

export default function Dashboard() {
  const [theme, setTheme] = useState<ThemeMode>('luxury');
  const [prompt, setPrompt] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<QueryApiResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply Theme CSS class to document root
  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Keyboard shortcut listener for Ctrl+Enter / ⌘+Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteQuery(prompt);
    }
  };

  // Submit Query to 4-Stage Engine API
  const handleExecuteQuery = async (
    queryText: string,
    userClarifications?: Record<string, string>
  ) => {
    if (!queryText.trim()) {
      addToast('info', 'Please enter a query prompt first.');
      return;
    }

    setLoading(true);
    if (!userClarifications) {
      setActivePrompt(queryText);
    }

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          userClarifications,
          previousContext: response?.generated_sql ? `Last generated SQL: ${response.generated_sql}` : undefined
        }),
      });

      const data: QueryApiResponse = await res.json();
      setResponse(data);

      if (data.status === 'SUCCESS') {
        addToast('success', `Query executed in ${data.execution?.latencyMs || 0}ms (${data.execution?.rowCount || 0} rows).`);
      } else if (data.status === 'AMBIGUOUS_NEEDS_INPUT') {
        addToast('info', 'Ambiguity detected! Clarification required.');
      } else if (data.status === 'VALIDATION_FAILED') {
        addToast('error', data.error || 'SQL Safety or Syntax check failed.');
      }
    } catch (err: any) {
      setResponse({
        status: 'ERROR',
        stages: [
          {
            stage: 1,
            name: 'Network Error',
            status: 'error',
            message: err.message || 'Failed to connect to QueryPilot API.'
          }
        ],
        is_ambiguous: false,
        error: err.message || 'Failed to execute request.'
      });
      addToast('error', 'Network error calling QueryPilot engine.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearCanvas = () => {
    setPrompt('');
    setResponse(null);
    addToast('info', 'Canvas cleared.');
  };

  const handleSelectSampleQuery = (sq: string) => {
    setPrompt(sq);
    handleExecuteQuery(sq);
  };

  const handleClarificationSubmit = (answers: Record<string, string>) => {
    handleExecuteQuery(activePrompt || prompt, answers);
  };

  // Section Headers according to theme
  const titles = {
    queryStudio: theme === 'research' ? 'QUERY LAB & EVALUATION' : theme === 'oldweb' ? 'HYPER-SQL TERMINAL v1.4' : 'PROMPT & QUERY STUDIO',
    schemaTitle: theme === 'research' ? 'SCHEMA' : 'DATABASE SCHEMA',
    experimentsTitle: theme === 'research' ? 'EXPERIMENTS & PIPELINE' : '4-STAGE EXECUTION PIPELINE',
    resultsTitle: theme === 'research' ? 'RESULTS & DATA EVALUATION' : 'RESULTS DATA GRID'
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header Bar */}
      <Header
        onSelectSampleQuery={handleSelectSampleQuery}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Two-Column Workspace Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Left Sidebar: Database Schema Explorer */}
        <SchemaExplorer
          onSelectTableForQuery={(query) => {
            setPrompt(query);
            handleExecuteQuery(query);
          }}
          sectionTitle={titles.schemaTitle}
        />

        {/* Right Pane: IDE Studio & Results Pane */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full">
          {/* Dynamic Hero Section */}
          <div className="mb-5 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-5 rounded-2xl border border-[var(--border-color)]">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold font-mono text-[var(--accent-color)] mb-1 tracking-wider uppercase">
                {theme === 'research' ? <FlaskConical className="w-4 h-4" /> : <Terminal className="w-4 h-4" />}
                <span>{titles.queryStudio}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
                {theme === 'research' ? 'Data Research & Query Lab 🧪' : 'Welcome back, Explorer 🚀'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1 opacity-90">
                {theme === 'research' 
                  ? 'Evaluate complex schemas, run read-only analytical queries, and analyze performance.' 
                  : 'Master your data with lightning-fast in-browser SQL & 4-Stage AI Clarification.'}
              </p>
            </div>

            {theme === 'oldweb' && (
              <div className="flex flex-col text-right font-mono text-xs text-[#FF4D00]">
                <span className="font-bold">[STATUS: ONLINE]</span>
                <span className="text-[10px] text-[#B8E7F5]">[BUILD: v1.4.2 PASSED]</span>
              </div>
            )}
          </div>

          {/* IDE Terminal Code Studio Container */}
          <div className="glass-card rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Terminal Window Top Bar */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-[var(--border-color)]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] pl-2 border-l border-[var(--border-color)] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[var(--accent-color)]" /> Prompt Input / SQL Studio
                </span>
              </div>

              <div className="text-[11px] font-mono text-[var(--text-secondary)] hidden sm:flex items-center gap-1">
                <Command className="w-3 h-3" /> <span>Press ⌘+Enter to Run</span>
              </div>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleExecuteQuery(prompt); }} className="relative">
              <textarea
                rows={3}
                required
                value={prompt}
                onKeyDown={handleKeyDown}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask in natural language (e.g. 'Show top 5 highest spending users' or 'List products with stock under 50')..."
                className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] focus:ring-1 focus:ring-[var(--accent-color)] font-mono transition resize-none"
              />

              {/* Quick Action Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSampleQuery('Show top 5 highest spending customers')}
                    className="text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--accent-color)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-semibold"
                  >
                    ⚡ Top 5 Customers
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleQuery('List all products with stock under 50 items')}
                    className="text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-medium"
                  >
                    📊 Low Stock Items
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleQuery('Show recent active sales')}
                    className="text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-amber-400 px-3 py-1.5 rounded-xl border border-amber-500/30 transition flex items-center gap-1 font-medium"
                  >
                    ❓ Ambiguous Demo
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="text-xs bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1"
                    title="Clear Prompt & Results"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Floating Run Button */}
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[var(--accent-color)] hover:opacity-90 text-[var(--bg-primary)] flex items-center space-x-2 shadow-lg disabled:opacity-50 transition duration-200 transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Executing Engine...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>Run Query (⌘+Enter)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Live Pipeline Stage Tracker */}
          {response && (
            <StageTracker
              stages={response.stages || []}
              currentStatus={loading ? 'LOADING' : response.status}
              sectionTitle={titles.experimentsTitle}
            />
          )}

          {/* STAGE 2: Clarification Modal / Card */}
          {response && response.status === 'AMBIGUOUS_NEEDS_INPUT' && response.clarification_questions && (
            <ClarificationModal
              questions={response.clarification_questions}
              explanation={response.explanation}
              onSubmitClarification={handleClarificationSubmit}
              onCancel={() => setResponse(null)}
            />
          )}

          {/* STAGE 3 VALIDATION FAILURE ALERT */}
          {response && response.status === 'VALIDATION_FAILED' && (
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-5 mb-6 text-rose-200 shadow-xl animate-fade-in">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-300">Stage 3 Safety & Syntax Gate Rejected Query</h3>
                  <p className="text-xs text-rose-200/90 mt-1 font-mono">{response.error || 'Query failed safety check or syntax validation.'}</p>
                  {response.generated_sql && (
                    <div className="mt-3 bg-[var(--bg-primary)] p-3 rounded-xl border border-rose-500/20 font-mono text-xs text-rose-300 overflow-x-auto">
                      {response.generated_sql}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4 RESULTS: SQL Viewer & Data Grid */}
          {response && response.status === 'SUCCESS' && (
            <div className="animate-fade-in space-y-6">
              {/* Raw SQL Viewer Component */}
              {response.generated_sql && (
                <SqlViewer
                  sql={response.generated_sql}
                  explanation={response.explanation}
                  execution={response.execution}
                  retriesAttempted={response.retriesAttempted}
                  onCopyNotice={(msg) => addToast('info', msg)}
                />
              )}

              {/* Interactive Data Table Grid */}
              {response.execution && (
                <DataTable
                  execution={response.execution}
                  onCopyNotice={(msg) => addToast('info', msg)}
                  sectionTitle={titles.resultsTitle}
                />
              )}
            </div>
          )}

          {/* Empty State On Launch */}
          {!response && !loading && (
            <div className="glass-card rounded-2xl p-12 text-center my-6 border border-dashed border-[var(--border-color)]">
              <Database className="w-12 h-12 text-[var(--accent-color)] mx-auto mb-3 opacity-50 animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ready to Pilot Your Database</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto mt-1">
                Enter a question above or click a sample prompt badge to start the 4-Stage Ambiguity Detection, Clarification, & Execution Pipeline.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
