import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import { useConfirm } from '../components/ConfirmDialog';
import LeaveForm from '../components/LeaveForm';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { formatDate, fullName, prettyEnum } from '../utils/format';

export default function Leaves() {
  const { showToast } = useToast();
  const { can, user } = useAuth();
  const { ask, dialog } = useConfirm();
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(
    () => Object.fromEntries(employees.map((person) => [person.id, person])),
    [employees],
  );

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [leaveRes, peopleRes] = await Promise.all([
        leaveApi.getAll({ status: status || undefined }),
        employeeApi.getAll(),
      ]);
      setLeaves(leaveRes.payload || []);
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
  }, [status]);

  async function handleCreate(payload) {
    setBusy(true);
    try {
      await leaveApi.create(payload);
      showToast('Leave request submitted');
      setCreating(false);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function decide(id, action) {
    setBusy(true);
    try {
      if (action === 'approve') await leaveApi.approve(id);
      else await leaveApi.reject(id);
      showToast(action === 'approve' ? 'Leave approved' : 'Leave rejected');
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
          <h2>Leaves</h2>
          <p className="page-copy">Review time-off requests. Pending items need a decision.</p>
        </div>
        {can('leaves:create') && (
          <button type="button" className="button-primary" onClick={() => setCreating(true)}>
            <IconPlus />
            New request
          </button>
        )}
      </header>

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

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading leave requests…</p>
        ) : leaves.length === 0 ? (
          <div className="empty-state">
            <h3>No requests here</h3>
            <p>Change the tab or submit a new leave request.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave) => {
                const person = peopleById[leave.employeeId];
                return (
                  <tr key={leave.id}>
                    <td data-label="Employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="plain-link">
                          {fullName(person)}
                        </Link>
                      ) : (
                        'Unknown'
                      )}
                    </td>
                    <td data-label="Type">{prettyEnum(leave.type)}</td>
                    <td data-label="Dates">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td className="reason-cell" data-label="Reason">
                      {leave.reason}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {prettyEnum(leave.status)}
                      </span>
                    </td>
                    <td className="table-actions" data-label="Action">
                      {leave.status === 'PENDING' && can('leaves:decide') && (
                        <>
                          <button
                            type="button"
                            className="link-ok"
                            disabled={busy}
                            onClick={() =>
                              ask({
                                title: 'Approve leave',
                                message: `Approve this leave request${person ? ` for ${fullName(person)}` : ''}?`,
                                confirmLabel: 'Approve',
                                onConfirm: () => decide(leave.id, 'approve'),
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
                                title: 'Reject leave',
                                message: `Reject this leave request${person ? ` for ${fullName(person)}` : ''}?`,
                                confirmLabel: 'Reject',
                                danger: true,
                                onConfirm: () => decide(leave.id, 'reject'),
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
        <Modal title="New leave request" onClose={() => setCreating(false)}>
          <LeaveForm
            employees={employees}
            defaultEmployeeId={user?.employeeId || ''}
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            busy={busy}
          />
        </Modal>
      )}
      {dialog}
    </section>
  );
}
