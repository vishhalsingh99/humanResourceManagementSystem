export default function DataTable({ headers, children, className = '', headClassName = '' }) {
  return (
    <div className={`overflow-hidden rounded-2xl ui-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className={`t-thead ${headClassName}`}>
            <tr>
              {headers.map((heading) => (
                <th key={heading} className="px-5 py-4 text-left text-sm font-semibold t-text-muted">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}
