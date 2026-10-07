import { useState } from 'react';
import { fullName } from '../utils/format';

const LEAVE_TYPES = ['ANNUAL', 'SICK', 'UNPAID'];

export default function LeaveForm({ employees = [], defaultEmployeeId = '', onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    employeeId: defaultEmployeeId,
    type: 'ANNUAL',
    startDate: '',
    endDate: '',
    reason: '',
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
    if (!form.type) nextErrors.type = 'Leave type is required';
    if (!form.startDate) nextErrors.startDate = 'Start date is required';
    if (!form.endDate) nextErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = 'End date cannot be before start date';
    }
    if (!form.reason.trim()) nextErrors.reason = 'Reason is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      employeeId: form.employeeId,
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason.trim(),
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field field-wide">
          <span>Employee</span>
          <select name="employeeId" value={form.employeeId} onChange={updateField} disabled={Boolean(defaultEmployeeId)}>
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
          <span>Leave type</span>
          <select name="type" value={form.type} onChange={updateField}>
            {LEAVE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type[0] + type.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Start date</span>
          <input name="startDate" type="date" value={form.startDate} onChange={updateField} />
          {errors.startDate && <small>{errors.startDate}</small>}
        </label>
        <label className="field">
          <span>End date</span>
          <input name="endDate" type="date" value={form.endDate} onChange={updateField} />
          {errors.endDate && <small>{errors.endDate}</small>}
        </label>
        <label className="field field-wide">
          <span>Reason</span>
          <input
            name="reason"
            value={form.reason}
            onChange={updateField}
            placeholder="Family trip, recovery, personal time…"
          />
          {errors.reason && <small>{errors.reason}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Submitting…' : 'Submit leave'}
        </button>
      </div>
    </form>
  );
}
