'use client';

import React, { useState } from 'react';
import { Copy, Check, Code, Clock, Layers, Table, Info, RefreshCw, FileCode } from 'lucide-react';
import { QueryExecutionResult } from '@/lib/db';

interface SqlViewerProps {
  sql: string;
  explanation?: string;
  execution?: QueryExecutionResult;
  retriesAttempted?: number;
  onCopyNotice?: (msg: string) => void;
}

export default function SqlViewer({
  sql,
  explanation,
  execution,
  retriesAttempted,
  onCopyNotice
}: SqlViewerProps) {
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const handleCopySql = () => {
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    if (onCopyNotice) onCopyNotice('SQL Query copied to clipboard!');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleCopyJson = () => {
    if (!execution) return;
    navigator.clipboard.writeText(JSON.stringify(execution.rows, null, 2));
    setCopiedJson(true);
    if (onCopyNotice) onCopyNotice('Query Results JSON copied to clipboard!');
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const sqlLines = sql.split('\n');

  return (
    <div className="glass-card rounded-2xl overflow-hidden mb-6 shadow-2xl transition-all duration-300">
      {/* Viewer Header Toolbar */}
      <div className="bg-[var(--bg-card)] px-4 py-3 border-b border-[var(--border-color)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">Generated SQL Query</span>
          {retriesAttempted && retriesAttempted > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> Auto-Corrected ({retriesAttempted} retry)
            </span>
          ) : null}
        </div>

        {/* Execution Metrics & Copy Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-mono">
          {execution && (
            <>
              <div className="flex items-center space-x-1 text-[var(--accent)] bg-[var(--bg-input)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                <Clock className="w-3.5 h-3.5" />
                <span>{execution.latencyMs}ms</span>
              </div>

              <div className="flex items-center space-x-1 text-[var(--text-primary)] bg-[var(--bg-input)] px-2.5 py-1 rounded-lg border border-[var(--border-color)]">
                <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>{execution.rowCount} rows</span>
              </div>
            </>
          )}

          {/* Copy SQL Button */}
          <button
            onClick={handleCopySql}
            className="flex items-center space-x-1.5 bg-[var(--bg-input)] hover:border-[var(--accent)] text-[var(--text-primary)] px-3 py-1 rounded-lg border border-[var(--border-color)] transition duration-150 text-xs font-sans font-medium"
            title="Copy SQL to Clipboard"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500">Copied SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[var(--text-primary)] opacity-70" />
                <span>Copy SQL</span>
              </>
            )}
          </button>

          {/* Copy JSON Button */}
          {execution && execution.rows.length > 0 && (
            <button
              onClick={handleCopyJson}
              className="hidden sm:flex items-center space-x-1.5 bg-[var(--accent)] text-[var(--bg-app)] font-bold px-3 py-1 rounded-lg transition text-xs font-sans shadow"
              title="Copy Query Results as JSON"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied JSON!</span>
                </>
              ) : (
                <>
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SQL Code Terminal */}
      <div className="p-4 bg-[var(--bg-input)] font-mono text-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <tbody>
            {sqlLines.map((line, idx) => (
              <tr key={idx} className="hover:bg-[var(--bg-card)] transition-colors">
                <td className="w-8 select-none text-[var(--text-primary)] opacity-40 text-right pr-4 py-0.5 align-top">
                  {idx + 1}
                </td>
                <td className="py-0.5 text-[var(--text-primary)] whitespace-pre">
                  {highlightSqlKeywords(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanation Footer */}
      {explanation && (
        <div className="bg-[var(--bg-card)] px-4 py-2.5 border-t border-[var(--border-color)] text-xs text-[var(--text-primary)] flex items-start space-x-2">
          <Info className="w-4 h-4 text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[var(--text-primary)]">Query Logic & Intent: </span>
            <span className="opacity-90">{explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function highlightSqlKeywords(line: string) {
  const keywords = ['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'INNER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'ASC', 'DESC', 'COUNT', 'SUM', 'AVG', 'ROUND', 'AND', 'OR', 'AS'];
  
  let result = line;
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b(${kw})\\b`, 'g');
    result = result.replace(reg, '___KW_$1___');
  });

  const parts = result.split(/(___KW_.*?___)/);

  return parts.map((part, i) => {
    if (part.startsWith('___KW_') && part.endsWith('___')) {
      const kw = part.replace('___KW_', '').replace('___', '');
      return <span key={i} className="text-[var(--accent)] font-bold">{kw}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
