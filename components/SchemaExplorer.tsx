'use client';

import React, { useState, useEffect } from 'react';
import { Database, Table, ChevronRight, ChevronDown, Key, Hash, Eye, RefreshCw } from 'lucide-react';
import { TableSchemaInfo } from '@/lib/db';

interface SchemaExplorerProps {
  onSelectTableForQuery?: (tableName: string) => void;
  sectionTitle?: string;
}

export default function SchemaExplorer({ onSelectTableForQuery, sectionTitle = 'DATABASE SCHEMA' }: SchemaExplorerProps) {
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
    <div className="w-full lg:w-80 bg-[var(--bg-surface)] border-r border-[var(--border-color)] p-4 flex flex-col h-full overflow-y-auto font-sans transition-colors duration-300">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center space-x-2 text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
          <Database className="w-4 h-4 text-[var(--accent-color)]" />
          <span>{sectionTitle}</span>
        </div>
        <button
          onClick={fetchSchema}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded hover:bg-[var(--bg-card)] transition"
          title="Refresh Schema"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 p-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-12 bg-[var(--bg-card)] animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5 flex-1">
          {tables.map(tbl => {
            const isExpanded = expandedTable === tbl.tableName;
            const isPreviewing = previewTable === tbl.tableName;

            return (
              <div key={tbl.tableName} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden transition-all duration-200 shadow-md">
                {/* Table Header Row */}
                <div className="flex items-center justify-between p-3 hover:bg-[var(--bg-hover)] cursor-pointer">
                  <div
                    className="flex items-center space-x-2 flex-1 min-w-0"
                    onClick={() => setExpandedTable(isExpanded ? null : tbl.tableName)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0" />
                    )}
                    <Table className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0" />
                    <span className="font-mono text-xs font-semibold text-[var(--text-primary)] truncate">
                      {tbl.tableName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-primary)] text-[var(--text-secondary)] border border-[var(--border-color)]">
                      {tbl.rowCount} rows
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTablePreview(tbl.tableName);
                      }}
                      className={`p-1.5 rounded-lg text-xs transition ${
                        isPreviewing ? 'bg-[var(--accent-color)] text-[var(--bg-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                      }`}
                      title="Quick Table Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Columns Tree */}
                {isExpanded && (
                  <div className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] p-2.5 space-y-1.5 text-xs font-mono">
                    {tbl.columns.map(col => (
                      <div key={col.name} className="flex items-center justify-between px-2 py-1 rounded hover:bg-[var(--bg-hover)]">
                        <div className="flex items-center space-x-1.5 text-[var(--text-primary)]">
                          {col.pk ? (
                            <span title="Primary Key"><Key className="w-3 h-3 text-[var(--accent-color)] flex-shrink-0" /></span>
                          ) : (
                            <Hash className="w-3 h-3 text-[var(--text-secondary)] flex-shrink-0" />
                          )}
                          <span className={col.pk ? 'font-bold text-[var(--accent-color)]' : ''}>{col.name}</span>
                        </div>
                        <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold">{col.type}</span>
                      </div>
                    ))}
                    
                    {onSelectTableForQuery && (
                      <button
                        onClick={() => onSelectTableForQuery(`Show all records from ${tbl.tableName}`)}
                        className="w-full mt-2 text-center text-[11px] font-bold text-[var(--bg-primary)] bg-[var(--accent-color)] hover:opacity-90 py-1.5 rounded-lg transition shadow"
                      >
                        + Select {tbl.tableName}
                      </button>
                    )}
                  </div>
                )}

                {/* Table Preview Drawer */}
                {isPreviewing && (
                  <div className="bg-[var(--bg-primary)] border-t border-[var(--border-color)] p-3 text-xs font-mono overflow-x-auto">
                    <div className="flex items-center justify-between mb-2 pb-1 border-b border-[var(--border-color)]">
                      <span className="text-[11px] text-[var(--accent-color)] font-bold">Top 5 Records Preview:</span>
                      <button onClick={() => setPreviewTable(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
                    </div>
                    {previewLoading ? (
                      <div className="py-2 text-[var(--text-secondary)] text-center animate-pulse">Loading preview...</div>
                    ) : previewRows.length === 0 ? (
                      <div className="text-[var(--text-secondary)] text-center">No rows found</div>
                    ) : (
                      <div className="space-y-1.5">
                        {previewRows.map((row, idx) => (
                          <div key={idx} className="bg-[var(--bg-card)] p-2 rounded-lg text-[10px] border border-[var(--border-color)] truncate text-[var(--text-primary)]">
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
