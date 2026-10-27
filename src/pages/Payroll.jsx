import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { payrollApi } from '../api/payroll';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';
import { useConfirm } from '../components/ConfirmDialog';
import { IconCheck, IconClock, IconPay, IconPlus } from '../components/Icons';
import Modal from '../components/Modal';
import Select from '../components/Select';
import PayrollForm from '../components/PayrollForm';
import { useToast } from '../components/Toast';
import { formatDate, formatMoney, fullName, peopleMap, prettyEnum } from '../utils/format';

export default function Payroll() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const { ask, dialog } = useConfirm();
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(() => peopleMap(employees), [employees]);
  const pendingRecords = records.filter((row) => row.status === 'PENDING');
  const paidRecords = records.filter((row) => row.status === 'PAID');
  const pendingAmount = pendingRecords.reduce((sum, row) => sum + Number(row.netAmount || row.amount || 0), 0);

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
      const latest = await payrollApi.getById(id);
      if (latest.payload?.status === 'PAID') {
        showToast('This payroll is already paid', 'error');
        await load();
        return;
      }
      await payrollApi.markPaid(id);
      showToast('Marked as paid');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function downloadPayslip(id) {
    try {
      const { blob, fileName } = await payrollApi.payslip(id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.download = fileName || 'payslip.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Payroll</h2>
          <p className="page-copy">Create pay records and mark them paid when processed.</p>
        </div>
        {can('payroll:write') && (
          <button className="button-primary" onClick={() => setCreating(true)}>
            <IconPlus /> New payroll
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Records</p>
            <span className="stat-icon">
              <IconPay />
            </span>
          </div>
          <strong>{records.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Pending</p>
            <span className="stat-icon">
              <IconClock />
            </span>
          </div>
          <strong>{pendingRecords.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Paid</p>
            <span className="stat-icon">
              <IconCheck />
            </span>
          </div>
          <strong>{paidRecords.length}</strong>
        </article>
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Pending amount</p>
            <span className="stat-icon">
              <IconPay />
            </span>
          </div>
          <strong>{formatMoney(pendingAmount)}</strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['', 'All'],
          ['PENDING', 'Pending'],
          ['PAID', 'Paid'],
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

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
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
                <th>Net pay</th>
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
                        <Link to={`/employees/${person.id}`} className="name-link">
                          <Avatar firstName={person.firstName} lastName={person.lastName} />
                          <span>
                            <strong>{fullName(person)}</strong>
                            <em>{person.position || person.department || 'Employee'}</em>
                          </span>
                        </Link>
                      ) : (
                        row.employeeId
                      )}
                    </td>
                    <td className="date-cell" data-label="Period">
                      {formatDate(row.periodStart)} – {formatDate(row.periodEnd)}
                    </td>
                    <td className="money-cell" data-label="Net pay">
                      {formatMoney(row.netAmount || row.amount)}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${String(row.status || '').toLowerCase()}`}>
                        {prettyEnum(row.status)}
                      </span>
                    </td>
                    <td className="table-actions" data-label="Action">
                      <button type="button" className="plain-link" onClick={() => downloadPayslip(row.id)}>
                        Payslip
                      </button>
                      {row.status === 'PENDING' && can('payroll:write') && (
                        <button
                          type="button"
                          className="link-ok"
                          disabled={busy}
                          onClick={() =>
                            ask({
                              title: 'Mark payroll as paid',
                              message: `Mark this payroll${person ? ` for ${fullName(person)}` : ''} as paid?`,
                              confirmLabel: 'Mark paid',
                              onConfirm: () => markPaid(row.id),
                            })
                          }
                        >
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
      {dialog}
    </section>
  );
}
