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
      <div className="bg-surface px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <Code className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Generated SQL Query</span>
          {retriesAttempted && retriesAttempted > 0 ? (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-mono">
              <RefreshCw className="w-3 h-3 animate-spin" /> Auto-Corrected ({retriesAttempted} retry)
            </span>
          ) : null}
        </div>

        {/* Execution Metrics & Copy Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-mono">
          {execution && (
            <>
              <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                <Clock className="w-3.5 h-3.5" />
                <span>{execution.latencyMs}ms</span>
              </div>

              <div className="flex items-center space-x-1 text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                <Layers className="w-3.5 h-3.5" />
                <span>{execution.rowCount} rows</span>
              </div>
            </>
          )}

          {/* Copy SQL Button */}
          <button
            onClick={handleCopySql}
            className="flex items-center space-x-1.5 bg-surface hover:bg-white/10 text-gray-200 px-3 py-1 rounded-lg border border-white/10 transition duration-150 text-xs font-sans"
            title="Copy SQL to Clipboard"
          >
            {copiedSql ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied SQL!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-gray-400" />
                <span>Copy SQL</span>
              </>
            )}
          </button>

          {/* Copy JSON Button */}
          {execution && execution.rows.length > 0 && (
            <button
              onClick={handleCopyJson}
              className="hidden sm:flex items-center space-x-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-lg transition text-xs font-sans"
              title="Copy Query Results as JSON"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">Copied JSON!</span>
                </>
              ) : (
                <>
                  <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* SQL Code Terminal */}
      <div className="p-4 bg-[#050811] font-mono text-xs overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <tbody>
            {sqlLines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/5 transition-colors">
                <td className="w-8 select-none text-gray-600 text-right pr-4 py-0.5 align-top">
                  {idx + 1}
                </td>
                <td className="py-0.5 text-blue-300 whitespace-pre">
                  {highlightSqlKeywords(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanation Footer */}
      {explanation && (
        <div className="bg-surface/60 px-4 py-2.5 border-t border-white/10 text-xs text-gray-300 flex items-start space-x-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Query Logic & Intent: </span>
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
      return <span key={i} className="text-cyan-400 font-bold">{kw}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}
