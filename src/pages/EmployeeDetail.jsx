import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import Avatar from '../components/Avatar';
import EmployeeForm from '../components/EmployeeForm';
import LeaveForm from '../components/LeaveForm';
import ManagerForm from '../components/ManagerForm';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import TransferForm from '../components/TransferForm';
import { formatDate, formatDateTime, fullName, prettyEnum } from '../utils/format';

const TABS = [
  ['overview', 'Overview'],
  ['team', 'Team'],
  ['leave', 'Leave'],
  ['history', 'History'],
];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [tab, setTab] = useState('overview');
  const [employee, setEmployee] = useState(null);
  const [people, setPeople] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(
    () => Object.fromEntries(people.map((person) => [person.id, person])),
    [people],
  );

  async function loadEmployee() {
    setLoading(true);
    setError('');
    try {
      const [person, allPeople, depts, roles, reports, events, timeOff] = await Promise.all([
        employeeApi.getById(id),
        employeeApi.getAll(),
        employeeApi.getDepartments(),
        employeeApi.getPositions(),
        employeeApi.getSubordinates(id),
        employeeApi.getHistory(id),
        leaveApi.getAll({ employeeId: id }),
      ]);
      setEmployee(person.payload);
      setPeople(allPeople.payload || []);
      setDepartments(depts.payload || []);
      setPositions(roles.payload || []);
      setSubordinates(reports.payload || []);
      setHistory(events.payload || []);
      setLeaves(timeOff.payload || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setTab('overview');
    loadEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function run(action, successMessage) {
    setBusy(true);
    try {
      await action();
      if (successMessage) showToast(successMessage);
      await loadEmployee();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="page">
        <p className="muted">Loading profile…</p>
      </section>
    );
  }

  if (error || !employee) {
    return (
      <section className="page">
        <div className="banner banner-error">{error || 'Employee not found'}</div>
        <Link to="/employees" className="plain-link">
          Back to employees
        </Link>
      </section>
    );
  }

  const inactive = employee.status === 'INACTIVE';
  const manager = peopleById[employee.managerId];

  return (
    <section className="page">
      <Link to="/employees" className="back-link">
        ← Employees
      </Link>

      <header className="profile-head">
        <Avatar firstName={employee.firstName} lastName={employee.lastName} size="lg" />
        <div className="profile-head-copy">
          <h2>{fullName(employee)}</h2>
          <p>
            {employee.position} · {employee.department}
          </p>
          <span className={`status-badge ${inactive ? 'inactive' : 'active'}`}>
            {prettyEnum(employee.status)}
          </span>
        </div>
        <div className="header-actions">
          <button type="button" className="button-ghost" onClick={() => setModal('edit')}>
            Edit
          </button>
          <button type="button" className="button-ghost" onClick={() => setModal('transfer')}>
            Transfer
          </button>
          <button
            type="button"
            className="button-ghost"
            disabled={busy}
            onClick={() =>
              run(
                async () => {
                  const next = inactive ? 'ACTIVE' : 'INACTIVE';
                  const response = await employeeApi.updateStatus(id, next);
                  setEmployee(response.payload);
                },
                inactive ? 'Employee activated' : 'Employee deactivated',
              )
            }
          >
            {inactive ? 'Activate' : 'Deactivate'}
          </button>
          <button type="button" className="button-danger" onClick={() => setModal('delete')}>
            Delete
          </button>
        </div>
      </header>

      <div className="tabs">
        {TABS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${tab === value ? 'active' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <article className="panel">
          <dl className="info-list">
            <div>
              <dt>Email</dt>
              <dd>{employee.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{employee.phoneNumber}</dd>
            </div>
            <div>
              <dt>Hire date</dt>
              <dd>{formatDate(employee.hireDate, { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
            </div>
            <div>
              <dt>Manager</dt>
              <dd>
                {manager ? (
                  <Link to={`/employees/${manager.id}`} className="plain-link">
                    {fullName(manager)}
                  </Link>
                ) : (
                  'Not assigned'
                )}
              </dd>
            </div>
          </dl>
        </article>
      )}

      {tab === 'team' && (
        <article className="panel">
          <div className="split-block">
            <div>
              <div className="panel-header">
                <h3>Manager</h3>
                <div className="header-actions">
                  <button type="button" className="plain-link" onClick={() => setModal('manager')}>
                    Change
                  </button>
                  {employee.managerId && (
                    <button
                      type="button"
                      className="link-bad"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const response = await employeeApi.clearManager(id);
                          setEmployee(response.payload);
                        }, 'Manager cleared')
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {manager ? (
                <Link to={`/employees/${manager.id}`} className="simple-row">
                  <Avatar firstName={manager.firstName} lastName={manager.lastName} />
                  <span>
                    <strong>{fullName(manager)}</strong>
                    <em>{manager.position}</em>
                  </span>
                </Link>
              ) : (
                <p className="muted">No manager assigned.</p>
              )}
            </div>
            <div>
              <div className="panel-header">
                <h3>Reports</h3>
              </div>
              {subordinates.length === 0 ? (
                <p className="muted">No one reports to this person.</p>
              ) : (
                <ul className="simple-list">
                  {subordinates.map((person) => (
                    <li key={person.id}>
                      <Link to={`/employees/${person.id}`} className="simple-row">
                        <Avatar firstName={person.firstName} lastName={person.lastName} />
                        <span>
                          <strong>{fullName(person)}</strong>
                          <em>{person.position}</em>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </article>
      )}

      {tab === 'leave' && (
        <article className="panel">
          <div className="panel-header">
            <h3>Leave requests</h3>
            <button type="button" className="button-ghost" onClick={() => setModal('leave')}>
              Request leave
            </button>
          </div>
          {leaves.length === 0 ? (
            <p className="muted">No leave requests yet.</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td data-label="Type">{prettyEnum(leave.type)}</td>
                    <td data-label="Dates">
                      {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                    </td>
                    <td data-label="Reason">{leave.reason}</td>
                    <td data-label="Status">
                      <span className={`status-badge ${leave.status.toLowerCase()}`}>
                        {prettyEnum(leave.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      )}

      {tab === 'history' && (
        <article className="panel">
          {history.length === 0 ? (
            <p className="muted">No activity yet.</p>
          ) : (
            <ol className="timeline">
              {history.map((event) => (
                <li key={event.id}>
                  <strong>{prettyEnum(event.eventType)}</strong>
                  <p>{event.description}</p>
                  <em>{formatDateTime(event.occurredAt)}</em>
                </li>
              ))}
            </ol>
          )}
        </article>
      )}

      {modal === 'edit' && (
        <Modal title="Edit employee" onClose={() => setModal('')}>
          <EmployeeForm
            initialValues={employee}
            departments={departments}
            positions={positions}
            submitLabel="Save changes"
            onSubmit={(payload) =>
              run(async () => {
                const response = await employeeApi.update(id, payload);
                setEmployee(response.payload);
                setModal('');
              }, 'Employee updated')
            }
            onCancel={() => setModal('')}
            busy={busy}
          />
        </Modal>
      )}

      {modal === 'transfer' && (
        <Modal title="Transfer employee" onClose={() => setModal('')}>
          <TransferForm
            employee={employee}
            departments={departments}
            positions={positions}
            onSubmit={(payload) =>
              run(async () => {
                const response = await employeeApi.transfer(id, payload);
                setEmployee(response.payload);
                setModal('');
              }, 'Employee transferred')
            }
            onCancel={() => setModal('')}
            busy={busy}
          />
        </Modal>
      )}

      {modal === 'manager' && (
        <Modal title="Assign manager" onClose={() => setModal('')}>
          <ManagerForm
            employee={employee}
            people={people}
            onSubmit={(managerId) =>
              run(async () => {
                const response = await employeeApi.assignManager(id, managerId);
                setEmployee(response.payload);
                setModal('');
              }, 'Manager assigned')
            }
            onCancel={() => setModal('')}
            busy={busy}
          />
        </Modal>
      )}

      {modal === 'leave' && (
        <Modal title="Request leave" onClose={() => setModal('')}>
          <LeaveForm
            employees={people}
            defaultEmployeeId={employee.id}
            onSubmit={(payload) =>
              run(async () => {
                await leaveApi.create(payload);
                setModal('');
              }, 'Leave request submitted')
            }
            onCancel={() => setModal('')}
            busy={busy}
          />
        </Modal>
      )}

      {modal === 'delete' && (
        <Modal title="Delete employee" onClose={() => setModal('')}>
          <p className="confirm-copy">Delete {fullName(employee)}? This cannot be undone.</p>
          <div className="form-actions">
            <button type="button" className="button-ghost" onClick={() => setModal('')} disabled={busy}>
              Cancel
            </button>
            <button
              type="button"
              className="button-danger"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await employeeApi.remove(id);
                  showToast('Employee deleted');
                  navigate('/employees');
                } catch (err) {
                  showToast(err.message, 'error');
                  setBusy(false);
                }
              }}
            >
              {busy ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
