'use client';

import React, { useState, useEffect } from 'react';
import Header, { ThemeKey, THEME_OPTIONS } from '@/components/Header';
import SchemaExplorer from '@/components/SchemaExplorer';
import StageTracker from '@/components/StageTracker';
import SqlViewer from '@/components/SqlViewer';
import DataTable from '@/components/DataTable';
import SettingsModal from '@/components/SettingsModal';
import ExplainModal from '@/components/ExplainModal';
import Toast, { ToastMessage } from '@/components/Toast';
import { 
  Sparkles, Bot, Play, Trash2, Command, Code2, FlaskConical, Terminal, 
  Zap, Database, RefreshCw, HelpCircle, Layers, CheckCircle2 
} from 'lucide-react';
import { QueryApiResponse } from '@/app/api/query/route';
import { 
  getStoredAISettings, 
  generateSqlFromPrompt, 
  explainAndOptimizeQuery, 
  AISettings, 
  SqlGenerationResult, 
  QueryExplanationResult 
} from '@/lib/aiClient';

const DEFAULT_SCHEMA_DDL = `
CREATE TABLE categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL);
CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'customer', created_at TEXT NOT NULL);
CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, category_id INTEGER NOT NULL, price REAL NOT NULL, stock INTEGER NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY (category_id) REFERENCES categories(id));
CREATE TABLE orders (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, product_id INTEGER NOT NULL, quantity INTEGER NOT NULL, total_price REAL NOT NULL, status TEXT NOT NULL, order_date TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id), FOREIGN KEY (product_id) REFERENCES products(id));
`;

export default function Dashboard() {
  const [theme, setTheme] = useState<ThemeKey>('luxury-data');
  const [nlPrompt, setNlPrompt] = useState<string>('Show me top 5 low stock products with total revenue');
  const [sqlCode, setSqlCode] = useState<string>(`SELECT p.id, p.title, c.name AS category, p.price, p.stock, COALESCE(SUM(o.total_price), 0) AS total_revenue
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN orders o ON p.id = o.product_id AND o.status != 'cancelled'
WHERE p.stock < 50
GROUP BY p.id
ORDER BY p.stock ASC, total_revenue DESC
LIMIT 5;`);

  const [schemaDDL, setSchemaDDL] = useState<string>(DEFAULT_SCHEMA_DDL);
  const [aiSettings, setAiSettings] = useState<AISettings>(getStoredAISettings());
  const [aiMeta, setAiMeta] = useState<SqlGenerationResult | null>({
    sql: '',
    explanation: 'Initial query context loaded.',
    latencyMs: 145,
    tablesCount: 4,
    tablesUsed: ['products', 'categories', 'orders'],
    providerUsed: 'Built-in Mock AI Engine'
  });

  const [isGeneratingSql, setIsGeneratingSql] = useState<boolean>(false);
  const [isExplaining, setIsExplaining] = useState<boolean>(false);
  const [explanationResult, setExplanationResult] = useState<QueryExplanationResult | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isExplainOpen, setIsExplainOpen] = useState<boolean>(false);

  const [executing, setExecuting] = useState<boolean>(false);
  const [queryResponse, setQueryResponse] = useState<QueryApiResponse | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync theme with localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('querypilot_theme');
      if (savedTheme && THEME_OPTIONS.some(t => t.key === savedTheme)) {
        setTheme(savedTheme as ThemeKey);
      }
      setAiSettings(getStoredAISettings());
    } catch (e) {
      console.warn('LocalStorage access warning:', e);
    }
  }, []);

  const handleThemeChange = (newTheme: ThemeKey) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('querypilot_theme', newTheme);
    } catch (e) {
      console.warn('Failed to save theme to localStorage', e);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Fetch live schema DDL on mount
  useEffect(() => {
    fetch('/api/schema')
      .then(res => res.json())
      .then(data => {
        if (data.ddl) setSchemaDDL(data.ddl);
      })
      .catch(() => {
        console.warn('Using default fallback schema DDL');
      });
  }, []);

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
      handleRunQuery();
    }
  };

  // 1. Text-to-SQL Generation Handler
  const handleGenerateSql = async (overridePrompt?: string) => {
    const promptToUse = overridePrompt !== undefined ? overridePrompt : nlPrompt;
    if (!promptToUse.trim()) {
      addToast('info', 'Please enter a natural language prompt first.');
      return;
    }

    setIsGeneratingSql(true);
    try {
      const result = await generateSqlFromPrompt(promptToUse, schemaDDL, aiSettings);
      setSqlCode(result.sql);
      setAiMeta(result);
      addToast('success', `SQL generated in ${result.latencyMs}ms using ${result.providerUsed}.`);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to generate SQL.');
    } finally {
      setIsGeneratingSql(false);
    }
  };

  // 2. Query Explainer & Optimizer Handler
  const handleExplainQuery = async () => {
    if (!sqlCode.trim()) {
      addToast('info', 'No SQL query in terminal canvas to explain.');
      return;
    }

    setIsExplainOpen(true);
    setIsExplaining(true);
    try {
      const result = await explainAndOptimizeQuery(sqlCode, schemaDDL, aiSettings);
      setExplanationResult(result);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to generate query explanation.');
    } finally {
      setIsExplaining(false);
    }
  };

  // 3. SQL Execution Engine Handler
  const handleRunQuery = async () => {
    if (!sqlCode.trim()) {
      addToast('info', 'Please provide a valid SQL query to execute.');
      return;
    }

    setExecuting(true);
    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sqlCode }),
      });

      const data: QueryApiResponse = await res.json();
      setQueryResponse(data);

      if (data.status === 'SUCCESS') {
        addToast('success', `Query executed successfully in ${data.execution?.latencyMs || 0}ms (${data.execution?.rowCount || 0} rows).`);
      } else if (data.status === 'VALIDATION_FAILED') {
        addToast('error', data.error || 'SQL Safety or Syntax check failed.');
      } else {
        addToast('info', data.error || 'Query status notice.');
      }
    } catch (err: any) {
      addToast('error', 'Network error executing SQL query.');
    } finally {
      setExecuting(false);
    }
  };

  const handleClearCanvas = () => {
    setNlPrompt('');
    setSqlCode('');
    setQueryResponse(null);
    addToast('info', 'Editor canvas cleared.');
  };

  const handleQuickPromptClick = (promptText: string) => {
    setNlPrompt(promptText);
    handleGenerateSql(promptText);
  };

  const isResearch = theme === 'research-lab';
  const isRetro = theme === 'retro-web';

  const providerDisplayName = aiSettings.provider === 'mock' 
    ? '🤖 Mock AI Engine' 
    : aiSettings.provider === 'openai' 
    ? '✨ OpenAI API' 
    : aiSettings.provider === 'groq' 
    ? '⚡ Groq API' 
    : aiSettings.provider === 'deepseek' 
    ? '🧠 DeepSeek AI' 
    : '💻 Ollama Local';

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-300">
      {/* Toast Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Settings & Explain Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={(newSettings) => {
          setAiSettings(newSettings);
          addToast('success', `AI Engine Provider set to ${newSettings.provider.toUpperCase()}.`);
        }}
      />

      <ExplainModal
        isOpen={isExplainOpen}
        onClose={() => setIsExplainOpen(false)}
        explanation={explanationResult}
        sqlQuery={sqlCode}
        loading={isExplaining}
      />

      {/* Header Bar */}
      <Header
        onSelectSampleQuery={(sq) => {
          setNlPrompt(sq);
          handleGenerateSql(sq);
        }}
        currentTheme={theme}
        onThemeChange={handleThemeChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeProviderName={providerDisplayName}
      />

      {/* Two-Column IDE Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-[1700px] w-full mx-auto">
        {/* Left Sidebar: Schema Explorer */}
        <SchemaExplorer
          onSelectTableForQuery={(query) => {
            setSqlCode(query);
            handleRunQuery();
          }}
          sectionTitle={isResearch ? 'SCHEMA' : 'DATABASE SCHEMA'}
        />

        {/* Right Main IDE Studio & Results Pane */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto w-full">
          {/* Hero Banner */}
          <div className="mb-5 animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-card)] p-5 rounded-2xl border border-[var(--border-color)] shadow-lg">
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold font-mono text-[var(--accent)] mb-1 tracking-wider uppercase">
                {isResearch ? <FlaskConical className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span>AI/ML Text-to-SQL Studio</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-['Outfit']">
                {isResearch ? 'Query Research & Optimization Lab 🧪' : 'QueryPilot AI Studio 🚀'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-primary)] opacity-80 mt-1">
                Convert natural language into optimized SQLite syntax, execute in WASM, and analyze performance.
              </p>
            </div>

            {/* Glowing AI Badges in Hero */}
            {aiMeta && (
              <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-1.5 font-mono text-[11px]">
                <span className="px-3 py-1 rounded-xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 text-[var(--accent)] font-bold flex items-center gap-1 shadow-sm glow-box">
                  <Zap className="w-3.5 h-3.5" /> Generated in {aiMeta.latencyMs}ms
                </span>
                <span className="px-3 py-1 rounded-xl bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-primary)] opacity-90 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-[var(--accent)]" /> Context Loaded: {aiMeta.tablesCount} Tables
                </span>
              </div>
            )}
          </div>

          {/* SECTION 1: AI Prompt Input Bar Container */}
          <div className="glass-card rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--border-color)]">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-[var(--accent)] animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Natural Language Prompt Input Bar
                </span>
              </div>
              <span className="text-[11px] font-mono opacity-70 hidden sm:inline">
                Client-Side Schema Context Active
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={nlPrompt}
                onChange={(e) => setNlPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerateSql();
                  }
                }}
                placeholder="Ask in natural language (e.g., 'Show me top 5 low stock products with total revenue')..."
                className="flex-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-primary)] placeholder-opacity-50 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] font-mono transition"
              />

              <button
                type="button"
                onClick={() => handleGenerateSql()}
                disabled={isGeneratingSql || !nlPrompt.trim()}
                className="px-5 py-3 rounded-xl font-bold text-xs bg-[var(--accent)] hover:opacity-90 text-[var(--bg-app)] flex items-center justify-center space-x-2 shadow-lg disabled:opacity-50 transition transform hover:-translate-y-0.5 font-sans"
              >
                {isGeneratingSql ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating SQL...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>✨ Generate SQL</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick-Click AI Prompt Badges */}
            <div className="flex flex-wrap items-center gap-2 mt-3.5 pt-3 border-t border-[var(--border-color)]">
              <span className="text-[11px] font-mono text-[var(--text-primary)] opacity-60 font-semibold mr-1">
                Quick Prompts:
              </span>

              <button
                type="button"
                onClick={() => handleQuickPromptClick('Show me top 5 low stock products with total revenue')}
                className="text-xs bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--accent)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-semibold"
              >
                ✨ Low Stock & Revenue
              </button>

              <button
                type="button"
                onClick={() => handleQuickPromptClick('Summarize sales data with total revenue and average order value')}
                className="text-xs bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--text-primary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-medium"
              >
                ✨ Summarize Sales Data
              </button>

              <button
                type="button"
                onClick={() => handleQuickPromptClick('Find duplicate users by email address')}
                className="text-xs bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--text-primary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-medium"
              >
                🔍 Find Duplicates
              </button>

              <button
                type="button"
                onClick={() => handleQuickPromptClick('Rank top spending customers with total order counts')}
                className="text-xs bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--text-primary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-medium"
              >
                📈 Rank Top Customers
              </button>

              <button
                type="button"
                onClick={() => handleQuickPromptClick('Show category performance with product count and average price')}
                className="text-xs bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--text-primary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)] transition flex items-center gap-1 font-medium"
              >
                📦 Category Performance
              </button>
            </div>
          </div>

          {/* SECTION 2: SQL Terminal Editor Canvas Container */}
          <div className="glass-card rounded-2xl p-5 mb-6 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Window Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2.5 border-b border-[var(--border-color)]">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                </div>
                <span className="text-xs font-mono font-bold text-[var(--text-primary)] pl-2 border-l border-[var(--border-color)] flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-[var(--accent)]" /> SQL Code Editor Canvas
                </span>
              </div>

              {/* Glowing Execution Status Badges */}
              {aiMeta && (
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40 font-bold flex items-center gap-1 glow-box">
                    <Zap className="w-3 h-3" /> ⚡ Generated in {aiMeta.latencyMs}ms
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-primary)] opacity-80 border border-[var(--border-color)] flex items-center gap-1">
                    <Database className="w-3 h-3 text-[var(--accent)]" /> 🤖 Context Loaded: {aiMeta.tablesCount} Tables
                  </span>
                </div>
              )}
            </div>

            {/* SQL Canvas Editor Textarea */}
            <div className="relative">
              <textarea
                rows={6}
                value={sqlCode}
                onKeyDown={handleKeyDown}
                onChange={(e) => setSqlCode(e.target.value)}
                placeholder="-- SQL query canvas auto-filled by Text-to-SQL or type SQLite code..."
                className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-xl p-4 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-primary)] placeholder-opacity-40 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] font-mono leading-relaxed transition resize-none"
              />
            </div>

            {/* Editor Toolbar Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex flex-wrap items-center gap-2">
                {/* 🤖 Explain Query Button */}
                <button
                  type="button"
                  onClick={handleExplainQuery}
                  disabled={!sqlCode.trim() || isExplaining}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--bg-input)] hover:border-[var(--accent)] border border-[var(--border-color)] text-[var(--text-primary)] flex items-center gap-1.5 transition duration-150 disabled:opacity-50"
                  title="Plain-English breakdown & performance optimization recommendations"
                >
                  <Bot className="w-4 h-4 text-[var(--accent)]" />
                  <span>🤖 Explain Query</span>
                </button>

                {/* Clear Canvas Button */}
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--text-primary)] opacity-70 hover:opacity-100 border border-[var(--border-color)] flex items-center gap-1 transition"
                  title="Clear Canvas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>

              {/* Run Query Main Button */}
              <button
                type="button"
                onClick={handleRunQuery}
                disabled={executing || !sqlCode.trim()}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[var(--accent)] hover:opacity-90 text-[var(--bg-app)] flex items-center space-x-2 shadow-lg disabled:opacity-50 transition transform hover:-translate-y-0.5"
              >
                {executing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Query...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Query (⌘+Enter)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Pipeline Tracker */}
          {queryResponse && (
            <StageTracker
              stages={queryResponse.stages || []}
              currentStatus={executing ? 'LOADING' : queryResponse.status}
              sectionTitle={isResearch ? 'EXPERIMENTS & PIPELINE' : '4-STAGE EXECUTION PIPELINE'}
            />
          )}

          {/* STAGE 4 RESULTS: SQL Viewer & Interactive Data Grid */}
          {queryResponse && queryResponse.status === 'SUCCESS' && (
            <div className="animate-fade-in space-y-6">
              {queryResponse.generated_sql && (
                <SqlViewer
                  sql={queryResponse.generated_sql}
                  explanation={queryResponse.explanation}
                  execution={queryResponse.execution}
                  retriesAttempted={queryResponse.retriesAttempted}
                  onCopyNotice={(msg) => addToast('info', msg)}
                />
              )}

              {queryResponse.execution && (
                <DataTable
                  execution={queryResponse.execution}
                  onCopyNotice={(msg) => addToast('info', msg)}
                  sectionTitle={isResearch ? 'RESULTS & EVALUATION' : 'RESULTS DATA GRID'}
                />
              )}
            </div>
          )}

          {/* Initial State / Prompt helper */}
          {!queryResponse && !executing && (
            <div className="glass-card rounded-2xl p-10 text-center my-6 border border-dashed border-[var(--border-color)]">
              <Database className="w-12 h-12 text-[var(--accent)] mx-auto mb-3 opacity-60 animate-pulse" />
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Ready to Pilot Your Database</h3>
              <p className="text-xs text-[var(--text-primary)] opacity-70 max-w-md mx-auto mt-1">
                Enter a question in the prompt bar above or click a quick prompt badge to generate SQL. Use &quot;🤖 Explain Query&quot; to inspect optimization suggestions.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
