import { useState } from 'react';
import { fullName, prettyEnum } from '../utils/format';

const DOCUMENT_TYPES = ['CONTRACT', 'ID_CARD', 'CERTIFICATE', 'OTHER'];
const ACCEPTED_TYPES = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.webp';
const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function DocumentForm({
  employees = [],
  onSubmit,
  onCancel,
  busy,
  initial = null,
  defaultEmployeeId = '',
  lockEmployee = false,
}) {
  const isEdit = Boolean(initial);
  const [form, setForm] = useState({
    employeeId: initial?.employeeId || defaultEmployeeId || '',
    title: initial?.title || '',
    documentType: initial?.documentType || 'CONTRACT',
    file: null,
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateFile(event) {
    const file = event.target.files?.[0] || null;
    setForm((current) => ({ ...current, file }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!isEdit && !form.employeeId) nextErrors.employeeId = 'Employee is required';
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.documentType) nextErrors.documentType = 'Type is required';
    if (!isEdit && !form.file) nextErrors.file = 'File is required';
    if (form.file && form.file.size > MAX_FILE_BYTES) nextErrors.file = 'File must be 10MB or smaller';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      employeeId: form.employeeId,
      title: form.title.trim(),
      documentType: form.documentType,
      file: form.file,
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        {!isEdit && !lockEmployee && (
          <label className="field field-wide">
            <span>Employee</span>
            <select name="employeeId" value={form.employeeId} onChange={updateField}>
              <option value="">Select an employee</option>
              {employees.map((person) => (
                <option key={person.id} value={person.id}>
                  {fullName(person)}
                </option>
              ))}
            </select>
            {errors.employeeId && <small>{errors.employeeId}</small>}
          </label>
        )}
        <label className="field">
          <span>Title</span>
          <input name="title" value={form.title} onChange={updateField} placeholder="Employment contract" />
          {errors.title && <small>{errors.title}</small>}
        </label>
        <label className="field">
          <span>Type</span>
          <select name="documentType" value={form.documentType} onChange={updateField}>
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {prettyEnum(type)}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          <span>{isEdit ? 'Replace file (optional)' : 'File'}</span>
          <input type="file" name="file" accept={ACCEPTED_TYPES} onChange={updateFile} />
          {form.file && <small className="muted">{form.file.name}</small>}
          {isEdit && initial?.originalFileName && !form.file && (
            <small className="muted">Current file: {initial.originalFileName}</small>
          )}
          {errors.file && <small>{errors.file}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : isEdit ? 'Save changes' : 'Upload document'}
        </button>
      </div>
    </form>
  );
}
