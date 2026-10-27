import { useEffect, useMemo, useState } from 'react';
import { reportApi } from '../api/reports';
import { IconFile } from '../components/Icons';
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

function Stat({ label, value }) {
  return (
    <article className="stat-card">
      <p>{label}</p>
      <strong>{value ?? '—'}</strong>
    </article>
  );
}

function ReportTable({ title, columns, rows, empty = 'No data in this period.' }) {
  return (
    <div className="table-card">
      {title ? (
        <div className="table-toolbar">
          <strong>{title}</strong>
        </div>
      ) : null}
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id || row.name || columns.map((column) => row[column.key]).join('-')}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.label}>
                    {row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function breakdownRows(rows = [], { money = false } = {}) {
  return rows.map((row) => ({
    name: prettyEnum(row.name),
    count: money ? formatMoney(row.amount ?? row.count) : row.count ?? '—',
    share: row.percent != null ? `${row.percent}%` : '—',
  }));
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
  const shareColumns = [
    { key: 'name', label: 'Name' },
    { key: 'count', label: 'Count' },
    { key: 'share', label: 'Share' },
  ];

  return (
    <section className="page reports-page">
      <header className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="page-copy">
            {loading
              ? 'Loading report…'
              : `Totals for ${formatDate(summary?.from || from)} – ${formatDate(summary?.to || to)}.`}
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
        <button
          type="button"
          className="button-ghost"
          onClick={() => {
            setFrom(monthStart());
            setTo(todayISO());
          }}
        >
          This month
        </button>
        <button
          type="button"
          className="button-ghost"
          onClick={() => {
            setFrom(daysAgo(30));
            setTo(todayISO());
          }}
        >
          Last 30 days
        </button>
        <button
          type="button"
          className="button-ghost"
          onClick={() => {
            setFrom(yearStart());
            setTo(todayISO());
          }}
        >
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
            <Stat label="Employees" value={summary?.employees} />
            <Stat label="Pending leave" value={summary?.pendingLeaves} />
            <Stat label="Attendance today" value={summary?.todayAttendance} />
            <Stat label="Pending payroll" value={summary?.pendingPayrolls} />
            <Stat label="Pending overtime" value={summary?.pendingOvertimes} />
            <Stat label="Avg rating" value={performance.averageRating || '—'} />
          </div>
          <ReportTable
            title="Summary"
            columns={[
              { key: 'name', label: 'Area' },
              { key: 'count', label: 'Total' },
              { key: 'note', label: 'Detail' },
            ]}
            rows={[
              { name: 'People', count: people.total ?? summary?.employees ?? '—', note: `${people.active ?? 0} active` },
              { name: 'Leave', count: leaves.total ?? '—', note: `${leaves.pending ?? 0} pending · ${leaves.approvedDays ?? 0} approved days` },
              { name: 'Attendance', count: attendance.records ?? '—', note: `${attendance.present ?? 0} present · ${attendance.late ?? 0} late` },
              { name: 'Payroll', count: payroll.records ?? '—', note: `${formatMoney(payroll.pendingAmount)} pending` },
              { name: 'Overtime', count: overtime.records ?? '—', note: `${overtime.approvedHours ?? 0} hrs approved` },
              { name: 'Performance', count: performance.reviews ?? '—', note: `Avg ${performance.averageRating || '—'}` },
            ]}
          />
        </>
      )}

      {tab === 'people' && (
        <>
          <div className="stat-grid">
            <Stat label="Total" value={people.total} />
            <Stat label="Active" value={people.active} />
            <Stat label="Inactive" value={people.inactive} />
            <Stat label="New hires" value={people.newHires} />
          </div>
          <div className="stack">
            <ReportTable
              title="By department"
              columns={shareColumns}
              rows={breakdownRows(people.byDepartment)}
            />
            <ReportTable
              title="By position"
              columns={shareColumns}
              rows={breakdownRows(people.byPosition)}
            />
          </div>
        </>
      )}

      {tab === 'leaves' && (
        <>
          <div className="stat-grid">
            <Stat label="Requests" value={leaves.total} />
            <Stat label="Pending" value={leaves.pending} />
            <Stat label="Approved" value={leaves.approved} />
            <Stat label="Approved days" value={leaves.approvedDays} />
          </div>
          <div className="stack">
            <ReportTable title="By type" columns={shareColumns} rows={breakdownRows(leaves.byType)} />
            <ReportTable title="By status" columns={shareColumns} rows={breakdownRows(leaves.byStatus)} />
          </div>
        </>
      )}

      {tab === 'attendance' && (
        <>
          <div className="stat-grid">
            <Stat label="Records" value={attendance.records} />
            <Stat label="Present" value={attendance.present} />
            <Stat label="Late" value={attendance.late} />
            <Stat label="Absent" value={attendance.absent} />
          </div>
          <ReportTable title="By status" columns={shareColumns} rows={breakdownRows(attendance.byStatus)} />
        </>
      )}

      {tab === 'payroll' && (
        <>
          <div className="stat-grid">
            <Stat label="Records" value={payroll.records} />
            <Stat label="Pending" value={payroll.pending} />
            <Stat label="Paid" value={payroll.paid} />
            <Stat label="Total net" value={formatMoney(payroll.totalAmount)} />
          </div>
          <ReportTable
            title="By status"
            columns={[
              { key: 'name', label: 'Status' },
              { key: 'count', label: 'Records' },
              { key: 'share', label: 'Share' },
            ]}
            rows={breakdownRows(payroll.byStatus, { money: false })}
          />
        </>
      )}

      {tab === 'overtime' && (
        <>
          <div className="stat-grid">
            <Stat label="Requests" value={overtime.records} />
            <Stat label="Pending hours" value={overtime.pendingHours} />
            <Stat label="Approved hours" value={overtime.approvedHours} />
            <Stat label="Rejected" value={overtime.rejected} />
          </div>
          <ReportTable title="By status" columns={shareColumns} rows={breakdownRows(overtime.byStatus)} />
        </>
      )}

      {tab === 'performance' && (
        <>
          <div className="stat-grid">
            <Stat label="Reviews" value={performance.reviews} />
            <Stat label="Average rating" value={performance.averageRating || '—'} />
          </div>
          <ReportTable title="By rating" columns={shareColumns} rows={breakdownRows(performance.byRating)} />
        </>
      )}
    </section>
  );
}
