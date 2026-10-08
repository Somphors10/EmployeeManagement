import { useEffect, useState } from 'react';
import { employeeApi } from '../api/employees';
import { userApi } from '../api/users';
import { useConfirm } from '../components/ConfirmDialog';
import { useToast } from '../components/Toast';
import { fullName, prettyEnum } from '../utils/format';

export default function Users() {
  const { showToast } = useToast();
  const { ask, dialog } = useConfirm();
  const [users, setUsers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'EMPLOYEE',
    employeeId: '',
    enabled: true,
  });
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [userRes, peopleRes] = await Promise.all([userApi.getAll(), employeeApi.getAll()]);
    setUsers(userRes.payload || []);
    setEmployees(peopleRes.payload || []);
  }

  useEffect(() => {
    load().catch((err) => showToast(err.message, 'error'));
  }, [showToast]);

  async function handleCreate(event) {
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
      setForm({ username: '', password: '', role: 'EMPLOYEE', employeeId: '', enabled: true });
      setEditingId('');
      showToast(editingId ? 'User updated' : 'User created');
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
          <h2>Users</h2>
          <p className="page-copy">Login accounts for Employee Hub.</p>
        </div>
      </header>
      <form className="employee-form" onSubmit={handleCreate}>
        <div className="form-grid">
          <label className="field">
            <span>Username</span>
            <input
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              required
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
            <select
              value={form.role}
              onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
            >
              {['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'].map((role) => (
                <option key={role} value={role}>
                  {prettyEnum(role)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Linked employee</span>
            <select
              value={form.employeeId}
              onChange={(event) => setForm((current) => ({ ...current, employeeId: event.target.value }))}
            >
              <option value="">None</option>
              {employees.map((person) => (
                <option key={person.id} value={person.id}>
                  {fullName(person)}
                </option>
              ))}
            </select>
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
        </div>
        <div className="form-actions">
          <button className="button-primary" type="submit" disabled={busy}>
            {editingId ? 'Save user' : 'Create user'}
          </button>
        </div>
      </form>
      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Enabled</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id}>
                <td>{item.username}</td>
                <td>{prettyEnum(item.role)}</td>
                <td>{item.enabled ? 'Yes' : 'No'}</td>
                <td className="table-actions">
                  <button
                    type="button"
                    className="plain-link"
                    onClick={() => {
                      setEditingId(item.id);
                      setForm({
                        username: item.username || '',
                        password: '',
                        role: item.role || 'EMPLOYEE',
                        employeeId: item.employeeId || '',
                        enabled: item.enabled !== false,
                      });
                    }}
                  >
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
            ))}
          </tbody>
        </table>
      </div>
      {dialog}
    </section>
  );
}
