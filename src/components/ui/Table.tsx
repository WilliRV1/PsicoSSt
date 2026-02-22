import React from 'react';

interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: keyof T;
  onRowClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  loading?: boolean;
  striped?: boolean;
}

function Table<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  onRowClick,
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  striped = true,
}: TableProps<T>) {
  const getRowKey = (row: T, index: number) => {
    if (keyField) return String(row[keyField]);
    return index;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E8E8E8]">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#1E88E5] border-b border-[#1E88E5]">
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-sm font-semibold text-white"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-8 text-center">
                <div className="flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-[#0051BA] border-t-transparent rounded-full animate-spin"></div>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-8 text-center text-[#666666]"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row, index)}
                className={`
                  border-b border-[#E8E8E8] transition-colors duration-150
                  ${striped && index % 2 === 1 ? 'bg-[#F5F5F5]' : 'bg-white'}
                  hover:bg-[#EFEFEF] cursor-pointer
                  ${onRowClick ? 'hover:shadow-sm' : ''}
                `}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((column) => {
                  const value = row[column.key as keyof T];
                  const renderedValue = column.render
                    ? column.render(value, row, index)
                    : value;

                  return (
                    <td
                      key={`${getRowKey(row, index)}-${String(column.key)}`}
                      className="px-6 py-4 text-sm text-[#212121]"
                      style={{ width: column.width }}
                    >
                      {renderedValue}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
