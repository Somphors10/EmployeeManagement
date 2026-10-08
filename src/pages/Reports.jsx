import { useEffect, useState } from 'react';
import { reportApi } from '../api/reports';
import { useToast } from '../components/Toast';

export default function Reports() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    reportApi
      .summary()
      .then((response) => setSummary(response.payload))
      .catch((err) => showToast(err.message, 'error'));
  }, [showToast]);

  const cards = [
    ['Employees', summary?.employees],
    ['Pending leaves', summary?.pendingLeaves],
    ['Today attendance', summary?.todayAttendance],
    ['Pending payrolls', summary?.pendingPayrolls],
    ['Pending overtime', summary?.pendingOvertimes],
  ];

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="page-copy">High-level HR counts for the current workspace.</p>
        </div>
      </header>
      <div className="stat-grid">
        {cards.map(([label, value]) => (
          <article key={label} className="stat-card">
            <p className="muted">{label}</p>
            <strong>{value ?? '—'}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
