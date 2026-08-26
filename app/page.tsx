'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import SchemaExplorer from '@/components/SchemaExplorer';
import StageTracker from '@/components/StageTracker';
import ClarificationModal from '@/components/ClarificationModal';
import SqlViewer from '@/components/SqlViewer';
import DataTable from '@/components/DataTable';
import { Send, Sparkles, AlertCircle, RefreshCw, Database, Terminal, ShieldAlert } from 'lucide-react';
import { QueryApiResponse } from '@/app/api/query/route';

export default function Dashboard() {
  const [prompt, setPrompt] = useState<string>('');
  const [activePrompt, setActivePrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<QueryApiResponse | null>(null);

  // Submit Query to 4-Stage Engine API
  const handleExecuteQuery = async (
    queryText: string,
    userClarifications?: Record<string, string>
  ) => {
    if (!queryText.trim()) return;

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
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteQuery(prompt);
  };

  const handleSelectSampleQuery = (sq: string) => {
    setPrompt(sq);
    handleExecuteQuery(sq);
  };

  const handleClarificationSubmit = (answers: Record<string, string>) => {
    handleExecuteQuery(activePrompt || prompt, answers);
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col font-sans">
      {/* Header Bar */}
      <Header onSelectSampleQuery={handleSelectSampleQuery} />

      {/* Main Content Layout (Sidebar + Dashboard Area) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Sidebar: Schema Explorer */}
        <SchemaExplorer onSelectTableForQuery={(query) => {
          setPrompt(query);
          handleExecuteQuery(query);
        }} />

        {/* Central Workspace Area */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto max-w-6xl mx-auto w-full">
          {/* Hero Prompt Box Card */}
          <div className="bg-card/90 border border-border/80 rounded-2xl p-6 mb-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Ask Anything in Natural Language</h2>
                  <p className="text-xs text-gray-400">QueryPilot translates your intent into validated read-only SQLite SQL queries.</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleFormSubmit} className="relative">
              <textarea
                rows={3}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. 'Show top 5 highest spending users' or 'List products with low stock'"
                className="w-full bg-[#080c14] border border-border/80 rounded-xl p-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/40 font-sans transition resize-none"
              />

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  {['Top 5 spending users', 'Products low stock', 'Recent orders'].map((tag, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        const q = tag === 'Top 5 spending users' ? 'Show top 5 highest spending customers'
                          : tag === 'Products low stock' ? 'List all products with stock under 50 items'
                          : 'Show recent orders with customer names';
                        setPrompt(q);
                      }}
                      className="text-[11px] bg-surface hover:bg-surface-hover text-gray-400 hover:text-gray-200 px-2.5 py-1 rounded-lg border border-border/50 transition"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-2.5 rounded-xl font-semibold text-xs bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center space-x-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:hover:from-blue-600 transition duration-150 transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Processing 4-Stage Engine...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Run Query Engine</span>
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
            <div className="bg-rose-950/30 border border-rose-500/40 rounded-2xl p-5 mb-6 text-rose-200 shadow-xl">
              <div className="flex items-start space-x-3">
                <ShieldAlert className="w-6 h-6 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-rose-300">Stage 3 Safety & Syntax Gate Rejected Query</h3>
                  <p className="text-xs text-rose-200/90 mt-1 font-mono">{response.error || 'Query failed safety check or syntax validation.'}</p>
                  {response.generated_sql && (
                    <div className="mt-3 bg-[#080c14] p-3 rounded-xl border border-rose-500/20 font-mono text-xs text-rose-300 overflow-x-auto">
                      {response.generated_sql}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STAGE 4 RESULTS: SQL Viewer & Interactive Data Grid */}
          {response && response.status === 'SUCCESS' && (
            <>
              {/* Raw SQL Viewer Component */}
              {response.generated_sql && (
                <SqlViewer
                  sql={response.generated_sql}
                  explanation={response.explanation}
                  execution={response.execution}
                  retriesAttempted={response.retriesAttempted}
                />
              )}

              {/* Interactive Data Table Grid */}
              {response.execution && (
                <DataTable execution={response.execution} />
              )}
            </>
          )}

          {/* Empty State On Launch */}
          {!response && !loading && (
            <div className="bg-surface/30 border border-border/40 border-dashed rounded-2xl p-12 text-center my-6">
              <Database className="w-12 h-12 text-blue-500/40 mx-auto mb-3 animate-pulse" />
              <h3 className="text-sm font-semibold text-gray-300">Ready to Pilot Your Database</h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
                Enter a question above or pick a sample prompt to start the 4-Stage Ambiguity Detection, Clarification, & Execution Pipeline.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
