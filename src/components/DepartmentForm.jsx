import { useState } from 'react';
import { fullName } from '../utils/format';

export default function DepartmentForm({ employees = [], initial, onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    managerId: initial?.managerId || '',
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Name is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      managerId: form.managerId || undefined,
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Department name</span>
          <input name="name" value={form.name} onChange={updateField} placeholder="Engineering" />
          {errors.name && <small>{errors.name}</small>}
        </label>
        <label className="field">
          <span>Manager</span>
          <select name="managerId" value={form.managerId} onChange={updateField}>
            <option value="">No manager</option>
            {employees.map((person) => (
              <option key={person.id} value={person.id}>
                {fullName(person)}
              </option>
            ))}
          </select>
        </label>
        <label className="field field-wide">
          <span>Description</span>
          <input
            name="description"
            value={form.description}
            onChange={updateField}
            placeholder="What this department owns"
          />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : initial ? 'Update department' : 'Create department'}
        </button>
      </div>
    </form>
  );
}
