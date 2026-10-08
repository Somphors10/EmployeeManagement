import { useEffect, useState } from 'react';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  position: '',
  department: '',
  hireDate: '',
  nationalId: '',
  dateOfBirth: '',
  address: '',
  salary: '',
};

const DEPARTMENTS = [
  'Information technology',
  'Human Resources',
  'Finance',
  'Marketing',
  'Operations',
  'Sales',
];

function toInputDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

const POSITIONS = ['Software Engineer', 'Product Designer', 'QA Engineer', 'Department Manager'];

export default function EmployeeForm({
  initialValues,
  departments = DEPARTMENTS,
  positions = POSITIONS,
  submitLabel,
  onSubmit,
  onCancel,
  busy,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const departmentOptions = departments.length > 0 ? departments : DEPARTMENTS;
  const positionOptions = positions.length > 0 ? positions : POSITIONS;

  useEffect(() => {
    setForm({
      ...EMPTY_FORM,
      ...(initialValues || {}),
      hireDate: toInputDate(initialValues?.hireDate),
      dateOfBirth: toInputDate(initialValues?.dateOfBirth),
      salary: initialValues?.salary ?? '',
    });
    setErrors({});
  }, [initialValues]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function validate() {
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = 'First name is required';
    if (!form.lastName.trim()) nextErrors.lastName = 'Last name is required';
    if (!form.email.trim()) nextErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Email must be valid';
    if (!form.phoneNumber.trim()) nextErrors.phoneNumber = 'Phone number is required';
    if (!form.position.trim()) nextErrors.position = 'Position is required';
    if (!form.department.trim()) nextErrors.department = 'Department is required';
    if (!form.hireDate) nextErrors.hireDate = 'Hire date is required';
    else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (new Date(form.hireDate) > today) {
        nextErrors.hireDate = 'Hire date cannot be in the future';
      }
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      position: form.position.trim(),
      department: form.department.trim(),
      hireDate: form.hireDate,
      nationalId: form.nationalId.trim() || null,
      dateOfBirth: form.dateOfBirth || null,
      address: form.address.trim() || null,
      salary: form.salary === '' ? null : Number(form.salary),
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>First name</span>
          <input name="firstName" value={form.firstName} onChange={updateField} placeholder="Srorn" />
          {errors.firstName && <small>{errors.firstName}</small>}
        </label>
        <label className="field">
          <span>Last name</span>
          <input name="lastName" value={form.lastName} onChange={updateField} placeholder="Chansomphors" />
          {errors.lastName && <small>{errors.lastName}</small>}
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" value={form.email} onChange={updateField} placeholder="name@company.com" />
          {errors.email && <small>{errors.email}</small>}
        </label>
        <label className="field">
          <span>Phone number</span>
          <input name="phoneNumber" value={form.phoneNumber} onChange={updateField} placeholder="085123456" />
          {errors.phoneNumber && <small>{errors.phoneNumber}</small>}
        </label>
        <label className="field">
          <span>Position</span>
          <input
            name="position"
            list="position-options"
            value={form.position}
            onChange={updateField}
            placeholder="Software Engineer"
          />
          <datalist id="position-options">
            {positionOptions.map((position) => (
              <option key={position} value={position} />
            ))}
          </datalist>
          {errors.position && <small>{errors.position}</small>}
        </label>
        <label className="field">
          <span>Department</span>
          <input
            name="department"
            list="department-options"
            value={form.department}
            onChange={updateField}
            placeholder="Information technology"
          />
          <datalist id="department-options">
            {departmentOptions.map((department) => (
              <option key={department} value={department} />
            ))}
          </datalist>
          {errors.department && <small>{errors.department}</small>}
        </label>
        <label className="field">
          <span>Hire date</span>
          <input name="hireDate" type="date" value={form.hireDate} onChange={updateField} />
          {errors.hireDate && <small>{errors.hireDate}</small>}
        </label>
        <label className="field">
          <span>National ID</span>
          <input name="nationalId" value={form.nationalId} onChange={updateField} />
        </label>
        <label className="field">
          <span>Date of birth</span>
          <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={updateField} />
        </label>
        <label className="field">
          <span>Salary</span>
          <input name="salary" type="number" min="0" step="0.01" value={form.salary} onChange={updateField} />
        </label>
        <label className="field field-wide">
          <span>Address</span>
          <input name="address" value={form.address} onChange={updateField} />
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
