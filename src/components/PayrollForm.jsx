import { useState } from 'react';
import { fullName } from '../utils/format';

export default function PayrollForm({ employees = [], onSubmit, onCancel, busy }) {
  const [form, setForm] = useState({
    employeeId: '',
    periodStart: '',
    periodEnd: '',
    amount: '',
    allowances: '0',
    deductions: '0',
    tax: '0',
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
    if (!form.periodStart) nextErrors.periodStart = 'Start date is required';
    if (!form.periodEnd) nextErrors.periodEnd = 'End date is required';
    if (form.periodStart && form.periodEnd && form.periodEnd < form.periodStart) {
      nextErrors.periodEnd = 'End date cannot be before start date';
    }
    if (!form.amount || Number(form.amount) <= 0) nextErrors.amount = 'Amount must be greater than 0';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      employeeId: form.employeeId,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd,
      basicSalary: Number(form.amount),
      allowances: Number(form.allowances || 0),
      deductions: Number(form.deductions || 0),
      tax: Number(form.tax || 0),
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
          <span>Period start</span>
          <input name="periodStart" type="date" value={form.periodStart} onChange={updateField} />
          {errors.periodStart && <small>{errors.periodStart}</small>}
        </label>
        <label className="field">
          <span>Period end</span>
          <input name="periodEnd" type="date" value={form.periodEnd} onChange={updateField} />
          {errors.periodEnd && <small>{errors.periodEnd}</small>}
        </label>
        <label className="field">
          <span>Basic salary</span>
          <input name="amount" type="number" min="0" step="0.01" value={form.amount} onChange={updateField} />
          {errors.amount && <small>{errors.amount}</small>}
        </label>
        <label className="field">
          <span>Allowances</span>
          <input name="allowances" type="number" min="0" step="0.01" value={form.allowances} onChange={updateField} />
        </label>
        <label className="field">
          <span>Deductions</span>
          <input name="deductions" type="number" min="0" step="0.01" value={form.deductions} onChange={updateField} />
        </label>
        <label className="field">
          <span>Tax</span>
          <input name="tax" type="number" min="0" step="0.01" value={form.tax} onChange={updateField} />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Creating…' : 'Create payroll'}
        </button>
      </div>
    </form>
  );
}
