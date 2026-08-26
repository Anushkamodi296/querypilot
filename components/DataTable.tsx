'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Table as TableIcon, ArrowUpDown, ArrowUp, ArrowDown, FileCode } from 'lucide-react';
import { QueryExecutionResult } from '@/lib/db';

interface DataTableProps {
  execution: QueryExecutionResult;
  onCopyNotice?: (msg: string) => void;
  sectionTitle?: string;
}

export default function DataTable({ execution, onCopyNotice, sectionTitle = 'RESULTS DATA GRID' }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const pageSize = 8;

  const { columns, rows } = execution;

  const handleSort = (colName: string) => {
    if (sortColumn === colName) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colName);
      setSortDirection('asc');
    }
  };

  const processedRows = useMemo(() => {
    let result = [...rows];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        let cmp = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          cmp = valA - valB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, searchTerm, sortColumn, sortDirection]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  const exportToCSV = () => {
    if (rows.length === 0) return;

    const headers = columns.join(',');
    const csvRows = rows.map(r =>
      columns.map(col => {
        const val = r[col];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `querypilot_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onCopyNotice) onCopyNotice('CSV file exported successfully!');
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    if (onCopyNotice) onCopyNotice('JSON data copied to clipboard!');
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border border-[var(--border-color)]">
        <TableIcon className="w-10 h-10 text-[var(--text-secondary)] mx-auto mb-2 opacity-40" />
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">No Rows Returned</h4>
        <p className="text-xs text-[var(--text-secondary)] mt-1">The query executed successfully but produced 0 records.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-2xl mb-6 border border-[var(--border-color)] font-sans transition-all duration-300">
      {/* Table Toolbar */}
      <div className="bg-[var(--bg-surface)] px-4 py-3 border-b border-[var(--border-color)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-4 h-4 text-[var(--accent-color)]" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">{sectionTitle}</span>
          <span className="text-xs text-[var(--text-secondary)] font-mono">
            ({processedRows.length} of {rows.length} rows)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl pl-8 pr-3 py-1 text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)] focus:outline-none focus:border-[var(--accent-color)] w-36 sm:w-48 font-mono transition"
            />
          </div>

          {/* Copy JSON Button */}
          <button
            onClick={copyJson}
            className="flex items-center space-x-1 bg-[var(--bg-primary)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-color)] px-2.5 py-1 rounded-xl transition text-xs font-mono"
            title="Copy JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-[var(--accent-color)]" />
            <span>Copy JSON</span>
          </button>

          {/* Download CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1 bg-[var(--accent-color)] hover:opacity-90 text-[var(--bg-primary)] border border-[var(--border-color)] px-3 py-1 rounded-xl transition text-xs font-bold font-mono shadow"
            title="Download Query Results as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[var(--bg-surface)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-mono uppercase text-[11px] select-none sticky top-0 z-10">
              <th className="py-3 px-4 w-10 text-center font-normal">#</th>
              {columns.map(col => {
                const isSorted = sortColumn === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-3 px-4 font-semibold text-[var(--text-primary)] whitespace-nowrap cursor-pointer hover:bg-[var(--bg-hover)] transition"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-[var(--accent-color)]" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-[var(--accent-color)]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] font-mono">
            {paginatedRows.map((row, rowIdx) => {
              const globalIndex = (currentPage - 1) * pageSize + rowIdx + 1;
              const isEven = rowIdx % 2 === 0;

              return (
                <tr
                  key={rowIdx}
                  className={`transition-colors hover:bg-[var(--bg-hover)] ${
                    isEven ? 'bg-transparent' : 'bg-[var(--bg-card)]/40'
                  }`}
                >
                  <td className="py-2.5 px-4 text-center text-[var(--text-secondary)] text-[10px]">
                    {globalIndex}
                  </td>
                  {columns.map(col => {
                    const value = row[col];
                    return (
                      <td key={col} className="py-2.5 px-4 text-[var(--text-primary)] whitespace-nowrap">
                        {renderCellValue(value)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="bg-[var(--bg-surface)] px-4 py-2.5 border-t border-[var(--border-color)] flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
          <div>
            Showing <span className="text-[var(--text-primary)] font-bold">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-[var(--text-primary)] font-bold">{Math.min(currentPage * pageSize, processedRows.length)}</span> of{' '}
            <span className="text-[var(--text-primary)] font-bold">{processedRows.length}</span> entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[var(--text-primary)] px-2 text-xs font-semibold">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1 rounded-lg bg-[var(--bg-card)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)] disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCellValue(value: any) {
  if (value === null || value === undefined) {
    return <span className="text-gray-500 italic">null</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="text-[var(--accent-color)] font-semibold">{value}</span>;
  }
  return <span>{String(value)}</span>;
}
