import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { userApi } from '../api/users';
import { useConfirm } from '../components/ConfirmDialog';
import { IconPlus } from '../components/Icons';
import Modal from '../components/Modal';
import Select from '../components/Select';
import { useToast } from '../components/Toast';
import { fullName, peopleMap, prettyEnum } from '../utils/format';

const EMPTY_FORM = {
  username: '',
  password: '',
  role: 'EMPLOYEE',
  employeeId: '',
  enabled: true,
};

function formatRole(role) {
  if (!role) return '—';
  if (role === 'HR' || role === 'ADMIN') return role;
  return prettyEnum(role);
}

export default function Users() {
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const peopleById = useMemo(() => peopleMap(employees), [employees]);

  async function load() {
    setLoading(true);
    try {
      const [userRes, peopleRes] = await Promise.all([userApi.getAll(), employeeApi.getAll()]);
      setUsers(userRes.payload || []);
      setEmployees(peopleRes.payload || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load().catch((err) => showToast(err.message, 'error'));
  }, [showToast]);

  function openCreate() {
    setEditingId('');
    setForm(EMPTY_FORM);
    setOpen(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      username: item.username || '',
      password: '',
      role: item.role || 'EMPLOYEE',
      employeeId: item.employeeId || '',
      enabled: item.enabled !== false,
    });
    setOpen(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const payload = {
        username: form.username,
        password: form.password || undefined,
        role: form.role,
        employeeId: form.employeeId || null,
        enabled: form.enabled,
      };
      if (editingId) await userApi.update(editingId, payload);
      else await userApi.create(payload);
      setOpen(false);
      setForm(EMPTY_FORM);
      setEditingId('');
      showToast(editingId ? 'User updated' : 'User created');
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const enabledCount = users.filter((item) => item.enabled !== false).length;
  const visible = users.filter((item) => {
    if (filter === 'enabled') return item.enabled !== false;
    if (filter === 'disabled') return item.enabled === false;
    return true;
  });

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Users</h2>
          <p className="page-copy">Login accounts for Employee Hub.</p>
        </div>
        <button type="button" className="button-primary" onClick={openCreate}>
          <IconPlus /> New user
        </button>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Accounts</p>
          <strong>{users.length}</strong>
        </article>
        <article className="stat-card">
          <p>Enabled</p>
          <strong>{enabledCount}</strong>
        </article>
        <article className="stat-card">
          <p>Disabled</p>
          <strong>{users.length - enabledCount}</strong>
        </article>
      </div>

      <div className="tabs">
        {[
          ['all', 'All'],
          ['enabled', 'Enabled'],
          ['disabled', 'Disabled'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            className={`tab ${filter === value ? 'active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading users…</p>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <h3>{users.length === 0 ? 'No login accounts' : 'No users in this filter'}</h3>
            <p>
              {users.length === 0
                ? 'Create a user so someone can sign in.'
                : 'Try another tab or create a user.'}
            </p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>Linked employee</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const person = peopleById[item.employeeId];
                return (
                  <tr key={item.id}>
                    <td data-label="Username">
                      <span className="name-link">
                        <span className="avatar" style={{ background: '#1e40af', color: '#fff' }}>
                          {item.username.slice(0, 1).toUpperCase()}
                        </span>
                        <span>
                          <strong>{item.username}</strong>
                        </span>
                      </span>
                    </td>
                    <td data-label="Role">
                      <span className="status-badge">{formatRole(item.role)}</span>
                    </td>
                    <td data-label="Linked employee">
                      {person ? (
                        <Link to={`/employees/${person.id}`} className="plain-link">
                          {fullName(person)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${item.enabled === false ? 'inactive' : 'active'}`}>
                        {item.enabled === false ? 'Disabled' : 'Enabled'}
                      </span>
                    </td>
                    <td className="table-actions" data-label="Action">
                      <button type="button" className="plain-link" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="link-bad"
                        onClick={() =>
                          ask({
                            title: 'Delete user',
                            message: `Delete login account ${item.username}?`,
                            confirmLabel: 'Delete',
                            danger: true,
                            onConfirm: () =>
                              userApi
                                .remove(item.id)
                                .then(() => load())
                                .catch((err) => showToast(err.message, 'error')),
                          })
                        }
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Modal title={editingId ? 'Edit user' : 'New user'} onClose={() => setOpen(false)}>
          <form className="employee-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span>Username</span>
                <input
                  value={form.username}
                  onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
                  required
                  disabled={Boolean(editingId)}
                />
              </label>
              <label className="field">
                <span>{editingId ? 'New password (optional)' : 'Password'}</span>
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  required={!editingId}
                />
              </label>
              <label className="field">
                <span>Role</span>
                <Select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                >
                  {['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].map((role) => (
                    <option key={role} value={role}>
                      {formatRole(role)}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="field">
                <span>Linked employee</span>
                <Select
                  value={form.employeeId}
                  onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
                >
                  <option value="">None</option>
                  {employees.map((person) => (
                    <option key={person.id} value={person.id}>
                      {fullName(person)}
                    </option>
                  ))}
                </Select>
              </label>
              {editingId && (
                <label className="field checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.enabled}
                    onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
                  />
                  <span>Enabled</span>
                </label>
              )}
              <p className="muted field-wide">
                Access comes from the role. You cannot pick permissions one by one. Open Roles to see the full list.
              </p>
            </div>
            <div className="form-actions">
              <button type="button" className="button-ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </button>
              <button className="button-primary" type="submit" disabled={busy}>
                {busy ? 'Saving…' : editingId ? 'Save user' : 'Create user'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {dialog}
    </section>
  );
}
