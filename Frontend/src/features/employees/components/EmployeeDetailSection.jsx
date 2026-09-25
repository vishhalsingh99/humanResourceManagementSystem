import { getDetailValue } from '../utils/employee.utils';
import EmployeeDetailField from './EmployeeDetailField';

export default function EmployeeDetailSection({ employee, group }) {
  return (
    <div>
      <h3 className="mb-5 text-xl font-bold t-text-heading">{group.title}</h3>
      <div className="space-y-4">
        {group.fields.map(([label, field]) => (
          <EmployeeDetailField key={label} label={label} value={getDetailValue(employee, field)} />
        ))}
      </div>
    </div>
  );
}
