import EmployeeFormField from './EmployeeFormField';

export default function EmployeeFormSection({ section, form, onFieldChange, onAddOption, fieldErrors = {} }) {
  const visibleFields = section.fields.filter((field) => (
    typeof field.visibleWhen === 'function' ? field.visibleWhen(form) : true
  ));

  return (
    <div className={section.sectionClassName || 'mt-10'}>
      <h3 className="mb-6 border-b t-divider pb-3 text-2xl font-medium t-text-heading">
        {section.title}
      </h3>

      <div className={section.gridClassName}>
        {visibleFields.map((field) => (
          <EmployeeFormField
            key={field.name}
            field={{
              ...field,
              fileName: field.type === 'file' ? form.resumeFile : '',
            }}
            value={form[field.name]}
            onChange={onFieldChange}
            onAddOption={onAddOption}
            error={fieldErrors[field.name] || ''}
          />
        ))}
      </div>
    </div>
  );
}
