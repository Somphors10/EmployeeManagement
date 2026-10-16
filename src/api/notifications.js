import { request } from './client';

const BASE = '/api/v1/notifications';

const KIND_RULES = [
  ['welcome', '/', ['welcome']],
  ['leave', '/leaves', ['leave']],
  ['overtime', '/overtime', ['overtime']],
  ['payroll', '/payroll', ['payroll', 'payslip']],
  ['holiday', '/holidays', ['holiday']],
  ['attendance', '/attendance', ['attendance', 'check-in', 'check in']],
  ['announcement', '/announcements', ['announcement']],
  ['performance', '/performance', ['performance', 'review']],
  ['document', '/documents', ['document']],
  ['report', '/reports', ['report']],
  ['department', '/organization', ['department']],
  ['user', '/users', ['user account', 'login account']],
  ['settings', '/settings', ['settings']],
  ['employee', '/employees', ['new hire', 'joined as']],
];

function asList(response) {
  const payload = response?.payload ?? response?.data ?? response;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.notifications)) return payload.notifications;
  if (payload && typeof payload === 'object' && payload.id) return [payload];
  return [];
}

function kindFrom(note) {
  const text = `${note.title || ''} ${note.message || ''}`.toLowerCase();
  const match = KIND_RULES.find(([, , needles]) => needles.some((needle) => text.includes(needle)));
  return match ? match[0] : 'general';
}

function hrefFrom(kind) {
  const match = KIND_RULES.find(([name]) => name === kind);
  return match ? match[1] : '/notifications';
}

export function asNote(note) {
  const kind = kindFrom(note);
  return {
    id: note.id,
    title: note.title || note.subject || 'Notification',
    message: note.message || note.body || (typeof note.content === 'string' ? note.content : '') || '',
    read: Boolean(note.read ?? note.isRead ?? note.seen),
    createdAt: note.createdAt || note.created_at || note.sentAt || note.timestamp,
    kind,
    href: hrefFrom(kind),
  };
}

export const notificationApi = {
  async getAll() {
    const response = await request(BASE);
    return asList(response)
      .map(asNote)
      .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  },
  markRead(id) {
    return request(`${BASE}/${id}/read`, { method: 'PATCH' });
  },
};
