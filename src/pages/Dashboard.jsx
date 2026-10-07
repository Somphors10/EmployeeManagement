import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { announcementApi } from '../api/announcements';
import { dashboardApi } from '../api/dashboard';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';
import {
  IconClock,
  IconFile,
  IconLeave,
  IconMegaphone,
  IconPay,
  IconPeople,
  IconStar,
} from '../components/Icons';
import { formatDate, formatDateTime, fullName, prettyEnum, todayLabel } from '../utils/format';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { can, user } = useAuth();
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
  const stats = [
    {
      label: 'Employees',
      value: totals?.totalEmployees ?? 0,
      hint: 'In the directory',
      icon: IconPeople,
      to: '/employees',
    },
    {
      label: 'Active',
      value: totals?.activeEmployees ?? 0,
      hint: 'Currently employed',
      icon: IconPeople,
      to: '/employees',
    },
    {
      label: 'Pending leave',
      value: totals?.pendingLeaves ?? 0,
      hint: 'Waiting for a decision',
      icon: IconLeave,
      to: '/leaves',
    },
    {
      label: 'Today attendance',
      value: totals?.todayAttendance ?? 0,
      hint: 'Checked in today',
      icon: IconClock,
      to: '/attendance',
    },
  ];

  if (can('payroll:view')) {
    stats.push({
      label: 'Pending payroll',
      value: totals?.pendingPayrolls ?? 0,
      hint: 'Still to mark paid',
      icon: IconPay,
      to: '/payroll',
    });
  }

  return (
    <section className="page dashboard-page">
      <header className="dash-hero">
        <div>
          <p className="dash-kicker">{todayLabel()}</p>
          <h2>
            {greeting()}, {user?.username}
          </h2>
          <p>Live totals for people, leave, attendance, and payroll.</p>
        </div>
        <Link to="/employees" className="button-primary">
          View employees
        </Link>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.to} className="stat-card dash-stat">
              <div className="stat-card-top">
                <p>{stat.label}</p>
                <span className="stat-icon">
                  <Icon />
                </span>
              </div>
              <strong>{loading ? '—' : stat.value}</strong>
              <em>{stat.hint}</em>
            </Link>
          );
        })}
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
            <ul className="simple-list dash-list">
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
            <ul className="simple-list dash-list">
              {pendingLeaves.slice(0, 6).map((leave) => (
                <li key={leave.id}>
                  <Link to="/leaves" className="simple-row">
                    <Avatar
                      firstName={peopleById[leave.employeeId]?.firstName}
                      lastName={peopleById[leave.employeeId]?.lastName}
                    />
                    <span>
                      <strong>{fullName(peopleById[leave.employeeId])}</strong>
                      <em>
                        {prettyEnum(leave.type)} · {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                      </em>
                    </span>
                    <span className="status-badge pending">Pending</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>

      <div className="shortcut-grid">
        <Link to="/attendance" className="shortcut">
          <span className="stat-icon">
            <IconClock />
          </span>
          <span>
            <strong>Attendance</strong>
            <em>Check in and review the day</em>
          </span>
        </Link>
        {can('payroll:view') && (
          <Link to="/payroll" className="shortcut">
            <span className="stat-icon">
              <IconPay />
            </span>
            <span>
              <strong>Payroll</strong>
              <em>Create records and mark paid</em>
            </span>
          </Link>
        )}
        <Link to="/documents" className="shortcut">
          <span className="stat-icon">
            <IconFile />
          </span>
          <span>
            <strong>Documents</strong>
            <em>Store contracts and files</em>
          </span>
        </Link>
        <Link to="/performance" className="shortcut">
          <span className="stat-icon">
            <IconStar />
          </span>
          <span>
            <strong>Performance</strong>
            <em>Ratings and review notes</em>
          </span>
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
          <ul className="simple-list dash-news">
            {announcements.slice(0, 4).map((item) => (
              <li key={item.id}>
                <span className="stat-icon">
                  <IconMegaphone />
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <em className="table-sub">{formatDateTime(item.createdAt)}</em>
                </span>
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
