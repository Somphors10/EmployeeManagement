import { useState } from 'react';
import { fullName, prettyEnum } from '../utils/format';

const DOCUMENT_TYPES = ['CONTRACT', 'ID_CARD', 'CERTIFICATE', 'OTHER'];

export default function DocumentForm({ employees = [], onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    employeeId: '',
    title: '',
    fileUrl: '',
    documentType: 'CONTRACT',
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.employeeId) nextErrors.employeeId = 'Employee is required';
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    if (!form.fileUrl.trim()) nextErrors.fileUrl = 'File URL is required';
    if (!form.documentType) nextErrors.documentType = 'Type is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      employeeId: form.employeeId,
      title: form.title.trim(),
      fileUrl: form.fileUrl.trim(),
      documentType: form.documentType,
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
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
          <span>File URL</span>
          <input
            name="fileUrl"
            value={form.fileUrl}
            onChange={updateField}
            placeholder="https://files.company.com/contracts/jane.pdf"
          />
          {errors.fileUrl && <small>{errors.fileUrl}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Add document'}
        </button>
      </div>
    </form>
  );
}
