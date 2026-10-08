import { useEffect, useMemo, useState } from 'react';
import { employeeApi } from '../api/employees';
import { overtimeApi } from '../api/overtime';
import { useAuth } from '../auth/AuthContext';
import { useConfirm } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { formatDate, fullName, peopleMap, prettyEnum } from '../utils/format';

export default function Overtime() {
  const { can, user } = useAuth();
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    employeeId: user?.employeeId || '',
    workDate: '',
    hours: '2',
    reason: '',
  });
  const [busy, setBusy] = useState(false);
  const peopleById = useMemo(() => peopleMap(employees), [employees]);

  async function load() {
    const [overtimeRes, peopleRes] = await Promise.all([overtimeApi.getAll(), employeeApi.getAll()]);
    setItems(overtimeRes.payload || []);
    setEmployees(peopleRes.payload || []);
  }

  useEffect(() => {
    load().catch((err) => showToast(err.message, 'error'));
  }, [showToast]);

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await overtimeApi.create({
        ...form,
        hours: Number(form.hours),
        employeeId: form.employeeId || user?.employeeId,
      });
      showToast('Overtime submitted');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Overtime</h2>
          <p className="page-copy">Submit extra hours and approve team overtime.</p>
        </div>
      </header>
      {can('overtime:write') && (
        <form className="employee-form" onSubmit={handleCreate}>
          <div className="form-grid">
            {(can('employees:write') || !user?.employeeId) && (
              <label className="field">
                <span>Employee</span>
                <select
                  value={form.employeeId}
                  onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
                  required
                >
                  <option value="">Select an employee</option>
                  {employees.map((person) => (
                    <option key={person.id} value={person.id}>
                      {fullName(person)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field">
              <span>Date</span>
              <input
                type="date"
                value={form.workDate}
                onChange={(event) => setForm((current) => ({ ...current, workDate: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>Hours</span>
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={form.hours}
                onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))}
                required
              />
            </label>
            <label className="field field-wide">
              <span>Reason</span>
              <input
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button-primary" type="submit" disabled={busy}>
              Submit overtime
            </button>
          </div>
        </form>
      )}
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Hours</th>
              <th>Reason</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const person = peopleById[item.employeeId];
              return (
                <tr key={item.id}>
                  <td>{person ? fullName(person) : item.employeeId}</td>
                  <td>{formatDate(item.workDate)}</td>
                  <td>{item.hours}</td>
                  <td>{item.reason}</td>
                  <td>
                    <span className={`status-badge ${String(item.status || '').toLowerCase()}`}>
                      {prettyEnum(item.status)}
                    </span>
                  </td>
                  <td className="table-actions">
                    {item.status === 'PENDING' && can('overtime:decide') && (
                      <>
                        <button
                          type="button"
                          className="link-ok"
                          disabled={busy}
                          onClick={() =>
                            ask({
                              title: 'Approve overtime',
                              message: `Approve overtime${person ? ` for ${fullName(person)}` : ''}?`,
                              confirmLabel: 'Approve',
                              onConfirm: () =>
                                overtimeApi
                                  .approve(item.id)
                                  .then(() => load())
                                  .catch((err) => showToast(err.message, 'error')),
                            })
                          }
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="link-bad"
                          disabled={busy}
                          onClick={() =>
                            ask({
                              title: 'Reject overtime',
                              message: `Reject overtime${person ? ` for ${fullName(person)}` : ''}?`,
                              confirmLabel: 'Reject',
                              danger: true,
                              onConfirm: () =>
                                overtimeApi
                                  .reject(item.id)
                                  .then(() => load())
                                  .catch((err) => showToast(err.message, 'error')),
                            })
                          }
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {dialog}
    </section>
  );
}
