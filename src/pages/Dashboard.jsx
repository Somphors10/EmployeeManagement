import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { announcementApi } from '../api/announcements';
import { dashboardApi } from '../api/dashboard';
import { documentApi } from '../api/documents';
import { employeeApi } from '../api/employees';
import { leaveApi } from '../api/leaves';
import { Permission } from '../auth/permissions';
import { useAuth } from '../auth/AuthContext';
import { DonutChart, MonthBars, StatRows, VBars, countBy, countByMonth } from '../components/DashCharts';
import { prettyEnum, todayLabel } from '../utils/format';

function ChartCard({ title, sub, to, linkLabel, loading, empty, children }) {
  return (
    <article className="dash-card">
      <div className="panel-header">
        <div>
          <h3>{title}</h3>
          <p className="dash-sub">{sub || '\u00a0'}</p>
        </div>
        {to ? <Link to={to}>{linkLabel}</Link> : <span className="dash-card-spacer" />}
      </div>
      <div className="dash-card-body">
        {loading ? <p className="muted">Loading…</p> : children ? children : <p className="muted">{empty}</p>}
      </div>
    </article>
  );
}

export default function Dashboard() {
  const { can } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [totals, setTotals] = useState(null);
  const [leaves, setLeaves] = useState([]);
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
        const requests = [employeeApi.getAll(), dashboardApi.getTotals(), leaveApi.getAll(), announcementApi.getAll()];
        if (canViewDocuments) requests.push(documentApi.getAll());
        const [people, dashboard, leaveList, news, files] = await Promise.all(requests);
        if (!cancelled) {
          setEmployees(people.payload || []);
          setTotals(dashboard.payload);
          setLeaves(leaveList.payload || []);
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

  const pendingCount = totals?.pendingLeaves ?? leaves.filter((item) => item.status === 'PENDING').length;

  const stats = [];

  if (canSeeDirectory) {
    stats.push(
      {
        label: 'Employees',
        value: totals?.totalEmployees ?? 0,
        hint: 'In the directory',
        to: '/employees',
      },
      {
        label: 'Active',
        value: totals?.activeEmployees ?? 0,
        hint: 'Currently employed',
        to: '/employees',
      },
    );
  }

  stats.push({
    label: 'Pending leave',
    value: pendingCount,
    hint: canSeeDirectory ? 'Waiting for a decision' : 'Your open requests',
    to: '/leaves',
  });

  stats.push({
    label: 'Today attendance',
    value: totals?.todayAttendance ?? 0,
    hint: 'Checked in today',
    to: '/attendance',
  });

  if (canViewPayroll && stats.length < 4) {
    stats.push({
      label: 'Pending payroll',
      value: totals?.pendingPayrolls ?? 0,
      hint: 'Still to mark paid',
      to: '/payroll',
    });
  }

  if (canViewDocuments && stats.length < 4) {
    stats.push({
      label: 'Documents',
      value: documents.length,
      hint: 'Uploaded employee files',
      to: '/documents',
    });
  }

  const departmentRows = useMemo(() => countBy(employees, (person) => person.department), [employees]);
  const leaveRows = useMemo(() => countBy(leaves, (leave) => prettyEnum(leave.status)), [leaves]);
  const documentRows = useMemo(
    () => countBy(documents, (doc) => prettyEnum(doc.documentType)),
    [documents],
  );
  const announcementRows = useMemo(() => countByMonth(announcements), [announcements]);

  return (
    <section className="page dashboard-page">
      <header className="dash-head">
        <h2>Overview</h2>
        <p>{todayLabel()}</p>
      </header>

      {error && <div className="banner banner-error">{error}</div>}

      <div className="dash-metrics">
        {stats.slice(0, 4).map((stat) => (
          <Link key={stat.label} to={stat.to} className="dash-metric">
            <p>{stat.label}</p>
            <strong>{loading ? '—' : stat.value}</strong>
            <em>{stat.hint}</em>
          </Link>
        ))}
      </div>

      <div className="dash-board">
        <ChartCard
          title="Leave status"
          sub={loading ? 'Loading…' : `${leaves.length} requests`}
          to="/leaves"
          linkLabel="See all"
          loading={loading}
          empty="No leave records yet."
        >
          {leaveRows.length > 0 ? (
            <DonutChart rows={leaveRows} label="Leave by status" unit="requests" />
          ) : (
            <p className="muted">No leave records yet.</p>
          )}
        </ChartCard>
        <ChartCard
          title="Teams"
          sub={loading ? 'Loading…' : `${departmentRows.length} departments`}
          to={canSeeDirectory ? '/employees' : null}
          linkLabel="See all"
          loading={loading}
          empty="No employees yet."
        >
          {departmentRows.length > 0 ? (
            <StatRows rows={departmentRows} label="Employees by department" />
          ) : (
            <p className="muted">No employees yet.</p>
          )}
        </ChartCard>
        <ChartCard
          title="Announcements"
          sub={loading ? 'Loading…' : `${announcements.length} published`}
          to="/announcements"
          linkLabel="See all"
          loading={loading}
          empty="No published announcements yet."
        >
          {announcementRows.some((row) => row.count > 0) ? (
            <MonthBars rows={announcementRows} label="Announcements by month" />
          ) : (
            <p className="muted">No published announcements yet.</p>
          )}
        </ChartCard>
        {canViewDocuments && (
          <ChartCard
            title="Documents"
            sub={loading ? 'Loading…' : `${documents.length} files`}
            to="/documents"
            linkLabel="See all"
            loading={loading}
            empty="No files uploaded yet."
          >
            {documentRows.length > 0 ? (
              <VBars rows={documentRows} label="Documents by type" />
            ) : (
              <p className="muted">No files uploaded yet.</p>
            )}
          </ChartCard>
        )}
      </div>
    </section>
  );
}
