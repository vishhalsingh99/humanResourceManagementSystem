export default function DataTable({
  headers,
  children,
  actions = false,
  className = '',
  tableClassName = 'w-full',
  headClassName = 'bg-slate-50',
  headerRowClassName = '',
  headerCellClassName = 'px-4 py-3 text-left text-sm font-semibold text-slate-600',
  bodyClassName = '',
}) {
  const tableHeaders = actions ? [...headers, 'Actions'] : headers;

  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 bg-white ${className}`}>
      <table className={tableClassName}>
        <thead className={headClassName}>
          <tr className={headerRowClassName}>
            {tableHeaders.map((header) => {
              const label = typeof header === 'string' ? header : header.label;
              const key = typeof header === 'string' ? header : header.key || header.label;
              const className = typeof header === 'string' ? headerCellClassName : header.className || headerCellClassName;

              return (
                <th key={key} className={className}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className={bodyClassName}>{children}</tbody>
      </table>
    </div>
  );
}
