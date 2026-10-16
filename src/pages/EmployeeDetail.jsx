import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { documentApi } from '../api/documents';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import Avatar from '../components/Avatar';
import DocumentForm from '../components/DocumentForm';
import EmployeeForm from '../components/EmployeeForm';
import LeaveForm from '../components/LeaveForm';
import ManagerForm from '../components/ManagerForm';
import { useConfirm } from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { employeePath } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import TransferForm from '../components/TransferForm';
import { formatDate, formatDateTime, formatFileSize, formatMoney, fullName, prettyEnum } from '../utils/format';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { can, user } = useAuth();
  const { ask, dialog } = useConfirm();
  const [tab, setTab] = useState('overview');
  const [employee, setEmployee] = useState(null);
  const [people, setPeople] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [subordinates, setSubordinates] = useState([]);
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState('');
  const [busy, setBusy] = useState(false);
  const [fileBusy, setFileBusy] = useState('');
  const [editingDoc, setEditingDoc] = useState(null);

  const peopleById = useMemo(
    () => Object.fromEntries(people.map((person) => [person.id, person])),
    [people],
  );

  async function loadEmployee() {
    setLoading(true);
    setError('');
    try {
      const requests = [
        employeeApi.getById(id),
        employeeApi.getAll(),
        employeeApi.getDepartments(),
        employeeApi.getPositions(),
        employeeApi.getSubordinates(id),
        employeeApi.getHistory(id),
        leaveApi.getAll({ employeeId: id }),
      ];
      if (can('documents:view')) requests.push(documentApi.getAll(id));
      const [person, allPeople, depts, roles, reports, events, timeOff, files] =
        await Promise.all(requests);
      setEmployee(person.payload);
      setPeople(allPeople.payload || []);
      setDepartments([...(depts.payload || [])].sort((a, b) => String(a).localeCompare(String(b))));
      setPositions(roles.payload || []);
      setSubordinates(reports.payload || []);
      setHistory(events.payload || []);
      setLeaves(timeOff.payload || []);
      setDocuments(files?.payload || []);
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
        <Link to={can('employees:directory') ? '/employees' : '/'} className="plain-link">
          {can('employees:directory') ? 'Back to employees' : 'Back to dashboard'}
        </Link>
      </section>
    );
  }

  const inactive = employee.status === 'INACTIVE';
  const manager = peopleById[employee.managerId];
  const pendingLeaveCount = leaves.filter((leave) => leave.status === 'PENDING').length;

  return (
    <section className="page profile-page">
      <Link to={can('employees:directory') ? '/employees' : '/'} className="back-link">
        {can('employees:directory') ? '← Employees' : '← Dashboard'}
      </Link>

      <header className="page-header profile-page-header">
        <div className="profile-head">
          <Avatar firstName={employee.firstName} lastName={employee.lastName} size="lg" />
          <div>
            <h2>{fullName(employee)}</h2>
            <p className="page-copy">
              {employee.position} · {employee.department}
            </p>
            <div className="profile-chips">
              <span className={`status-badge ${inactive ? 'inactive' : 'active'}`}>
                {prettyEnum(employee.status)}
              </span>
              <span className="profile-chip">Hired {formatDate(employee.hireDate)}</span>
            </div>
          </div>
        </div>
        {can('employees:write') && (
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
                ask({
                  title: inactive ? 'Activate employee' : 'Deactivate employee',
                  message: inactive
                    ? `Activate ${fullName(employee)}?`
                    : `Deactivate ${fullName(employee)}? They will be marked inactive.`,
                  confirmLabel: inactive ? 'Activate' : 'Deactivate',
                  danger: !inactive,
                  onConfirm: () =>
                    run(
                      async () => {
                        const next = inactive ? 'ACTIVE' : 'INACTIVE';
                        const response = await employeeApi.updateStatus(id, next);
                        setEmployee(response.payload);
                      },
                      inactive ? 'Employee activated' : 'Employee deactivated',
                    ),
                })
              }
            >
              {inactive ? 'Activate' : 'Deactivate'}
            </button>
            <button type="button" className="button-danger" onClick={() => setModal('delete')}>
              Delete
            </button>
          </div>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Direct reports</p>
          <strong>{subordinates.length}</strong>
        </article>
        <article className="stat-card">
          <p>Pending leave</p>
          <strong>{pendingLeaveCount}</strong>
        </article>
        {can('documents:view') && (
          <article className="stat-card">
            <p>Documents</p>
            <strong>{documents.length}</strong>
          </article>
        )}
        <article className="stat-card">
          <p>History</p>
          <strong>{history.length}</strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['overview', 'Overview'],
          ['team', 'Team'],
          ['leave', 'Leave'],
          can('documents:view') ? ['files', 'Documents'] : null,
          ['history', 'History'],
        ]
          .filter(Boolean)
          .map(([value, label]) => (
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
        <div className="table-card">
          <dl className="info-list profile-info">
            <div>
              <dt>Email</dt>
              <dd>{employee.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{employee.phoneNumber || '—'}</dd>
            </div>
            <div>
              <dt>Hire date</dt>
              <dd>{formatDate(employee.hireDate, { year: 'numeric', month: 'long', day: 'numeric' })}</dd>
            </div>
            <div>
              <dt>Manager</dt>
              <dd>
                {manager ? (
                  employeePath(user, manager.id) ? (
                    <Link to={employeePath(user, manager.id)} className="plain-link">
                      {fullName(manager)}
                    </Link>
                  ) : (
                    fullName(manager)
                  )
                ) : (
                  'Not assigned'
                )}
              </dd>
            </div>
            <div>
              <dt>Date of birth</dt>
              <dd>{employee.dateOfBirth ? formatDate(employee.dateOfBirth) : '—'}</dd>
            </div>
            <div>
              <dt>National ID</dt>
              <dd>{employee.nationalId || '—'}</dd>
            </div>
            <div>
              <dt>Address</dt>
              <dd>{employee.address || '—'}</dd>
            </div>
            {can('payroll:view') && (
              <div>
                <dt>Salary</dt>
                <dd>{employee.salary != null ? formatMoney(employee.salary) : '—'}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {tab === 'team' && (
        <article className="panel">
          <div className="split-block">
            <div>
              <div className="panel-header">
                <h3>Manager</h3>
                <div className="header-actions">
                  {can('employees:write') && (
                    <button type="button" className="plain-link" onClick={() => setModal('manager')}>
                      Change
                    </button>
                  )}
                  {can('employees:write') && employee.managerId && (
                    <button
                      type="button"
                      className="link-bad"
                      disabled={busy}
                      onClick={() =>
                        ask({
                          title: 'Remove manager',
                          message: `Clear the manager for ${fullName(employee)}?`,
                          confirmLabel: 'Remove',
                          danger: true,
                          onConfirm: () =>
                            run(async () => {
                              const response = await employeeApi.clearManager(id);
                              setEmployee(response.payload);
                            }, 'Manager cleared'),
                        })
                      }
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
              {manager ? (
                employeePath(user, manager.id) ? (
                  <Link to={employeePath(user, manager.id)} className="simple-row">
                    <Avatar firstName={manager.firstName} lastName={manager.lastName} />
                    <span>
                      <strong>{fullName(manager)}</strong>
                      <em>{manager.position}</em>
                    </span>
                  </Link>
                ) : (
                  <div className="simple-row">
                    <Avatar firstName={manager.firstName} lastName={manager.lastName} />
                    <span>
                      <strong>{fullName(manager)}</strong>
                      <em>{manager.position}</em>
                    </span>
                  </div>
                )
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
                      {employeePath(user, person.id) ? (
                        <Link to={employeePath(user, person.id)} className="simple-row">
                          <Avatar firstName={person.firstName} lastName={person.lastName} />
                          <span>
                            <strong>{fullName(person)}</strong>
                            <em>{person.position}</em>
                          </span>
                        </Link>
                      ) : (
                        <div className="simple-row">
                          <Avatar firstName={person.firstName} lastName={person.lastName} />
                          <span>
                            <strong>{fullName(person)}</strong>
                            <em>{person.position}</em>
                          </span>
                        </div>
                      )}
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
            {can('leaves:create') && (
              <button type="button" className="button-ghost" onClick={() => setModal('leave')}>
                Request leave
              </button>
            )}
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

      {tab === 'files' && (
        <article className="panel">
          <div className="panel-header">
            <h3>Documents</h3>
            {can('documents:write') && (
              <button type="button" className="button-ghost" onClick={() => setModal('document')}>
                Upload file
              </button>
            )}
          </div>
          {documents.length === 0 ? (
            <p className="muted">No files uploaded for this employee.</p>
          ) : (
            <table className="data-table compact">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td data-label="Title">
                      <Link to={`/documents/${doc.id}`} className="plain-link">
                        {doc.title}
                      </Link>
                    </td>
                    <td data-label="Type">{prettyEnum(doc.documentType)}</td>
                    <td data-label="File">
                      {doc.hasFile
                        ? `${doc.originalFileName || 'File'} · ${formatFileSize(doc.fileSize)}`
                        : 'No file'}
                    </td>
                    <td data-label="Uploaded">{formatDateTime(doc.uploadedAt)}</td>
                    <td className="table-actions" data-label="Action">
                      {doc.hasFile && (
                        <>
                          <Link to={`/documents/${doc.id}`} className="plain-link">
                            Open
                          </Link>
                          <button
                            type="button"
                            className="plain-link"
                            disabled={fileBusy === `download-${doc.id}`}
                            onClick={async () => {
                              setFileBusy(`download-${doc.id}`);
                              try {
                                await documentApi.downloadFile(doc.id);
                              } catch (err) {
                                showToast(err.message, 'error');
                              } finally {
                                setFileBusy('');
                              }
                            }}
                          >
                            {fileBusy === `download-${doc.id}` ? 'Saving…' : 'Download'}
                          </button>
                        </>
                      )}
                      {can('documents:write') && (
                        <button type="button" className="plain-link" onClick={() => setEditingDoc(doc)}>
                          Edit
                        </button>
                      )}
                      {can('documents:write') && (
                        <button
                          type="button"
                          className="link-bad"
                          disabled={busy}
                          onClick={() =>
                            ask({
                              title: 'Delete document',
                              message: `Delete “${doc.title}”? This cannot be undone.`,
                              confirmLabel: 'Delete',
                              danger: true,
                              onConfirm: () =>
                                run(async () => {
                                  await documentApi.remove(doc.id);
                                }, 'Document deleted'),
                            })
                          }
                        >
                          Delete
                        </button>
                      )}
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

      {modal === 'document' && (
        <Modal title="Upload document" onClose={() => setModal('')}>
          <DocumentForm
            employees={people}
            defaultEmployeeId={employee.id}
            lockEmployee
            onSubmit={(payload) =>
              run(async () => {
                await documentApi.create({ ...payload, employeeId: employee.id });
                setModal('');
              }, 'Document uploaded')
            }
            onCancel={() => setModal('')}
            busy={busy}
          />
        </Modal>
      )}

      {editingDoc && (
        <Modal title="Edit document" onClose={() => setEditingDoc(null)}>
          <DocumentForm
            initial={editingDoc}
            onSubmit={(payload) =>
              run(async () => {
                await documentApi.update(editingDoc.id, payload);
                setEditingDoc(null);
              }, 'Document updated')
            }
            onCancel={() => setEditingDoc(null)}
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

      {dialog}

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
                  navigate(can('employees:directory') ? '/employees' : '/');
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
