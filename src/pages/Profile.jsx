import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { employeeApi } from '../api/employees';
import { notificationApi } from '../api/notifications';
import { rbacApi } from '../api/rbac';
import { employeePath } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';
import { useToast } from '../components/Toast';
import { formatDate, formatDateTime, formatMoney, fullName, prettyEnum } from '../utils/format';

function formatRole(role) {
  if (!role) return '—';
  if (role === 'HR' || role === 'ADMIN') return role;
  return prettyEnum(role);
}

export default function Profile() {
  const { user, can } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);
  const [employee, setEmployee] = useState(null);
  const [manager, setManager] = useState(null);
  const [rbac, setRbac] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoadError('');
      try {
        const [rbacRes, noticeList] = await Promise.all([
          rbacApi.me().catch(() => null),
          notificationApi.getAll().catch(() => []),
        ]);
        if (cancelled) return;
        setRbac(rbacRes?.payload || null);
        setNotes(Array.isArray(noticeList) ? noticeList.slice(0, 6) : []);

        if (!user?.employeeId) {
          setEmployee(null);
          setManager(null);
          return;
        }

        const personRes = await employeeApi.getById(user.employeeId);
        if (cancelled) return;
        const person = personRes?.payload || null;
        setEmployee(person);

        if (person?.managerId) {
          try {
            const managerRes = await employeeApi.getById(person.managerId);
            if (!cancelled) setManager(managerRes?.payload || null);
          } catch {
            if (!cancelled) setManager(null);
          }
        } else if (!cancelled) {
          setManager(null);
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message);
          setEmployee(null);
          setManager(null);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.employeeId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await authApi.changePassword(form.currentPassword, form.newPassword);
      showToast('Password changed');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const role = rbac?.role || user?.role;
  const recordPath = employeePath(user, user?.employeeId);
  const managerPath = employeePath(user, manager?.id);
  const firstName = employee?.firstName || user?.username || 'U';
  const lastName = employee?.lastName || '';

  return (
    <section className="page profile-page">
      <header className="page-header profile-page-header">
        <div className="profile-head">
          <Avatar firstName={firstName} lastName={lastName} size="lg" />
          <div>
            <h2>{employee ? fullName(employee) : user?.username}</h2>
            <p className="page-copy">
              {employee
                ? `${employee.position || '—'} · ${employee.department || '—'}`
                : formatRole(role)}
            </p>
            <div className="profile-chips">
              <span className="profile-chip">{formatRole(role)}</span>
              {employee?.status && (
                <span className={`status-badge ${employee.status === 'INACTIVE' ? 'inactive' : 'active'}`}>
                  {prettyEnum(employee.status)}
                </span>
              )}
            </div>
          </div>
        </div>
        {recordPath && (
          <Link to={recordPath} className="button-ghost">
            Open employee record
          </Link>
        )}
      </header>

      {loadError && <div className="banner banner-error">{loadError}</div>}

      <div className="dashboard-split">
        <article className="panel">
          <div className="panel-header">
            <h3>Account</h3>
          </div>
          <dl className="info-list profile-info">
            <div>
              <dt>Username</dt>
              <dd>{user?.username || '—'}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{formatRole(role)}</dd>
            </div>
            <div>
              <dt>Employee ID</dt>
              <dd>{user?.employeeId || 'Not linked'}</dd>
            </div>
            <div>
              <dt>Account</dt>
              <dd>{user?.enabled === false ? 'Disabled' : 'Enabled'}</dd>
            </div>
          </dl>
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Work details</h3>
          </div>
          {user?.employeeId && !employee && !loadError ? (
            <p className="muted">Loading employee record…</p>
          ) : employee ? (
            <dl className="info-list profile-info">
              <div>
                <dt>Email</dt>
                <dd>{employee.email || '—'}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{employee.phoneNumber || '—'}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{employee.department || '—'}</dd>
              </div>
              <div>
                <dt>Position</dt>
                <dd>{employee.position || '—'}</dd>
              </div>
              <div>
                <dt>Hire date</dt>
                <dd>{formatDate(employee.hireDate)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{prettyEnum(employee.status)}</dd>
              </div>
              <div>
                <dt>Manager</dt>
                <dd>
                  {manager ? (
                    managerPath ? (
                      <Link to={managerPath} className="plain-link">
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
          ) : (
            <p className="muted">This login is not linked to an employee record.</p>
          )}
        </article>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Notifications</h3>
          <Link to="/notifications">See all</Link>
        </div>
        {notes.length === 0 ? (
          <p className="muted">No notifications yet.</p>
        ) : (
          <ul className="simple-list">
            {notes.map((note) => (
              <li key={note.id} className={note.read ? '' : 'is-unread-row'}>
                <span>
                  <strong>{note.title}</strong>
                  <em className="table-sub">{note.message}</em>
                </span>
                <em>{formatDateTime(note.createdAt)}</em>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel">
        <div className="panel-header">
          <h3>Password</h3>
        </div>
        <form className="employee-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label className="field">
              <span>Current password</span>
              <input
                type="password"
                value={form.currentPassword}
                onChange={(event) => setForm((current) => ({ ...current, currentPassword: event.target.value }))}
                required
              />
            </label>
            <label className="field">
              <span>New password</span>
              <input
                type="password"
                minLength={6}
                value={form.newPassword}
                onChange={(event) => setForm((current) => ({ ...current, newPassword: event.target.value }))}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="button-primary" type="submit" disabled={busy}>
              Change password
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
