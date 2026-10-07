import { useState } from 'react';

export default function TransferForm({
  employee,
  departments = [],
  positions = [],
  onSubmit,
  onCancel,
  busy,
}) {
  const [department, setDepartment] = useState(employee?.department || '');
  const [position, setPosition] = useState(employee?.position || '');
  const [errors, setErrors] = useState({});

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!department.trim()) nextErrors.department = 'Department is required';
    if (!position.trim()) nextErrors.position = 'Position is required';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSubmit({
      department: department.trim(),
      position: position.trim(),
    });
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <p className="confirm-copy">
        Move {employee?.firstName} {employee?.lastName} to a new team or role.
      </p>
      <div className="form-grid" style={{ marginTop: 16 }}>
        <label className="field">
          <span>Department</span>
          <input
            list="transfer-departments"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            placeholder="Information technology"
          />
          <datalist id="transfer-departments">
            {departments.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {errors.department && <small>{errors.department}</small>}
        </label>
        <label className="field">
          <span>Position</span>
          <input
            list="transfer-positions"
            value={position}
            onChange={(event) => setPosition(event.target.value)}
            placeholder="Software Engineer"
          />
          <datalist id="transfer-positions">
            {positions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {errors.position && <small>{errors.position}</small>}
        </label>
      </div>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Transferring…' : 'Transfer employee'}
        </button>
      </div>
    </form>
  );
}
