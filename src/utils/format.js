const AVATAR_TONES = [
  { bg: '#dbeafe', fg: '#1d4ed8' },
  { bg: '#e0f2fe', fg: '#0369a1' },
  { bg: '#e0e7ff', fg: '#3730a3' },
  { bg: '#cffafe', fg: '#0e7490' },
  { bg: '#f1f5f9', fg: '#334155' },
  { bg: '#dbe4ff', fg: '#1e3a8a' },
];

export function formatDate(value, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, options);
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fullName(person) {
  if (!person) return 'Unknown';
  return `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
}

export function initials(firstName = '', lastName = '') {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function toneFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length];
}

export function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function prettyEnum(value) {
  if (!value) return '—';
  return String(value)
    .toLowerCase()
    .replaceAll('_', ' ')
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function formatTime(value) {
  if (!value) return '—';
  return String(value).slice(0, 5);
}

export function formatMoney(value) {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function todayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function peopleMap(employees = []) {
  return Object.fromEntries(employees.map((person) => [person.id, person]));
}
