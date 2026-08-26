'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Table as TableIcon, ArrowUpDown, ArrowUp, ArrowDown, FileCode } from 'lucide-react';
import { QueryExecutionResult } from '@/lib/db';

interface DataTableProps {
  execution: QueryExecutionResult;
  onCopyNotice?: (msg: string) => void;
}

export default function DataTable({ execution, onCopyNotice }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const pageSize = 8;

  const { columns, rows } = execution;

  // Handle Header Column Click Sorting
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

  // Filter & Sort rows
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Search Filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        Object.values(row).some(val =>
          val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }

    // Sort
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

  // Pagination calculation
  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage, pageSize]);

  // CSV Export functionality
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

    if (onCopyNotice) onCopyNotice('CSV file downloaded successfully!');
  };

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(rows, null, 2));
    if (onCopyNotice) onCopyNotice('JSON data copied to clipboard!');
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center border border-white/10">
        <TableIcon className="w-10 h-10 text-gray-500 mx-auto mb-2 opacity-40" />
        <h4 className="text-sm font-semibold text-gray-300">No Rows Returned</h4>
        <p className="text-xs text-gray-500 mt-1">The query executed successfully but produced 0 records.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl overflow-hidden shadow-2xl mb-6 border border-white/10">
      {/* Table Toolbar */}
      <div className="bg-surface px-4 py-3 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider font-mono">Results Data Grid</span>
          <span className="text-xs text-gray-400 font-mono">
            ({processedRows.length} of {rows.length} rows)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-[#050811] border border-white/10 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-400/80 w-36 sm:w-48 font-sans transition"
            />
          </div>

          {/* Copy JSON Button */}
          <button
            onClick={copyJson}
            className="flex items-center space-x-1 bg-surface hover:bg-white/10 text-gray-300 border border-white/10 px-2.5 py-1 rounded-lg transition text-xs"
            title="Copy JSON"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" />
            <span>Copy JSON</span>
          </button>

          {/* Download CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg transition text-xs font-medium"
            title="Download Query Results as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse font-sans">
          <thead>
            <tr className="bg-surface/80 border-b border-white/10 text-gray-400 font-mono uppercase text-[11px] select-none">
              <th className="py-3 px-4 w-10 text-center font-normal text-gray-500">#</th>
              {columns.map(col => {
                const isSorted = sortColumn === col;
                return (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="py-3 px-4 font-semibold text-gray-300 whitespace-nowrap cursor-pointer hover:text-white hover:bg-white/5 transition"
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>{col}</span>
                      {isSorted ? (
                        sortDirection === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-cyan-400" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {paginatedRows.map((row, rowIdx) => {
              const globalIndex = (currentPage - 1) * pageSize + rowIdx + 1;
              const isEven = rowIdx % 2 === 0;

              return (
                <tr
                  key={rowIdx}
                  className={`transition-colors hover:bg-blue-500/10 ${
                    isEven ? 'bg-transparent' : 'bg-white/[0.02]'
                  }`}
                >
                  <td className="py-2.5 px-4 text-center text-gray-500 font-mono text-[10px]">
                    {globalIndex}
                  </td>
                  {columns.map(col => {
                    const value = row[col];
                    return (
                      <td key={col} className="py-2.5 px-4 text-gray-200 whitespace-nowrap font-mono">
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
        <div className="bg-surface px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <div>
            Showing <span className="text-white font-semibold font-mono">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-white font-semibold font-mono">{Math.min(currentPage * pageSize, processedRows.length)}</span> of{' '}
            <span className="text-white font-semibold font-mono">{processedRows.length}</span> entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1 rounded bg-card hover:bg-surface border border-white/10 text-gray-300 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-gray-300 px-2 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1 rounded bg-card hover:bg-surface border border-white/10 text-gray-300 disabled:opacity-40 transition"
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
    return <span className="text-gray-600 italic">null</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="text-cyan-300">{value}</span>;
  }
  return <span>{String(value)}</span>;
}
