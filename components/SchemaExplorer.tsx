'use client';

import React, { useState, useEffect } from 'react';
import { Database, Table, ChevronRight, ChevronDown, Key, Hash, Code, Eye, RefreshCw } from 'lucide-react';
import { TableSchemaInfo } from '@/lib/db';

interface SchemaExplorerProps {
  onSelectTableForQuery?: (tableName: string) => void;
}

export default function SchemaExplorer({ onSelectTableForQuery }: SchemaExplorerProps) {
  const [tables, setTables] = useState<TableSchemaInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTable, setExpandedTable] = useState<string | null>('users');
  const [previewTable, setPreviewTable] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);

  const fetchSchema = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schema');
      if (res.ok) {
        const data = await res.json();
        setTables(data.tables || []);
      }
    } catch (e) {
      console.error('Failed to load schema', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleTablePreview = async (tableName: string) => {
    if (previewTable === tableName) {
      setPreviewTable(null);
      return;
    }
    setPreviewTable(tableName);
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/schema?table=${tableName}`);
      if (res.ok) {
        const data = await res.json();
        setPreviewRows(data.preview?.rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="w-full lg:w-72 bg-surface/90 border-r border-border/80 p-4 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-200">
          <Database className="w-4 h-4 text-blue-400" />
          <span>Schema Explorer</span>
        </div>
        <button
          onClick={fetchSchema}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-card transition"
          title="Refresh Schema"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 p-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-card/60 animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 flex-1">
          {tables.map(tbl => {
            const isExpanded = expandedTable === tbl.tableName;
            const isPreviewing = previewTable === tbl.tableName;

            return (
              <div key={tbl.tableName} className="rounded-xl border border-border/50 bg-card/50 overflow-hidden transition-all duration-200">
                {/* Table Title Bar */}
                <div className="flex items-center justify-between p-2.5 hover:bg-surface-hover/80 cursor-pointer">
                  <div
                    className="flex items-center space-x-2 flex-1 min-w-0"
                    onClick={() => setExpandedTable(isExpanded ? null : tbl.tableName)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Table className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="font-mono text-xs font-semibold text-gray-200 truncate">
                      {tbl.tableName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      {tbl.rowCount} rows
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTablePreview(tbl.tableName);
                      }}
                      className={`p-1 rounded text-xs transition ${
                        isPreviewing ? 'bg-cyan-500/20 text-cyan-300' : 'text-gray-400 hover:text-white hover:bg-card'
                      }`}
                      title="Quick Preview Data"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Column Details */}
                {isExpanded && (
                  <div className="bg-surface/50 border-t border-border/40 p-2 space-y-1 text-xs">
                    {tbl.columns.map(col => (
                      <div key={col.name} className="flex items-center justify-between px-2 py-1 rounded hover:bg-card/80 font-mono">
                        <div className="flex items-center space-x-1.5 text-gray-300">
                          {col.pk ? (
                            <span title="Primary Key"><Key className="w-3 h-3 text-amber-400 flex-shrink-0" /></span>
                          ) : (
                            <Hash className="w-3 h-3 text-gray-500 flex-shrink-0" />
                          )}
                          <span className={col.pk ? 'font-semibold text-amber-200' : ''}>{col.name}</span>
                        </div>
                        <span className="text-[10px] text-gray-500 uppercase">{col.type}</span>
                      </div>
                    ))}
                    
                    {onSelectTableForQuery && (
                      <button
                        onClick={() => onSelectTableForQuery(`Show all data from table ${tbl.tableName}`)}
                        className="w-full mt-2 text-center text-[11px] text-blue-400 hover:text-blue-300 py-1 bg-blue-500/10 hover:bg-blue-500/20 rounded border border-blue-500/20 transition"
                      >
                        + Query Table
                      </button>
                    )}
                  </div>
                )}

                {/* Live Preview Overlay */}
                {isPreviewing && (
                  <div className="bg-[#0b101c] border-t border-cyan-500/30 p-2.5 text-xs font-mono overflow-x-auto">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-border/40">
                      <span className="text-[11px] text-cyan-400 font-semibold">Preview (Top 5 rows):</span>
                      <button onClick={() => setPreviewTable(null)} className="text-gray-400 hover:text-white">✕</button>
                    </div>
                    {previewLoading ? (
                      <div className="py-2 text-gray-400 text-center animate-pulse">Loading preview...</div>
                    ) : previewRows.length === 0 ? (
                      <div className="text-gray-500 text-center">No records</div>
                    ) : (
                      <div className="space-y-1.5">
                        {previewRows.map((row, idx) => (
                          <div key={idx} className="bg-card/70 p-1.5 rounded text-[10px] border border-border/40 truncate text-gray-300">
                            {JSON.stringify(row)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
