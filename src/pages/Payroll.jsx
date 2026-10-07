import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { payrollApi } from '../api/payroll';
import Modal from '../components/Modal';
import PayrollForm from '../components/PayrollForm';
import { IconPlus } from '../components/Icons';
import { useToast } from '../components/Toast';
import { formatDate, formatMoney, fullName, peopleMap, prettyEnum } from '../utils/format';

export default function Payroll() {
  const { showToast } = useToast();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(() => peopleMap(employees), [employees]);
  const pendingAmount = records
    .filter((row) => row.status === 'PENDING')
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [payrollRes, peopleRes] = await Promise.all([
        payrollApi.getAll({
          employeeId: employeeId || undefined,
          status: status || undefined,
        }),
        employeeApi.getAll(),
      ]);
      setRecords(payrollRes.payload || []);
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
  }, [employeeId, status]);

  async function handleCreate(payload) {
    setBusy(true);
    try {
      await payrollApi.create(payload);
      showToast('Payroll record created');
      setCreating(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function markPaid(id) {
    setBusy(true);
    try {
      await payrollApi.markPaid(id);
      showToast('Marked as paid');
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
          <h2>Payroll</h2>
          <p className="page-copy">Create pay records and mark them paid when processed.</p>
        </div>
        <button className="button-primary" onClick={() => setCreating(true)}>
          <IconPlus /> New payroll
        </button>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Records</p>
          <strong>{records.length}</strong>
        </article>
        <article className="stat-card">
          <p>Pending</p>
          <strong>{records.filter((row) => row.status === 'PENDING').length}</strong>
        </article>
        <article className="stat-card">
          <p>Paid</p>
          <strong>{records.filter((row) => row.status === 'PAID').length}</strong>
        </article>
        <article className="stat-card">
          <p>Pending amount</p>
          <strong>{formatMoney(pendingAmount)}</strong>
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
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PAID">Paid</option>
        </select>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading payroll…</p>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <h3>No payroll records</h3>
            <p>Change the filter or create a new record.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Period</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
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
                    <td data-label="Period">
                      {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                    </td>
                    <td data-label="Amount">{formatMoney(row.amount)}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${String(row.status || '').toLowerCase()}`}>
                        {prettyEnum(row.status)}
                      </span>
                    </td>
                    <td className="table-actions" data-label="Action">
                      {row.status === 'PENDING' && (
                        <button type="button" className="link-ok" onClick={() => markPaid(row.id)} disabled={busy}>
                          Mark paid
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

      {creating && (
        <Modal title="Create payroll" onClose={() => setCreating(false)}>
          <PayrollForm employees={employees} onSubmit={handleCreate} onCancel={() => setCreating(false)} busy={busy} />
        </Modal>
      )}
    </section>
  );
}
