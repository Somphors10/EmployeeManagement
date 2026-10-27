import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '../api/attendance';
import { employeeApi } from '../api/employees';
import { useConfirm } from '../components/ConfirmDialog';
import Avatar from '../components/Avatar';
import Modal from '../components/Modal';
import { IconClock, IconPlus } from '../components/Icons';
import Select from '../components/Select';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDate, formatTime, fullName, peopleMap, prettyEnum, todayISO } from '../utils/format';

function monthStartISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function toTimeInput(value) {
  if (!value) return '';
  return String(value).slice(0, 5);
}

export default function Attendance() {
  const { showToast } = useToast();
  const { can, user } = useAuth();
  const { ask, dialog } = useConfirm();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [from, setFrom] = useState(monthStartISO());
  const [to, setTo] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(user?.employeeId || '');
  const [busy, setBusy] = useState(false);
  const [correcting, setCorrecting] = useState(null);
  const [correction, setCorrection] = useState({
    checkIn: '',
    checkOut: '',
    status: 'PRESENT',
    overtimeHours: '',
  });

  const peopleById = useMemo(() => peopleMap(employees), [employees]);
  const todayRecords = records.filter((row) => row.workDate === todayISO());
  const visible = statusFilter ? records.filter((row) => row.status === statusFilter) : records;
  const canPickEmployee = can('employees:directory');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [attendanceRes, peopleRes] = await Promise.all([
        attendanceApi.getAll({
          employeeId: employeeId || undefined,
          from: from || undefined,
          to: to || undefined,
        }),
        employeeApi.getAll(),
      ]);
      setRecords(attendanceRes.payload || []);
      setEmployees(peopleRes.payload || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, from, to]);

  async function punch(action) {
    const target = canPickEmployee ? selectedEmployee : user?.employeeId;
    if (!target) {
      showToast(canPickEmployee ? 'Select an employee first' : 'Your account is not linked to an employee', 'error');
      return;
    }
    setBusy(true);
    try {
      if (action === 'in') await attendanceApi.checkIn(target);
      else await attendanceApi.checkOut(target);
      showToast(action === 'in' ? 'Checked in' : 'Checked out');
      setChecking(false);
      setSelectedEmployee('');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openCorrection(row) {
    try {
      const response = await attendanceApi.getById(row.id);
      const record = response.payload || row;
      setCorrecting(record);
      setCorrection({
        checkIn: toTimeInput(record.checkIn),
        checkOut: toTimeInput(record.checkOut),
        status: record.status || 'PRESENT',
        overtimeHours: record.overtimeHours ?? '',
      });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  async function saveCorrection(event) {
    event.preventDefault();
    if (!correcting) return;
    setBusy(true);
    try {
      await attendanceApi.correct(correcting.id, {
        checkIn: correction.checkIn || null,
        checkOut: correction.checkOut || null,
        status: correction.status || null,
        overtimeHours: correction.overtimeHours === '' ? null : Number(correction.overtimeHours),
      });
      showToast('Attendance updated');
      setCorrecting(null);
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
          <h2>Attendance</h2>
          <p className="page-copy">Check people in and out, then review a date range or correct a record.</p>
        </div>
        {can('attendance:check') && (
          <button
            className="button-primary"
            onClick={() => {
              setSelectedEmployee(user?.employeeId || '');
              setChecking(true);
            }}
          >
            <IconPlus /> Check in / out
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Records shown</p>
            <span className="stat-icon">
              <IconClock />
            </span>
          </div>
          <strong>{records.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Today</p>
            <span className="stat-icon">
              <IconClock />
            </span>
          </div>
          <strong>{todayRecords.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Still in</p>
            <span className="stat-icon">
              <IconClock />
            </span>
          </div>
          <strong>{todayRecords.filter((row) => row.checkIn && !row.checkOut).length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Late</p>
            <span className="stat-icon">
              <IconClock />
            </span>
          </div>
          <strong>{records.filter((row) => row.status === 'LATE').length}</strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['', 'All'],
          ['PRESENT', 'Present'],
          ['LATE', 'Late'],
          ['ABSENT', 'Absent'],
          ['ON_LEAVE', 'On leave'],
        ].map(([value, label]) => (
          <button
            key={label}
            type="button"
            className={`tab ${statusFilter === value ? 'active' : ''}`}
            onClick={() => setStatusFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        <div className="table-toolbar">
          {canPickEmployee && (
            <Select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
              <option value="">All employees</option>
              {employees.map((person) => (
                <option key={person.id} value={person.id}>
                  {fullName(person)}
                </option>
              ))}
            </Select>
          )}
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          <button
            type="button"
            className="button-ghost"
            onClick={() => {
              setFrom(monthStartISO());
              setTo(todayISO());
            }}
          >
            This month
          </button>
          <button
            type="button"
            className="button-ghost"
            onClick={() => {
              setFrom('');
              setTo('');
            }}
          >
            All dates
          </button>
        </div>

        {loading ? (
          <p className="muted padded">Loading attendance…</p>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <h3>{records.length === 0 ? 'No attendance records' : 'No records in this filter'}</h3>
            <p>
              {records.length === 0
                ? 'Change the date range or check someone in.'
                : 'Try another tab or change the date range.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>OT hours</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const person = peopleById[row.employeeId];
                return (
                  <tr key={row.id}>
                    <td data-label="Employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="name-link">
                          <Avatar firstName={person.firstName} lastName={person.lastName} />
                          <span>
                            <strong>{fullName(person)}</strong>
                          </span>
                        </Link>
                      ) : (
                        row.employeeId
                      )}
                    </td>
                    <td className="date-cell" data-label="Date">
                      {formatDate(row.workDate)}
                    </td>
                    <td data-label="Check in">{formatTime(row.checkIn)}</td>
                    <td data-label="Check out">{formatTime(row.checkOut)}</td>
                    <td data-label="OT hours">{row.overtimeHours ?? '—'}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${String(row.status || '').toLowerCase().replaceAll('_', '-')}`}>
                        {prettyEnum(row.status)}
                      </span>
                    </td>
                    <td className="table-actions" data-label="Action">
                      {can('employees:write') && (
                        <button type="button" className="plain-link" onClick={() => openCorrection(row)}>
                          Correct
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {checking && (
        <Modal title="Check in or out" onClose={() => setChecking(false)}>
          <form className="employee-form" onSubmit={(event) => event.preventDefault()}>
            <div className="form-grid">
              {canPickEmployee ? (
                <label className="field field-wide">
                  <span>Employee</span>
                  <Select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)}>
                    <option value="">Select an employee</option>
                    {employees.map((person) => (
                      <option key={person.id} value={person.id}>
                        {fullName(person)}
                      </option>
                    ))}
                  </Select>
                </label>
              ) : (
                <p className="muted field-wide">Check in or out for your own attendance.</p>
              )}
            </div>
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={() => setChecking(false)} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className="button-ghost"
                disabled={busy}
                onClick={() => {
                  const target = canPickEmployee ? selectedEmployee : user?.employeeId;
                  if (!target) {
                    showToast(canPickEmployee ? 'Select an employee first' : 'Your account is not linked to an employee', 'error');
                    return;
                  }
                  const person = peopleById[target];
                  ask({
                    title: 'Check out',
                    message: `Check out ${person ? fullName(person) : 'this employee'}?`,
                    confirmLabel: 'Check out',
                    onConfirm: () => punch('out'),
                  });
                }}
              >
                Check out
              </button>
              <button
                type="button"
                className="button-primary"
                disabled={busy}
                onClick={() => {
                  const target = canPickEmployee ? selectedEmployee : user?.employeeId;
                  if (!target) {
                    showToast(canPickEmployee ? 'Select an employee first' : 'Your account is not linked to an employee', 'error');
                    return;
                  }
                  const person = peopleById[target];
                  ask({
                    title: 'Check in',
                    message: `Check in ${person ? fullName(person) : 'this employee'}?`,
                    confirmLabel: 'Check in',
                    onConfirm: () => punch('in'),
                  });
                }}
              >
                Check in
              </button>
            </div>
          </form>
        </Modal>
      )}

      {correcting && (
        <Modal title="Correct attendance" onClose={() => setCorrecting(null)}>
          <form className="employee-form" onSubmit={saveCorrection}>
            <div className="form-grid">
              <label className="field">
                <span>Check in</span>
                <input
                  type="time"
                  value={correction.checkIn}
                  onChange={(event) => setCorrection((current) => ({ ...current, checkIn: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Check out</span>
                <input
                  type="time"
                  value={correction.checkOut}
                  onChange={(event) => setCorrection((current) => ({ ...current, checkOut: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Status</span>
                <Select
                  value={correction.status}
                  onChange={(event) => setCorrection((current) => ({ ...current, status: event.target.value }))}
                >
                  {['PRESENT', 'LATE', 'ABSENT', 'ON_LEAVE'].map((status) => (
                    <option key={status} value={status}>
                      {prettyEnum(status)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span>Overtime hours</span>
                <input
                  type="number"
                  min="0"
                  step="0.25"
                  value={correction.overtimeHours}
                  onChange={(event) =>
                    setCorrection((current) => ({ ...current, overtimeHours: event.target.value }))
                  }
                />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={() => setCorrecting(null)} disabled={busy}>
                Cancel
              </button>
              <button type="submit" className="button-primary" disabled={busy}>
                {busy ? 'Saving…' : 'Save correction'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog}
    </section>
  );
}
