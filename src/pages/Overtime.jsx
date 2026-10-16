import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { overtimeApi } from '../api/overtime';
import { canDecideFor } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';
import { useConfirm } from '../components/ConfirmDialog';
import { IconCheck, IconClock, IconOvertime, IconPlus } from '../components/Icons';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { useToast } from '../components/Toast';
import { formatDate, fullName, peopleMap, prettyEnum } from '../utils/format';

const EMPTY_FORM = {
  employeeId: '',
  workDate: '',
  hours: '2',
  reason: '',
};

export default function Overtime() {
  const { can, user } = useAuth();
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ ...EMPTY_FORM, employeeId: user?.employeeId || '' });
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const peopleById = useMemo(() => peopleMap(employees), [employees]);
  const pendingCount = items.filter((item) => item.status === 'PENDING').length;
  const approvedCount = items.filter((item) => item.status === 'APPROVED').length;
  const rejectedCount = items.filter((item) => item.status === 'REJECTED').length;
  const visible = status ? items.filter((item) => item.status === status) : items;
  const canPickEmployee = can('employees:write') || !user?.employeeId;

  async function load() {
    setLoading(true);
    try {
      const [overtimeRes, peopleRes] = await Promise.all([
        overtimeApi.getAll(employeeId || undefined),
        employeeApi.getAll(),
      ]);
      setItems(overtimeRes.payload || []);
      setEmployees(peopleRes.payload || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => showToast(err.message, 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToast, employeeId]);

  function openCreate() {
    setForm({ ...EMPTY_FORM, employeeId: user?.employeeId || '' });
    setCreating(true);
  }

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
      setCreating(false);
      setForm({ ...EMPTY_FORM, employeeId: user?.employeeId || '' });
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
        {can('overtime:write') && (
          <button type="button" className="button-primary" onClick={openCreate}>
            <IconPlus /> New overtime
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Records</p>
            <span className="stat-icon">
              <IconOvertime />
            </span>
          </div>
          <strong>{items.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Pending</p>
            <span className="stat-icon">
              <IconClock />
            </span>
          </div>
          <strong>{pendingCount}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Approved</p>
            <span className="stat-icon">
              <IconCheck />
            </span>
          </div>
          <strong>{approvedCount}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Rejected</p>
            <span className="stat-icon">
              <IconOvertime />
            </span>
          </div>
          <strong>{rejectedCount}</strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['PENDING', 'Pending'],
          ['APPROVED', 'Approved'],
          ['REJECTED', 'Rejected'],
          ['', 'All'],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            className={`tab ${status === value ? 'active' : ''}`}
            onClick={() => setStatus(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="table-card">
        {can('employees:directory') && (
          <div className="table-toolbar">
            <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              <option value="">All employees</option>
              {employees.map((person) => (
                <option key={person.id} value={person.id}>
                  {fullName(person)}
                </option>
              ))}
            </Select>
          </div>
        )}
        {loading ? (
          <p className="muted padded">Loading overtime…</p>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <h3>No overtime records</h3>
            <p>Submit extra hours or change the filter.</p>
          </div>
        ) : (
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
              {visible.map((item) => {
                const person = peopleById[item.employeeId];
                return (
                  <tr key={item.id}>
                    <td data-label="Employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="name-link">
                          <Avatar firstName={person.firstName} lastName={person.lastName} />
                          <span>
                            <strong>{fullName(person)}</strong>
                            <em>{person.position || person.department || 'Employee'}</em>
                          </span>
                        </Link>
                      ) : (
                        item.employeeId
                      )}
                    </td>
                    <td className="date-cell" data-label="Date">
                      {formatDate(item.workDate)}
                    </td>
                    <td data-label="Hours">{item.hours}</td>
                    <td className="reason-cell" data-label="Reason">
                      {item.reason}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${String(item.status || '').toLowerCase()}`}>
                        {prettyEnum(item.status)}
                      </span>
                    </td>
                    <td className="table-actions" data-label="Action">
                      {item.status === 'PENDING' &&
                        can('overtime:decide') &&
                        canDecideFor(user, item.employeeId, peopleById) && (
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
        )}
      </div>

      {creating && (
        <Modal title="New overtime" onClose={() => setCreating(false)}>
          <form className="employee-form" onSubmit={handleCreate}>
            <div className="form-grid">
              {canPickEmployee && (
                <label className="field">
                  <span>Employee</span>
                  <Select
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
                  </Select>
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
              <button type="button" className="button-ghost" onClick={() => setCreating(false)} disabled={busy}>
                Cancel
              </button>
              <button className="button-primary" type="submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit overtime'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog}
    </section>
  );
}
