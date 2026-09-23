export default function DataTable({ headers, children, className = '', headClassName = 'bg-slate-50' }) {
  return (
    <div className={`overflow-hidden rounded-none border border-slate-200 bg-white ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead className={headClassName}>
            <tr>
              {headers.map((heading) => (
                <th key={heading} className="px-5 py-4 text-left text-sm font-semibold text-slate-800">
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
