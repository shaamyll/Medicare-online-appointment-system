import React, { createContext, useContext } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

interface TableContextType {
  showSerial?: boolean;
}

const TableContext = createContext<TableContextType>({ showSerial: true });

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  showSerial?: boolean;
}

export const Table: React.FC<TableProps> = ({ className, children, showSerial = true, ...props }) => (
  <TableContext.Provider value={{ showSerial }}>
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className={cn('w-full caption-bottom text-sm text-left border-collapse', className)} {...props}>
        {children}
      </table>
    </div>
  </TableContext.Provider>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <thead className={cn('bg-gray-50 border-b border-gray-200 text-xs uppercase font-semibold tracking-wider text-gray-500 select-none', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-gray-200 bg-white', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
  <tr className={cn('transition-colors hover:bg-gray-50/80', className)} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <th className={cn('px-4 py-3 font-semibold text-gray-700 text-xs tracking-wider align-middle', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <td className={cn('px-4 py-3.5 text-sm text-gray-700 align-middle', className)} {...props}>
    {children}
  </td>
);

/**
 * Standard S.No Header Column
 */
export const TableHeadSerial: React.FC<{ className?: string }> = ({ className }) => (
  <th className={cn('w-14 px-3 py-3 text-center font-semibold text-gray-400 text-xs tracking-wider uppercase align-middle', className)}>
    S.No
  </th>
);

/**
 * Standard S.No Cell Column
 */
export const TableCellSerial: React.FC<{
  index: number;
  page?: number;
  pageSize?: number;
  className?: string;
}> = ({ index, page = 1, pageSize = 0, className }) => {
  const serial = pageSize > 0 ? (page - 1) * pageSize + index + 1 : index + 1;
  return (
    <td className={cn('w-14 px-3 py-3.5 text-center font-mono text-xs text-gray-400 select-none align-middle', className)}>
      {serial}
    </td>
  );
};

export const useTableContext = () => useContext(TableContext);

/**
 * Unified Table/Card Pagination Strip
 */
export interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  limit?: number;
  itemLabel?: string;
  onPageChange: (newPage: number) => void;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  totalPages,
  totalItems,
  pageSize,
  limit,
  itemLabel = 'entries',
  onPageChange,
  className,
}) => {
  const effectivePageSize = limit || pageSize;

  if (totalPages <= 1 && (!totalItems || totalItems <= (effectivePageSize || 10))) {
    return null;
  }

  const startItem = effectivePageSize ? (page - 1) * effectivePageSize + 1 : 1;
  const endItem = effectivePageSize && totalItems ? Math.min(page * effectivePageSize, totalItems) : totalItems;

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600 rounded-b-xl select-none',
        className
      )}
    >
      <div>
        {totalItems !== undefined && effectivePageSize ? (
          <span>
            Showing <strong className="font-semibold text-gray-900">{startItem}</strong> to{' '}
            <strong className="font-semibold text-gray-900">{endItem}</strong> of{' '}
            <strong className="font-semibold text-gray-900">{totalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Page <strong className="font-semibold text-gray-900">{page}</strong> of{' '}
            <strong className="font-semibold text-gray-900">{totalPages || 1}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="h-8 px-2.5"
          aria-label="Previous Page"
          leftIcon={<ChevronLeft className="h-4 w-4" />}
        >
          
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {Array.from({ length: Math.min(totalPages, 5) }).map((_, idx) => {
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = idx + 1;
          } else if (page <= 3) {
            pageNum = idx + 1;
          } else if (page >= totalPages - 2) {
            pageNum = totalPages - 4 + idx;
          } else {
            pageNum = page - 2 + idx;
          }

          const isCurrent = pageNum === page;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={cn(
                'min-w-[32px] h-8 px-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer',
                isCurrent
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
              )}
            >
              {pageNum}
            </button>
          );
        })}

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="h-8 px-2.5"
          aria-label="Next Page"
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          <span className="hidden sm:inline">Next</span>
          
        </Button>
      </div>
    </div>
  );
};
