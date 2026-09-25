export default function DataTable({
  headers,
  children,
  actions = false,
  className = '',
  tableClassName = 'w-full',
  headClassName = '',
  headerRowClassName = '',
  headerCellClassName = 'px-4 py-3 text-left text-sm font-semibold t-text-muted',
  bodyClassName = '',
}) {
  const tableHeaders = actions ? [...headers, 'Actions'] : headers;

  return (
    <div className={`overflow-x-auto rounded-2xl border t-border ui-card ${className}`}>
      <table className={tableClassName}>
        <thead className={`t-thead ${headClassName}`}>
          <tr className={headerRowClassName}>
            {tableHeaders.map((header) => {
              const label     = typeof header === 'string' ? header : header.label;
              const key       = typeof header === 'string' ? header : header.key || header.label;
              const cellClass = typeof header === 'string' ? headerCellClassName : header.className || headerCellClassName;
              return (
                <th key={key} className={cellClass}>
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
