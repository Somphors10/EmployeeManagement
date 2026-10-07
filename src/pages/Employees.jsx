import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeApi } from '../api/employees';
import Avatar from '../components/Avatar';
import EmployeeForm from '../components/EmployeeForm';
import { IconPlus, IconSearch } from '../components/Icons';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { formatDate, fullName, prettyEnum } from '../utils/format';

export default function Employees() {
  const { showToast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  async function loadLookups() {
    try {
      const [deptRes, posRes] = await Promise.all([
        employeeApi.getDepartments(),
        employeeApi.getPositions(),
      ]);
      setDepartments(deptRes.payload || []);
      setPositions(posRes.payload || []);
    } catch {
      setDepartments([]);
      setPositions([]);
    }
  }

  async function loadEmployees() {
    setLoading(true);
    setError('');
    try {
      const hasFilters = Boolean(department || search || status);
      const response = hasFilters
        ? await employeeApi.search({
            department: department || undefined,
            q: search || undefined,
            status: status || undefined,
          })
        : await employeeApi.getAll();
      setEmployees(response.payload || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [department, search, status]);

  async function handleCreate(payload) {
    setBusy(true);
    try {
      await employeeApi.create(payload);
      showToast('Employee created successfully');
      setCreating(false);
      await Promise.all([loadEmployees(), loadLookups()]);
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
          <h2>Employees</h2>
          <p className="page-copy">
            {loading ? 'Loading…' : `${employees.length} people`} · click a row to open the profile
          </p>
        </div>
        <button type="button" className="button-primary" onClick={() => setCreating(true)}>
          <IconPlus />
          Add employee
        </button>
      </header>

      <div className="filter-bar">
        <label className="search-field">
          <IconSearch />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name or email"
          />
        </label>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={department} onChange={(event) => setDepartment(event.target.value)}>
          <option value="">All departments</option>
          {departments.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="table-card">
        {loading ? (
          <p className="muted padded">Loading employees…</p>
        ) : employees.length === 0 ? (
          <div className="empty-state">
            <h3>No employees found</h3>
            <p>Try a different search, or add someone new.</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Hired</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id}>
                  <td data-label="Name">
                    <Link to={`/employees/${employee.id}`} className="name-link">
                      <Avatar firstName={employee.firstName} lastName={employee.lastName} />
                      <span>
                        <strong>{fullName(employee)}</strong>
                        <em>{employee.email}</em>
                      </span>
                    </Link>
                  </td>
                  <td data-label="Role">{employee.position}</td>
                  <td data-label="Department">{employee.department}</td>
                  <td data-label="Status">
                    <span className={`status-badge ${employee.status === 'INACTIVE' ? 'inactive' : 'active'}`}>
                      {prettyEnum(employee.status)}
                    </span>
                  </td>
                  <td data-label="Hired">{formatDate(employee.hireDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {creating && (
        <Modal title="Add employee" onClose={() => setCreating(false)}>
          <EmployeeForm
            departments={departments}
            positions={positions}
            submitLabel="Create employee"
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
            busy={busy}
          />
        </Modal>
      )}
    </section>
  );
}
