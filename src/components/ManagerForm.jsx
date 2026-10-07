import { useState } from 'react';
import { fullName } from '../utils/format';

export default function ManagerForm({ employee, people = [], onSubmit, onCancel, busy }) {
  const [managerId, setManagerId] = useState(employee?.managerId || '');
  const [error, setError] = useState('');

  const options = people.filter((person) => person.id !== employee?.id);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!managerId) {
      setError('Manager is required');
      return;
    }
    await onSubmit(managerId);
  }

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <p className="confirm-copy">Assign who {employee?.firstName} reports to.</p>
      <label className="field" style={{ marginTop: 16 }}>
        <span>Manager</span>
        <select value={managerId} onChange={(event) => setManagerId(event.target.value)}>
          <option value="">Select a manager</option>
          {options.map((person) => (
            <option key={person.id} value={person.id}>
              {fullName(person)} · {person.position}
            </option>
          ))}
        </select>
        {error && <small>{error}</small>}
      </label>
      <div className="form-actions">
        <button type="button" className="button-ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="button-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Assign manager'}
        </button>
      </div>
    </form>
  );
}
