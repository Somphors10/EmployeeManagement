import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { attendanceApi } from '../api/attendance';
import { employeeApi } from '../api/employees';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';
import { useToast } from '../components/Toast';
import { formatDate, formatTime, fullName, peopleMap, prettyEnum, todayISO } from '../utils/format';

export default function Attendance() {
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [date, setDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(() => peopleMap(employees), [employees]);
  const todayRecords = records.filter((row) => row.workDate === todayISO());

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [attendanceRes, peopleRes] = await Promise.all([
        attendanceApi.getAll({
          employeeId: employeeId || undefined,
          date: date || undefined,
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
  }, [employeeId, date]);

  async function punch(action) {
    if (!selectedEmployee) {
      showToast('Select an employee first', 'error');
      return;
    }
    setBusy(true);
    try {
      if (action === 'in') await attendanceApi.checkIn(selectedEmployee);
      else await attendanceApi.checkOut(selectedEmployee);
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

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Attendance</h2>
          <p className="page-copy">Check people in and out, then review the day&apos;s records.</p>
        </div>
        <button className="button-primary" onClick={() => setChecking(true)}>
          <IconPlus /> Check in / out
        </button>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Records shown</p>
          <strong>{records.length}</strong>
        </article>
        <article className="stat-card">
          <p>Today</p>
          <strong>{todayRecords.length}</strong>
        </article>
        <article className="stat-card">
          <p>Still in</p>
          <strong>{todayRecords.filter((row) => row.checkIn && !row.checkOut).length}</strong>
        </article>
        <article className="stat-card">
          <p>Late</p>
          <strong>{records.filter((row) => row.status === 'LATE').length}</strong>
        </article>
      </div>

      <div className="filter-bar">
        <select value={employeeId} onChange={(event) => setEmployeeId(event.target.value)}>
          <option value="">All employees</option>
          {employees.map((person) => (
            <option key={person.id} value={person.id}>
              {fullName(person)}
            </option>
          ))}
        </select>
        <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <button type="button" className="button-ghost" onClick={() => setDate('')}>
          All dates
        </button>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading attendance…</p>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <h3>No attendance records</h3>
            <p>Change the filter or check someone in.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check in</th>
                <th>Check out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row) => {
                const person = peopleById[row.employeeId];
                return (
                  <tr key={row.id}>
                    <td data-label="Employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="plain-link">
                          {fullName(person)}
                        </Link>
                      ) : (
                        row.employeeId
                      )}
                    </td>
                    <td data-label="Date">{formatDate(row.workDate)}</td>
                    <td data-label="Check in">{formatTime(row.checkIn)}</td>
                    <td data-label="Check out">{formatTime(row.checkOut)}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${String(row.status || '').toLowerCase().replaceAll('_', '-')}`}>
                        {prettyEnum(row.status)}
                      </span>
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
              <label className="field field-wide">
                <span>Employee</span>
                <select value={selectedEmployee} onChange={(event) => setSelectedEmployee(event.target.value)}>
                  <option value="">Select an employee</option>
                  {employees.map((person) => (
                    <option key={person.id} value={person.id}>
                      {fullName(person)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={() => setChecking(false)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className="button-ghost" onClick={() => punch('out')} disabled={busy}>
                Check out
              </button>
              <button type="button" className="button-primary" onClick={() => punch('in')} disabled={busy}>
                Check in
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
