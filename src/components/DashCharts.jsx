const TONES = ['#1e40af', '#0d9488', '#64748b', '#334155', '#94a3b8', '#1e3a8a'];

const STATUS_TONES = {
  Approved: '#0d9488',
  Pending: '#1e40af',
  Rejected: '#64748b',
  Cancelled: '#94a3b8',
};

export function countBy(items, getKey, limit = 6) {
  const counts = items.reduce((acc, item) => {
    const name = getKey(item) || 'Other';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count], index) => ({
      name,
      count,
      tone: STATUS_TONES[name] || TONES[index % TONES.length],
    }));
}

export function countByMonth(items, months = 6) {
  const now = new Date();
  const rows = Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - 1 - index), 1);
    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      name: date.toLocaleDateString(undefined, { month: 'short' }),
      count: 0,
    };
  });
  items.forEach((item) => {
    if (!item.createdAt) return;
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const row = rows.find((month) => month.key === key);
    if (row) row.count += 1;
  });
  return rows;
}

export function DonutChart({ rows, label, unit = 'total' }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0) || 1;
  const cx = 70;
  const cy = 70;
  const r = 42;
  const ring = 16;
  const circ = 2 * Math.PI * r;
  const gap = circ * 0.02;
  let offset = 0;

  return (
    <div className="dash-donut" aria-label={label}>
      <div className="dash-donut-ring">
        <svg viewBox="0 0 140 140">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#eef2f7" strokeWidth={ring} />
          {rows.map((row) => {
            const share = row.count / total;
            const len = Math.max(0, share * circ - gap);
            const slice = (
              <circle
                key={row.name}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={row.tone}
                strokeWidth={ring}
                strokeDasharray={`${len} ${circ - len}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            );
            offset += share * circ;
            return slice;
          })}
        </svg>
        <div className="dash-donut-center">
          <strong>{total}</strong>
          <em>{unit}</em>
        </div>
      </div>
      <ul>
        {rows.map((row) => (
          <li key={row.name}>
            <i style={{ background: row.tone }} />
            <span>{row.name}</span>
            <strong>{row.count}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatRows({ rows, label }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <ul className="dash-rows" aria-label={label}>
      {rows.map((row) => (
        <li key={row.name}>
          <span>{row.name}</span>
          <b>
            <i style={{ width: `${Math.max(8, (row.count / max) * 100)}%` }} />
          </b>
          <strong>{row.count}</strong>
        </li>
      ))}
    </ul>
  );
}

export function MonthBars({ rows, label }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="dash-vbars" role="img" aria-label={label}>
      {rows.map((row) => (
        <div key={row.name} className="dash-vbar">
          <strong>{row.count || '\u00a0'}</strong>
          <span>{row.count ? <i style={{ height: `${Math.max(12, (row.count / max) * 100)}%` }} /> : null}</span>
          <em>{row.name}</em>
        </div>
      ))}
    </div>
  );
}

export function VBars({ rows, label }) {
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div className="dash-vbars" role="img" aria-label={label}>
      {rows.map((row) => (
        <div key={row.name} className="dash-vbar">
          <strong>{row.count}</strong>
          <span>
            <i style={{ height: `${Math.max(12, (row.count / max) * 100)}%` }} />
          </span>
          <em>{row.name}</em>
        </div>
      ))}
    </div>
  );
}
