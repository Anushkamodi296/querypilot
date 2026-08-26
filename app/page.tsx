'use client';

import React, { useState, useEffect } from 'react';
import Header, { ThemeMode } from '@/components/Header';
import SchemaExplorer from '@/components/SchemaExplorer';
import StageTracker from '@/components/StageTracker';
import ClarificationModal from '@/components/ClarificationModal';
import SqlViewer from '@/components/SqlViewer';
import DataTable from '@/components/DataTable';
import Toast, { ToastMessage } from '@/components/Toast';
import { Send, Sparkles, RefreshCw, Database, ShieldAlert, Rocket, Play, Trash2, Command, Code2 } from 'lucide-react';
import { QueryApiResponse } from '@/app/api/query/route';

export default function Dashboard() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
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
        addToast('info', 'Ambiguity detected! Please clarify your query below.');
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

  return (
    <div className={`min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300`}>
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Header Bar */}
      <Header
        onSelectSampleQuery={handleSelectSampleQuery}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Layout (Sidebar + Workspace) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar: Schema Explorer */}
        <SchemaExplorer onSelectTableForQuery={(query) => {
          setPrompt(query);
          handleExecuteQuery(query);
        }} />

        {/* Central Workspace Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          {/* Animated Onboarding & Greeting Hero */}
          <div className="mb-6 animate-fade-in">
            <div className="flex items-center space-x-2 text-xs font-bold font-mono text-cyan-400 mb-1 tracking-wider uppercase">
              <Rocket className="w-4 h-4 text-cyan-400" />
              <span>Interactive SQL Playground</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
              Welcome back, Explorer <span className="inline-block animate-bounce">🚀</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Master your data with lightning-fast in-browser SQL & 4-Stage AI Clarification.
            </p>
          </div>

          {/* Prompt / SQL IDE Editor Container */}
          <div className="glass-card rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Terminal Window Top Bar */}
            <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-semibold text-gray-400 pl-2 border-l border-white/10 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" /> Prompt Studio / SQL Terminal
                </span>
              </div>

              <div className="text-[11px] font-mono text-gray-500 hidden sm:flex items-center gap-1">
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
                className="w-full bg-[#050811] border border-white/10 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/40 font-mono transition resize-none"
              />

              {/* Quick Action Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectSampleQuery('Show top 5 highest spending customers')}
                    className="text-xs bg-surface hover:bg-white/10 text-cyan-300 px-3 py-1.5 rounded-xl border border-cyan-500/30 transition flex items-center gap-1 font-medium"
                  >
                    ⚡ Run Demo Query
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleQuery('List all products with stock under 50 items')}
                    className="text-xs bg-surface hover:bg-white/10 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 transition flex items-center gap-1 font-medium"
                  >
                    📊 Low Stock Products
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleQuery('Show recent active sales')}
                    className="text-xs bg-surface hover:bg-white/10 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/30 transition flex items-center gap-1 font-medium"
                  >
                    ❓ Ambiguous Demo
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="text-xs bg-surface hover:bg-white/10 text-gray-400 hover:text-white px-2.5 py-1.5 rounded-xl border border-white/10 transition flex items-center gap-1"
                    title="Clear Prompt & Results"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear</span>
                  </button>
                </div>

                {/* Floating Run Button with Pulse Animation */}
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center space-x-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 transition duration-200 transform hover:-translate-y-0.5 animate-pulse-glow"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Executing Engine...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
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
                    <div className="mt-3 bg-[#050811] p-3 rounded-xl border border-rose-500/20 font-mono text-xs text-rose-300 overflow-x-auto">
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
                />
              )}
            </div>
          )}

          {/* Empty State On Launch */}
          {!response && !loading && (
            <div className="glass-card rounded-2xl p-12 text-center my-6 border border-dashed border-white/10">
              <Database className="w-12 h-12 text-blue-500/40 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-gray-200">Ready to Pilot Your Database</h3>
              <p className="text-xs text-gray-400 max-w-md mx-auto mt-1">
                Enter a question above or click a quick prompt badge to start the 4-Stage Ambiguity Detection, Clarification, & Execution Pipeline.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
