'use client';

import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Table as TableIcon, Filter } from 'lucide-react';
import { QueryExecutionResult } from '@/lib/db';

interface DataTableProps {
  execution: QueryExecutionResult;
}

export default function DataTable({ execution }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const { columns, rows } = execution;

  // Filter rows based on search input
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row =>
      Object.values(row).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [rows, searchTerm]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

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
  };

  if (!rows || rows.length === 0) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center">
        <TableIcon className="w-10 h-10 text-gray-500 mx-auto mb-2 opacity-50" />
        <h4 className="text-sm font-semibold text-gray-300">No Rows Returned</h4>
        <p className="text-xs text-gray-500 mt-1">The query executed successfully but produced 0 records.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xl mb-6">
      {/* Table Toolbar */}
      <div className="bg-surface px-4 py-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <TableIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-gray-200 uppercase tracking-wider font-mono">Results Data Grid</span>
          <span className="text-xs text-gray-400 font-mono">
            ({filteredRows.length} of {rows.length} total rows)
          </span>
        </div>

        <div className="flex items-center space-x-3">
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
              className="bg-[#0b101c] border border-border/80 rounded-lg pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-emerald-400/80 w-44 sm:w-56 font-sans transition"
            />
          </div>

          {/* Download CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-lg transition text-xs font-medium"
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
            <tr className="bg-surface/80 border-b border-border/60 text-gray-400 font-mono uppercase text-[11px]">
              <th className="py-2.5 px-4 w-10 text-center font-normal text-gray-600">#</th>
              {columns.map(col => (
                <th key={col} className="py-2.5 px-4 font-semibold text-gray-300 whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginatedRows.map((row, rowIdx) => {
              const globalIndex = (currentPage - 1) * pageSize + rowIdx + 1;
              return (
                <tr key={rowIdx} className="hover:bg-surface-hover/60 transition-colors">
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
        <div className="bg-surface px-4 py-2.5 border-t border-border/60 flex items-center justify-between text-xs text-gray-400">
          <div>
            Showing <span className="text-gray-200 font-semibold font-mono">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="text-gray-200 font-semibold font-mono">{Math.min(currentPage * pageSize, filteredRows.length)}</span> of{' '}
            <span className="text-gray-200 font-semibold font-mono">{filteredRows.length}</span> entries
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              className="p-1 rounded bg-card hover:bg-surface-hover border border-border/60 text-gray-300 disabled:opacity-40 disabled:hover:bg-card transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-gray-300 px-2 text-xs">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              className="p-1 rounded bg-card hover:bg-surface-hover border border-border/60 text-gray-300 disabled:opacity-40 disabled:hover:bg-card transition"
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
      <span className={`px-1.5 py-0.5 rounded text-[10px] ${value ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span className="text-cyan-300">{value}</span>;
  }
  return <span>{String(value)}</span>;
}
