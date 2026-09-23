import { memo } from 'react';
import InputField from '../../../components/common/InputField';
import SearchBar from '../../../components/common/SearchBar';
import SelectField from '../../../components/common/SelectField';
import { ATTENDANCE_STATUSES } from '../utils/constants';

function AttendanceFilters({ search, status, date, onSearchChange, onStatusChange, onDateChange }) {
  return(
   <div className="mb-6 flex flex-col gap-4 sm:flex-row">
    <SearchBar className="flex-1" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search by employee name or ID..." inputClassName="rounded-lg focus:border-amber-500" />
    <InputField type="date" value={date} onChange={(event) => onDateChange(event.target.value)} inputClassName="rounded-lg py-2.5 focus:border-amber-500" />
    <SelectField value={status} onChange={(event) => onStatusChange(event.target.value)} inputClassName="rounded-lg py-2.5 focus:border-amber-500">
      <option value="All">All Status</option>{ATTENDANCE_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}
    </SelectField>
  </div>
  )
}

export default memo(AttendanceFilters);
