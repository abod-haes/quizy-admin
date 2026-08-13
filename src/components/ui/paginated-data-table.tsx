import type { ReactNode } from "react";

import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { TableShell } from "@/components/ui/table-shell";
import { cn } from "@/lib/utils";

const DEFAULT_SHELL_CLASS =
  "flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-primary/10 bg-card shadow-[0_10px_30px_rgba(45,27,90,0.05)]";
const DEFAULT_TABLE_CLASS =
  "[&_thead_th]:h-12 [&_thead_th]:border-b [&_thead_th]:border-primary/10 [&_thead_th]:bg-muted/45 [&_thead_th]:px-4 [&_thead_th]:py-3 [&_thead_th]:text-xs [&_thead_th]:font-semibold [&_thead_th]:tracking-[0.04em] [&_thead_th]:text-foreground [&_thead_th]:uppercase [&_tbody_td]:px-4";
const DEFAULT_TABLE_CONTAINER_CLASS =
  "h-full min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto overscroll-contain";

type PaginationConfig = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  getPageLabel: (page: number) => string;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeLabel?: string;
  pageSizeAriaLabel?: string;
};

type PaginatedDataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  summaryText: string;
  pagination: PaginationConfig;
  sort?: string;
  onSortChange?: (sort?: string) => void;
  emptyMessage?: ReactNode;
  emptyStateClassName?: string;
  rowClassName?: string | ((row: T) => string | undefined);
  tableClassName?: string;
  tableContainerClassName?: string;
  className?: string;
};

export function PaginatedDataTable<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  summaryText,
  pagination,
  sort,
  onSortChange,
  emptyMessage,
  emptyStateClassName,
  rowClassName,
  tableClassName,
  tableContainerClassName,
  className,
}: PaginatedDataTableProps<T>) {
  return (
    <TableShell
      summaryText={summaryText}
      currentPage={pagination.currentPage}
      totalPages={pagination.totalPages}
      onPageChange={pagination.onPageChange}
      previousLabel={pagination.previousLabel}
      nextLabel={pagination.nextLabel}
      getPageLabel={pagination.getPageLabel}
      pageSize={pagination.pageSize}
      pageSizeOptions={pagination.pageSizeOptions}
      onPageSizeChange={pagination.onPageSizeChange}
      pageSizeLabel={pagination.pageSizeLabel}
      pageSizeAriaLabel={pagination.pageSizeAriaLabel}
      className={cn(DEFAULT_SHELL_CLASS, className)}
    >
      <DataTable
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        loading={loading}
        sort={sort}
        onSortChange={onSortChange}
        emptyMessage={emptyMessage}
        emptyStateClassName={emptyStateClassName}
        rowClassName={rowClassName}
        tableClassName={cn(DEFAULT_TABLE_CLASS, tableClassName)}
        tableContainerClassName={cn(
          DEFAULT_TABLE_CONTAINER_CLASS,
          tableContainerClassName,
        )}
      />
    </TableShell>
  );
}
