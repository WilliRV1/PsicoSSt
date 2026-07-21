"use client";

import React, { useState } from "react";
import { Icons } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataGridProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onRowClick?: (row: T) => void;
  // Advanced features stubs
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
}

export function DataGrid<T extends { id: string | number }>({
  data,
  columns,
  isLoading,
  emptyState,
  onRowClick,
  searchable = true,
  filterable = true,
  exportable = true,
}: DataGridProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center bg-surface border border-border rounded-[16px]">
        <div className="animate-spin text-primary">
          <Icons.dashboard className="w-6 h-6" />
        </div>
      </div>
    );
  }

  if (!data.length && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="w-full flex flex-col bg-surface border border-border rounded-[16px] shadow-sm overflow-hidden">
      {/* Toolbar */}
      {(searchable || filterable || exportable) && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            {searchable && (
              <div className="relative">
                <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-[13px] bg-surface-muted border border-border rounded-md outline-none focus:border-primary transition-colors w-[250px]"
                />
              </div>
            )}
            {filterable && (
              <Button variant="outline" size="sm" className="h-[34px] rounded-md text-[13px] text-text-secondary border-border bg-surface-muted">
                <Icons.filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {exportable && (
              <Button variant="ghost" size="sm" className="h-[34px] rounded-md text-[13px] text-text-secondary">
                <Icons.download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              {columns.map((col) => (
                <th key={String(col.key)} className="px-6 py-3 text-[12px] font-semibold text-text-secondary uppercase tracking-wider whitespace-nowrap">
                  {col.header}
                </th>
              ))}
              <th className="px-6 py-3"></th> {/* Actions */}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((row) => (
              <tr 
                key={row.id} 
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 ${onRowClick ? 'cursor-pointer hover:bg-surface-muted/50' : 'hover:bg-surface-muted/30'}`}
              >
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-6 py-4 text-[14px] text-text whitespace-nowrap">
                    {col.render ? col.render(row) : String(row[col.key])}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="icon-sm" className="text-text-muted hover:text-text">
                    <Icons.moreHorizontal className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Stub */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-surface-muted/30">
        <span className="text-[13px] text-text-secondary">Mostrando {data.length} resultados</span>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" className="w-8 h-8 rounded-md" disabled><Icons.chevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon-sm" className="w-8 h-8 rounded-md bg-surface" disabled><Icons.chevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
}
