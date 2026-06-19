import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { formatUiDisplayValue } from "@/shared/lib/display-format.helpers";
import { Skeleton } from "@/components/ui/skeleton";

const AUTO_TRUNCATE_TEXT_LENGTH = 90;

const PHONE_LIKE_COLUMN_KEYWORDS = [
  "phone",
  "fax",
  "mobile",
  "landline",
  "tel",
  "whatsapp",
];

function isPhoneLikeColumn(columnId: string) {
  const normalizedId = columnId.replace(/[\s_-]/g, "").toLowerCase();

  return PHONE_LIKE_COLUMN_KEYWORDS.some((keyword) =>
    normalizedId.includes(keyword),
  );
}

function shouldForceLtrContent(columnId: string, value: ReactNode) {
  if (!isPhoneLikeColumn(columnId)) {
    return false;
  }

  return typeof value === "string" || typeof value === "number";
}

function formatCellContent(columnId: string, value: ReactNode) {
  if (!isPhoneLikeColumn(columnId)) {
    return value;
  }

  if (typeof value === "string" || typeof value === "number") {
    return formatUiDisplayValue(value, {
      isPhoneNumber: true,
      fallback: "-",
    });
  }

  return value;
}

function renderHoverableTruncatedContent(value: ReactNode) {
  if (typeof value !== "string" && typeof value !== "number") {
    return value;
  }

  const normalized = String(value).trim();
  if (!normalized) {
    return value;
  }

  const isLong = normalized.length > AUTO_TRUNCATE_TEXT_LENGTH;
  if (!isLong) {
    return normalized;
  }

  return (
    <span
      className="block max-w-[22rem] truncate"
      title={normalized}
    >
      {normalized}
    </span>
  );
}

export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  renderCell: (row: T) => ReactNode;
  sortKey?: string;
  headerClassName?: string;
  cellClassName?: string | ((row: T) => string | undefined);
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  loading?: boolean;
  sort?: string;
  onSortChange?: (sort?: string) => void;
  emptyMessage?: ReactNode;
  emptyStateClassName?: string;
  rowClassName?: string | ((row: T) => string | undefined);
  tableClassName?: string;
  tableContainerClassName?: string;
};

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  loading = false,
  sort,
  onSortChange,
  emptyMessage,
  emptyStateClassName,
  rowClassName,
  tableClassName,
  tableContainerClassName,
}: DataTableProps<T>) {
  const skeletonRowsCount = 8;
  const normalizedSort = typeof sort === "string" ? sort.trim() : "";

  return (
    <Table
      className={tableClassName}
      containerClassName={tableContainerClassName}
    >
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              className={cn(
                column.headerClassName,
                "sticky top-0 z-10 h-11 bg-accent text-[0.72rem] font-semibold tracking-[0.08em] text-muted-foreground uppercase",
              )}
            >
              {column.sortKey && onSortChange ? (
                <button
                  type="button"
                  className="group inline-flex w-full items-center gap-2 text-start outline-none"
                  onClick={() => {
                    const key = column.sortKey ?? "";
                    if (!key) return;

                    const asc = key;
                    const desc = `-${key}`;

                    const next =
                      normalizedSort === desc
                        ? undefined
                        : normalizedSort === asc
                          ? desc
                          : asc;

                    onSortChange(next);
                  }}
                >
                  <span className="min-w-0  truncate">{column.header}</span>
                  <span className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-muted-foreground">
                    {normalizedSort === `-${column.sortKey}` ? (
                      <ArrowDown className="size-3.5" />
                    ) : normalizedSort === column.sortKey ? (
                      <ArrowUp className="size-3.5" />
                    ) : (
                      <ArrowUpDown className="size-3.5 opacity-60" />
                    )}
                  </span>
                </button>
              ) : (
                column.header
              )}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading
          ? Array.from({ length: skeletonRowsCount }).map((_, rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`}>
                {columns.map((column) => (
                  <TableCell key={`${column.id}-skeleton-${rowIndex}`}>
                    <Skeleton className="h-4 w-full max-w-[220px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          : null}

        {!loading
          ? rows.map((row) => (
              <TableRow
                key={getRowId(row)}
                className={cn(
                  typeof rowClassName === "function"
                    ? rowClassName(row)
                    : rowClassName,
                )}
              >
                {columns.map((column) => {
                const rawCellContent = column.renderCell(row);
                const cellContent = formatCellContent(column.id, rawCellContent);
                const displayedCellContent = renderHoverableTruncatedContent(cellContent);

                return (
                  <TableCell
                    key={column.id}
                    className={cn(
                      typeof column.cellClassName === "function"
                        ? column.cellClassName(row)
                        : column.cellClassName,
                    )}
                  >
                    {shouldForceLtrContent(column.id, cellContent) ? (
                      <span
                        dir="ltr"
                        className="inline-block max-w-full [direction:ltr] [unicode-bidi:isolate]"
                      >
                        {displayedCellContent}
                      </span>
                    ) : (
                      displayedCellContent
                    )}
                  </TableCell>
                );
              })}
              </TableRow>
          ))
          : null}

        {!loading && rows.length === 0 && emptyMessage ? (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className={cn(
                "px-4 py-6 text-center text-sm text-muted-foreground",
                emptyStateClassName,
              )}
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : null}
      </TableBody>
    </Table>
  );
}
