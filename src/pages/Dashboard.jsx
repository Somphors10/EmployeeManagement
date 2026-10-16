import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { announcementApi } from '../api/announcements';
import { dashboardApi } from '../api/dashboard';
import { documentApi } from '../api/documents';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import { Permission } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../components/Avatar';
import {
  IconClock,
  IconFile,
  IconLeave,
  IconMegaphone,
  IconPay,
  IconPeople,
} from '../components/Icons';
import { formatDate, formatDateTime, formatFileSize, fullName, prettyEnum, todayLabel } from '../utils/format';

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
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const canViewDocuments = can('documents:view');
  const canSeeDirectory = can(Permission.EMPLOYEES_DIRECTORY);
  const canViewPayroll = can('payroll:view');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const requests = [
          employeeApi.getAll(),
          dashboardApi.getTotals(),
          leaveApi.getAll({ status: 'PENDING' }),
          announcementApi.getAll(),
        ];
        if (canViewDocuments) requests.push(documentApi.getAll());
        const [people, dashboard, leaves, news, files] = await Promise.all(requests);
        if (!cancelled) {
          setEmployees(people.payload || []);
          setTotals(dashboard.payload);
          setPendingLeaves(leaves.payload || []);
          setAnnouncements((news.payload || []).filter((item) => item.published));
          setDocuments(files?.payload || []);
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
  }, [canViewDocuments]);

  const peopleById = Object.fromEntries(employees.map((person) => [person.id, person]));
  const stats = [];

  if (canSeeDirectory) {
    stats.push(
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
    );
  }

  stats.push({
    label: 'Pending leave',
    value: totals?.pendingLeaves ?? pendingLeaves.length,
    hint: canSeeDirectory ? 'Waiting for a decision' : 'Your open requests',
    icon: IconLeave,
    to: '/leaves',
  });

  stats.push({
    label: 'Today attendance',
    value: totals?.todayAttendance ?? 0,
    hint: 'Checked in today',
    icon: IconClock,
    to: '/attendance',
  });

  if (canViewPayroll) {
    stats.push({
      label: 'Pending payroll',
      value: totals?.pendingPayrolls ?? 0,
      hint: 'Still to mark paid',
      icon: IconPay,
      to: '/payroll',
    });
  }

  if (canViewDocuments) {
    stats.push({
      label: 'Documents',
      value: documents.length,
      hint: 'Uploaded employee files',
      icon: IconFile,
      to: '/documents',
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
          <p>
            {canSeeDirectory
              ? 'Live totals for people, leave, attendance, and payroll.'
              : 'Your leave, attendance, and payroll at a glance.'}
          </p>
        </div>
        {canSeeDirectory ? (
          <Link to="/employees" className="button-primary">
            View employees
          </Link>
        ) : (
          <Link to="/leaves" className="button-primary">
            Request leave
          </Link>
        )}
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.to} className="stat-card">
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
            <h3>{canSeeDirectory ? 'People' : 'My profile'}</h3>
            {canSeeDirectory ? <Link to="/employees">See all</Link> : null}
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

      <div className="dashboard-split">
        {canViewDocuments && (
          <article className="panel">
            <div className="panel-header">
              <h3>Recent documents</h3>
              <Link to="/documents">See all</Link>
            </div>
            {loading ? (
              <p className="muted">Loading…</p>
            ) : documents.length === 0 ? (
              <p className="muted">No files uploaded yet.</p>
            ) : (
              <ul className="simple-list dash-list">
                {documents.slice(0, 5).map((doc) => {
                  const owner = peopleById[doc.employeeId];
                  return (
                    <li key={doc.id}>
                      <Link to={`/documents/${doc.id}`} className="simple-row">
                        {owner ? (
                          <Avatar firstName={owner.firstName} lastName={owner.lastName} />
                        ) : (
                          <span className="dash-mark">
                            <IconFile />
                          </span>
                        )}
                        <span>
                          <strong>{doc.title}</strong>
                          <em>
                            {owner ? fullName(owner) : 'Employee'} · {prettyEnum(doc.documentType)}
                            {doc.hasFile ? ` · ${formatFileSize(doc.fileSize)}` : ''}
                          </em>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        )}

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
            <ul className="simple-list dash-list">
              {announcements.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <Link to="/announcements" className="simple-row">
                    <span className="dash-mark">
                      <IconMegaphone />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <em>{formatDateTime(item.createdAt)}</em>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
