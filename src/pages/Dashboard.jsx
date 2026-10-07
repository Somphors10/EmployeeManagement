import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { announcementApi } from '../api/announcements';
import { dashboardApi } from '../api/dashboard';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import Avatar from '../components/Avatar';
import { IconClock, IconFile, IconPay, IconStar } from '../components/Icons';
import { formatDateTime, fullName, prettyEnum } from '../utils/format';

export default function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [totals, setTotals] = useState(null);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [people, dashboard, leaves, news] = await Promise.all([
          employeeApi.getAll(),
          dashboardApi.getTotals(),
          leaveApi.getAll({ status: 'PENDING' }),
          announcementApi.getAll(),
        ]);
        if (!cancelled) {
          setEmployees(people.payload || []);
          setTotals(dashboard.payload);
          setPendingLeaves(leaves.payload || []);
          setAnnouncements((news.payload || []).filter((item) => item.published));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const peopleById = Object.fromEntries(employees.map((person) => [person.id, person]));

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-copy">Live totals from the workspace: people, leave, attendance, and payroll.</p>
        </div>
        <Link to="/employees" className="button-primary">
          View employees
        </Link>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="stat-grid">
        <article className="stat-card">
          <p>Employees</p>
          <strong>{loading ? '—' : totals?.totalEmployees ?? 0}</strong>
        </article>
        <article className="stat-card">
          <p>Active</p>
          <strong>{loading ? '—' : totals?.activeEmployees ?? 0}</strong>
        </article>
        <article className="stat-card">
          <p>Pending leave</p>
          <strong>{loading ? '—' : totals?.pendingLeaves ?? 0}</strong>
        </article>
        <article className="stat-card">
          <p>Today attendance</p>
          <strong>{loading ? '—' : totals?.todayAttendance ?? 0}</strong>
        </article>
        <article className="stat-card">
          <p>Pending payroll</p>
          <strong>{loading ? '—' : totals?.pendingPayrolls ?? 0}</strong>
        </article>
      </div>

      <div className="dashboard-split">
        <article className="panel">
          <div className="panel-header">
            <h3>People</h3>
            <Link to="/employees">See all</Link>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="muted">No employees yet.</p>
          ) : (
            <ul className="simple-list">
              {employees.slice(0, 6).map((employee) => (
                <li key={employee.id}>
                  <Link to={`/employees/${employee.id}`} className="simple-row">
                    <Avatar firstName={employee.firstName} lastName={employee.lastName} />
                    <span>
                      <strong>{fullName(employee)}</strong>
                      <em>{employee.position}</em>
                    </span>
                    <span className={`status-badge ${employee.status === 'INACTIVE' ? 'inactive' : 'active'}`}>
                      {prettyEnum(employee.status)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <div className="panel-header">
            <h3>Needs review</h3>
            <Link to="/leaves">Open leaves</Link>
          </div>
          {loading ? (
            <p className="muted">Loading…</p>
          ) : pendingLeaves.length === 0 ? (
            <p className="muted">No pending leave requests.</p>
          ) : (
            <ul className="simple-list">
              {pendingLeaves.slice(0, 6).map((leave) => (
                <li key={leave.id} className="simple-row">
                  <span>
                    <strong>{fullName(peopleById[leave.employeeId])}</strong>
                    <em>
                      {prettyEnum(leave.type)} · {leave.startDate} – {leave.endDate}
                    </em>
                  </span>
                  <span className="status-badge pending">Pending</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="shortcut-grid">
        <Link to="/attendance" className="panel shortcut">
          <IconClock />
          <span>Attendance</span>
        </Link>
        <Link to="/payroll" className="panel shortcut">
          <IconPay />
          <span>Payroll</span>
        </Link>
        <Link to="/documents" className="panel shortcut">
          <IconFile />
          <span>Documents</span>
        </Link>
        <Link to="/performance" className="panel shortcut">
          <IconStar />
          <span>Performance</span>
        </Link>
      </div>

      <article className="panel">
        <div className="panel-header">
          <h3>Announcements</h3>
          <Link to="/announcements">See all</Link>
        </div>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : announcements.length === 0 ? (
          <p className="muted">No published announcements yet.</p>
        ) : (
          <ul className="simple-list">
            {announcements.slice(0, 4).map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <em className="table-sub">{formatDateTime(item.createdAt)}</em>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
