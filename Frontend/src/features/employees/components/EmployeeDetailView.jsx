import { Download } from 'lucide-react';
import Button from '../../../components/common/Button';
import { employeeDetailGroups } from '../config/employeeDetails.config';
import EmployeeDetailSection from './EmployeeDetailSection';
import { useApp } from '../../../context/AppContext';
import { buildUploadedFileUrl } from '../../../utils';

export default function EmployeeDetailView({
  employee,
  onBack,
  onEdit,
  canEdit = false,
  onDownloadPdf,
}) {
  const { onboarding } = useApp();
  const company = onboarding?.company || {};
  const companyLogoUrl = buildUploadedFileUrl(company.logoPreview);

  return (
    <div className="min-h-screen mt-18 bg-slate-100 p-4 sm:p-6 lg:p-10">
      <div className="mx-auto max-w-5xl bg-white shadow-2xl border border-slate-300">
        <div className="border-b-4 border-black px-6 py-6">
          <div className="flex mt-5 items-start justify-between gap-4">
            <Button onClick={onBack} className="rounded-md px-4 py-2">
              Back
            </Button>
            <Button
              onClick={() => onDownloadPdf(employee)}
              icon={Download}
              variant="success"
              className="rounded-lg px-5 py-2"
            >
              Print
            </Button>
          </div>

          <div className="flex mt-12 items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {companyLogoUrl && (
                <img
                  src={companyLogoUrl}
                  alt="Company logo"
                  className="h-16 w-16 object-contain"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-wide text-slate-900">
                  {company.companyName || 'HRMS'}
                </h1>
                {company.address && (
                  <p className="whitespace-pre-line text-sm text-slate-600">
                    {company.address}
                  </p>
                )}
              </div>
            </div>
          </div>

          <h2 className="mt-8 text-center text-2xl font-bold text-slate-900">
            EMPLOYEE DETAILS FORM
          </h2>
        </div>

        <div className="space-y-10 px-6 py-8">
          {employeeDetailGroups.map((group) => (
            <EmployeeDetailSection key={group.title} employee={employee} group={group} />
          ))}

          <div>
            <h3 className="mb-5 text-xl font-bold text-slate-900">10. Declaration</h3>
            <p className="text-sm text-slate-700 leading-7">
              I hereby declare that the above information is true to the best of my knowledge.
            </p>
            <div className="mt-10   gap-8 md:grid-cols-2">
              <div className="mb-10  pb-2 text-sm font-medium">
                <p>Employee Signature: ___________________</p>
              </div>
              <div>
                <p className="mb-10    pb-2 text-sm font-medium">
                  Date: _____/_______/________
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-slate-300 pt-6">
            <Button onClick={onBack} variant="secondary" className="rounded-md px-5 py-2">
              Close
            </Button>

            {canEdit && (
              <Button
                onClick={() => onEdit(employee)}
                variant="success"
                className="rounded-md px-5 py-2"
              >
                Edit Employee
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
