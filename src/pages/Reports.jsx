import { useEffect, useMemo, useState } from 'react';
import { reportApi } from '../api/reports';
import {
  IconChart,
  IconClock,
  IconFile,
  IconLeave,
  IconOvertime,
  IconPay,
  IconPeople,
  IconStar,
} from '../components/Icons';
import { useToast } from '../components/Toast';
import { formatDate, formatMoney, prettyEnum, todayISO } from '../utils/format';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'people', label: 'People', exportType: 'people' },
  { id: 'leaves', label: 'Leave', exportType: 'leaves' },
  { id: 'attendance', label: 'Attendance', exportType: 'attendance' },
  { id: 'payroll', label: 'Payroll', exportType: 'payrolls' },
  { id: 'overtime', label: 'Overtime', exportType: 'overtimes' },
  { id: 'performance', label: 'Performance', exportType: 'performance' },
];

function yearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

function monthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function Breakdown({ title, rows = [], money = false }) {
  const max = Math.max(1, ...rows.map((row) => Number(row.count || 0)));
  return (
    <article className="panel">
      <div className="panel-header">
        <h3>{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="muted">No data in this period.</p>
      ) : (
        <ul className="report-bars">
          {rows.map((row) => (
            <li key={row.name} className="report-bar">
              <span>{prettyEnum(row.name)}</span>
              <span className="report-bar-track">
                <span
                  className="report-bar-fill"
                  style={{ width: `${Math.round((Number(row.count || 0) / max) * 100)}%` }}
                />
              </span>
              <strong>
                {money ? formatMoney(row.amount) : row.count}
                {row.percent != null ? <em> {row.percent}%</em> : null}
              </strong>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function StatCard({ label, value, hint, Icon }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <p>{label}</p>
        {Icon ? (
          <span className="stat-icon">
            <Icon />
          </span>
        ) : null}
      </div>
      <strong>{value ?? '—'}</strong>
      {hint ? <em>{hint}</em> : null}
    </article>
  );
}

export default function Reports() {
  const { showToast } = useToast();
  const [from, setFrom] = useState(yearStart);
  const [to, setTo] = useState(todayISO);
  const [tab, setTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState('');

  const params = useMemo(() => ({ from, to }), [from, to]);
  const activeTab = TABS.find((item) => item.id === tab) || TABS[0];

  async function load() {
    setLoading(true);
    setError('');
    try {
      const response = await reportApi.summary(params);
      setSummary(response.payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, to]);

  async function exportCsv(type) {
    setExporting(type);
    try {
      const { blob, fileName } = await reportApi.exportCsv(type, params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `hr-${type}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      showToast('CSV downloaded');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setExporting('');
    }
  }

  const people = summary?.people || {};
  const leaves = summary?.leaves || {};
  const attendance = summary?.attendance || {};
  const payroll = summary?.payroll || {};
  const overtime = summary?.overtime || {};
  const performance = summary?.performance || {};

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="page-copy">
            {loading
              ? 'Loading HR analytics…'
              : `Headcount, time, payroll, and performance · ${formatDate(summary?.from)} – ${formatDate(summary?.to)}`}
          </p>
        </div>
        {activeTab.exportType ? (
          <button
            type="button"
            className="button-ghost"
            disabled={Boolean(exporting)}
            onClick={() => exportCsv(activeTab.exportType)}
          >
            <IconFile />
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        ) : null}
      </header>

      {error ? <div className="banner banner-error">{error}</div> : null}

      <div className="filter-bar">
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
        <button type="button" className="button-ghost" onClick={() => { setFrom(monthStart()); setTo(todayISO()); }}>
          This month
        </button>
        <button type="button" className="button-ghost" onClick={() => { setFrom(daysAgo(30)); setTo(todayISO()); }}>
          Last 30 days
        </button>
        <button type="button" className="button-ghost" onClick={() => { setFrom(yearStart()); setTo(todayISO()); }}>
          This year
        </button>
      </div>

      <div className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`tab ${tab === item.id ? 'active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <>
          <div className="stat-grid">
            <StatCard label="Employees" value={summary?.employees} hint={`${people.active ?? 0} active`} Icon={IconPeople} />
            <StatCard label="Pending leave" value={summary?.pendingLeaves} hint={`${leaves.approvedDays ?? 0} approved days`} Icon={IconLeave} />
            <StatCard label="Today attendance" value={summary?.todayAttendance} hint={`${attendance.records ?? 0} records in range`} Icon={IconClock} />
            <StatCard label="Pending payroll" value={summary?.pendingPayrolls} hint={formatMoney(payroll.pendingAmount)} Icon={IconPay} />
            <StatCard label="Pending overtime" value={summary?.pendingOvertimes} hint={`${overtime.approvedHours ?? 0} hrs approved`} Icon={IconOvertime} />
            <StatCard label="Avg rating" value={performance.averageRating || '—'} hint={`${performance.reviews ?? 0} reviews`} Icon={IconStar} />
          </div>
          <div className="dashboard-split">
            <Breakdown title="Headcount by department" rows={people.byDepartment} />
            <Breakdown title="Leave by type" rows={leaves.byType} />
          </div>
          <div className="dashboard-split">
            <Breakdown title="Attendance mix" rows={attendance.byStatus} />
            <Breakdown title="Payroll status" rows={payroll.byStatus} />
          </div>
        </>
      )}

      {tab === 'people' && (
        <>
          <div className="stat-grid">
            <StatCard label="Total" value={people.total} Icon={IconPeople} />
            <StatCard label="Active" value={people.active} />
            <StatCard label="Inactive" value={people.inactive} />
            <StatCard label="New hires" value={people.newHires} hint="Hired in this period" />
          </div>
          <div className="dashboard-split">
            <Breakdown title="By department" rows={people.byDepartment} />
            <Breakdown title="By position" rows={people.byPosition} />
          </div>
          <article className="panel">
            <div className="panel-header">
              <h3>Department table</h3>
            </div>
            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>People</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {(people.byDepartment || []).length === 0 ? (
                    <tr>
                      <td colSpan={3}>No departments yet.</td>
                    </tr>
                  ) : (
                    people.byDepartment.map((row) => (
                      <tr key={row.name}>
                        <td data-label="Department">{row.name}</td>
                        <td data-label="People">{row.count}</td>
                        <td data-label="Share">{row.percent}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </>
      )}

      {tab === 'leaves' && (
        <>
          <div className="stat-grid">
            <StatCard label="Requests" value={leaves.total} Icon={IconLeave} />
            <StatCard label="Pending" value={leaves.pending} />
            <StatCard label="Approved" value={leaves.approved} />
            <StatCard label="Approved days" value={leaves.approvedDays} />
          </div>
          <div className="dashboard-split">
            <Breakdown title="By type" rows={leaves.byType} />
            <Breakdown title="By status" rows={leaves.byStatus} />
          </div>
        </>
      )}

      {tab === 'attendance' && (
        <>
          <div className="stat-grid">
            <StatCard label="Records" value={attendance.records} Icon={IconClock} />
            <StatCard label="Present" value={attendance.present} />
            <StatCard label="Late" value={attendance.late} />
            <StatCard label="Absent" value={attendance.absent} />
          </div>
          <Breakdown title="Attendance status" rows={attendance.byStatus} />
        </>
      )}

      {tab === 'payroll' && (
        <>
          <div className="stat-grid">
            <StatCard label="Records" value={payroll.records} Icon={IconPay} />
            <StatCard label="Pending" value={payroll.pending} hint={formatMoney(payroll.pendingAmount)} />
            <StatCard label="Paid" value={payroll.paid} hint={formatMoney(payroll.paidAmount)} />
            <StatCard label="Total net" value={formatMoney(payroll.totalAmount)} />
          </div>
          <Breakdown title="Payroll status" rows={payroll.byStatus} />
        </>
      )}

      {tab === 'overtime' && (
        <>
          <div className="stat-grid">
            <StatCard label="Requests" value={overtime.records} Icon={IconOvertime} />
            <StatCard label="Pending hours" value={overtime.pendingHours} />
            <StatCard label="Approved hours" value={overtime.approvedHours} />
            <StatCard label="Rejected" value={overtime.rejected} />
          </div>
          <Breakdown title="Overtime status" rows={overtime.byStatus} />
        </>
      )}

      {tab === 'performance' && (
        <>
          <div className="stat-grid">
            <StatCard label="Reviews" value={performance.reviews} Icon={IconStar} />
            <StatCard label="Average rating" value={performance.averageRating || '—'} Icon={IconChart} />
          </div>
          <Breakdown title="Ratings" rows={performance.byRating} />
        </>
      )}
    </section>
  );
}
