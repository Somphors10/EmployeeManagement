import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { organizationApi } from '../api/organization';
import DepartmentForm from '../components/DepartmentForm';
import Modal from '../components/Modal';
import { IconPlus } from '../components/Icons';
import { useToast } from '../components/Toast';
import { fullName, peopleMap } from '../utils/format';

export default function Organization() {
  const { showToast } = useToast();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);

  const peopleById = useMemo(() => peopleMap(employees), [employees]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [deptRes, peopleRes] = await Promise.all([organizationApi.getAll(), employeeApi.getAll()]);
      setDepartments(deptRes.payload || []);
      setEmployees(peopleRes.payload || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(payload) {
    setBusy(true);
    try {
      if (editing?.id) await organizationApi.update(editing.id, payload);
      else await organizationApi.create(payload);
      showToast(editing?.id ? 'Department updated' : 'Department created');
      setEditing(null);
      await load();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this department?')) return;
    setBusy(true);
    try {
      await organizationApi.remove(id);
      showToast('Department deleted');
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
          <h2>Organization</h2>
          <p className="page-copy">Manage departments and assign a manager to each one.</p>
        </div>
        <button className="button-primary" onClick={() => setEditing({})}>
          <IconPlus /> New department
        </button>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Departments</p>
          <strong>{departments.length}</strong>
        </article>
        <article className="stat-card">
          <p>With managers</p>
          <strong>{departments.filter((dept) => dept.managerId).length}</strong>
        </article>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading departments…</p>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <h3>No departments yet</h3>
            <p>Create a department and optionally assign a manager.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Manager</th>
                <th>Description</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => {
                const manager = peopleById[dept.managerId];
                return (
                  <tr key={dept.id}>
                    <td data-label="Department">{dept.name}</td>
                    <td data-label="Manager">
                      {manager ? (
                        <Link to={`/employees/${manager.id}`} className="plain-link">
                          {fullName(manager)}
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="Description">{dept.description || '—'}</td>
                    <td className="table-actions" data-label="Action">
                      <button type="button" className="plain-link" onClick={() => setEditing(dept)}>
                        Edit
                      </button>
                      <button type="button" className="link-bad" onClick={() => remove(dept.id)} disabled={busy}>
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

      {editing && (
        <Modal title={editing.id ? 'Edit department' : 'New department'} onClose={() => setEditing(null)}>
          <DepartmentForm
            employees={employees}
            initial={editing.id ? editing : undefined}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        </Modal>
      )}
    </section>
  );
}
