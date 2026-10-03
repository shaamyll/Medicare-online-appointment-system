import React, { createContext, useContext } from 'react';
import { cn } from '@/lib/utils';

interface TableContextType {
  showSerial?: boolean;
}

const TableContext = createContext<TableContextType>({ showSerial: true });

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  showSerial?: boolean;
}

export const Table: React.FC<TableProps> = ({ className, children, showSerial = true, ...props }) => (
  <TableContext.Provider value={{ showSerial }}>
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200">
      <table className={cn('w-full caption-bottom text-sm text-left', className)} {...props}>
        {children}
      </table>
    </div>
  </TableContext.Provider>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <thead className={cn('bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-slate-200 bg-white', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
  <tr className={cn('transition-colors hover:bg-slate-50/70', className)} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <th className={cn('px-4 py-3.5 font-medium text-slate-700', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <td className={cn('px-4 py-3.5 text-slate-600', className)} {...props}>
    {children}
  </td>
);

/**
 * Standard S.No Header Column
 */
export const TableHeadSerial: React.FC<{ className?: string }> = ({ className }) => (
  <th className={cn('w-14 px-3 py-3.5 text-center font-semibold text-slate-400 text-xs tracking-wider', className)}>
    S.No
  </th>
);

/**
 * Standard S.No Cell Column
 * Automatically computes continuous 1-based indexing based on page & pageSize
 */
export const TableCellSerial: React.FC<{
  index: number;
  page?: number;
  pageSize?: number;
  className?: string;
}> = ({ index, page = 1, pageSize = 0, className }) => {
  const serial = pageSize > 0 ? (page - 1) * pageSize + index + 1 : index + 1;
  return (
    <td className={cn('w-14 px-3 py-3.5 text-center font-mono text-xs text-slate-400 select-none', className)}>
      {serial}
    </td>
  );
};

export const useTableContext = () => useContext(TableContext);
