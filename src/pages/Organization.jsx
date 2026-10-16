import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import { organizationApi } from '../api/organization';
import { useConfirm } from '../components/ConfirmDialog';
import Avatar from '../components/Avatar';
import DepartmentForm from '../components/DepartmentForm';
import Modal from '../components/Modal';
import { IconBuilding, IconPlus } from '../components/Icons';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../components/Toast';
import { fullName, peopleMap } from '../utils/format';

export default function Organization() {
  const { showToast } = useToast();
  const { can } = useAuth();
  const { ask, dialog } = useConfirm();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const canWrite = can('organization:write');
  const deptApi = organizationApi;

  const peopleById = useMemo(() => peopleMap(employees), [employees]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [deptRes, peopleRes] = await Promise.all([
        organizationApi.getAll().catch(async () => {
          const names = await employeeApi.getDepartments();
          return {
            payload: (names.payload || []).map((name) => ({ name })),
          };
        }),
        employeeApi.getAll(),
      ]);
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
      if (editing?.id) await deptApi.update(editing.id, payload);
      else await deptApi.create(payload);
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
    setBusy(true);
    try {
      await deptApi.remove(id);
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
          <h2>Departments</h2>
          <p className="page-copy">
            {canWrite
              ? 'Create, update, and delete departments, then assign a manager.'
              : 'Company departments and their managers.'}
          </p>
        </div>
        {canWrite && (
          <button className="button-primary" onClick={() => setEditing({})}>
            <IconPlus /> Create department
          </button>
        )}
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <div className="stat-card-top">
            <p>Departments</p>
            <span className="stat-icon">
              <IconBuilding />
            </span>
          </div>
          <strong>{departments.length}</strong>
        </article>
        <article className="stat-card">
          <p>With managers</p>
          <strong>{departments.filter((dept) => dept.managerId).length}</strong>
        </article>
        <article className="stat-card">
          <p>People assigned</p>
          <strong>{departments.reduce((sum, dept) => sum + Number(dept.employeeCount || 0), 0)}</strong>
        </article>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading departments…</p>
        ) : departments.length === 0 ? (
          <div className="empty-state">
            <h3>No departments yet</h3>
            <p>{canWrite ? 'Create a department to get started.' : 'Ask HR or an admin to create a department.'}</p>
            {canWrite && (
              <button type="button" className="button-primary" onClick={() => setEditing({})}>
                <IconPlus /> Create department
              </button>
            )}
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Manager</th>
                <th>People</th>
                <th>Description</th>
                {canWrite && <th>Actions</th>}
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
                        <Link to={`/employees/${manager.id}`} className="name-link">
                          <Avatar firstName={manager.firstName} lastName={manager.lastName} />
                          <span>
                            <strong>{fullName(manager)}</strong>
                          </span>
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td data-label="People">{dept.employeeCount ?? 0}</td>
                    <td data-label="Description">{dept.description || '—'}</td>
                    {canWrite && (
                      <td className="table-actions" data-label="Actions">
                        {dept.id && (
                          <>
                            <button
                              type="button"
                              className="plain-link"
                              onClick={async () => {
                                try {
                                  const response = await deptApi.getById(dept.id);
                                  setEditing(response.payload || dept);
                                } catch (err) {
                                  showToast(err.message, 'error');
                                }
                              }}
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              className="link-bad"
                              disabled={busy}
                              onClick={() =>
                                ask({
                                  title: 'Delete department',
                                  message:
                                    Number(dept.employeeCount) > 0
                                      ? `“${dept.name}” still has ${dept.employeeCount} employee(s). Move them first, then delete.`
                                      : `Delete “${dept.name}”? This cannot be undone.`,
                                  confirmLabel: 'Delete',
                                  danger: true,
                                  onConfirm: () => remove(dept.id),
                                })
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Update department' : 'Create department'} onClose={() => setEditing(null)}>
          <DepartmentForm
            employees={employees}
            initial={editing.id ? editing : undefined}
            onSubmit={handleSave}
            onCancel={() => setEditing(null)}
            busy={busy}
          />
        </Modal>
      )}
      {dialog}
    </section>
  );
}
