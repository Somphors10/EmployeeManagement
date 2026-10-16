import { useEffect, useMemo, useState } from 'react';
import { rbacApi } from '../api/rbac';
import { useToast } from '../components/Toast';
import { prettyEnum } from '../utils/format';

const ROLE_ORDER = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

function formatRole(role) {
  if (role === 'HR' || role === 'ADMIN') return role;
  return prettyEnum(role);
}

function prettyPermission(value) {
  if (!value) return '—';
  const [resource, action] = String(value).split(':');
  return `${prettyEnum(resource)} · ${prettyEnum(action)}`;
}

export default function Roles() {
  const { showToast } = useToast();
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rbacApi
      .matrix()
      .then((response) => {
        setPermissions(response.payload?.permissions || []);
        setRoles(response.payload?.roles || []);
      })
      .catch((err) => showToast(err.message, 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const byRole = useMemo(
    () => Object.fromEntries(roles.map((item) => [item.role, new Set(item.permissions || [])])),
    [roles],
  );
  const columns = ROLE_ORDER.filter((role) => byRole[role]);

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Roles</h2>
          <p className="page-copy">
            Role-based access control. Assign a role on the Users page; permissions below are granted automatically.
          </p>
        </div>
      </header>

      <div className="stat-grid">
        <article className="stat-card">
          <p>Roles</p>
          <strong>{columns.length}</strong>
        </article>
        <article className="stat-card">
          <p>Permissions</p>
          <strong>{permissions.length}</strong>
        </article>
      </div>

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading RBAC matrix…</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Permission</th>
                {columns.map((role) => (
                  <th key={role}>{formatRole(role)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissions.map((permission) => (
                <tr key={permission}>
                  <td data-label="Permission">
                    <strong>{prettyPermission(permission)}</strong>
                    <div className="muted">{permission}</div>
                  </td>
                  {columns.map((role) => (
                    <td key={role} data-label={role}>
                      {byRole[role]?.has(permission) ? 'Yes' : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
