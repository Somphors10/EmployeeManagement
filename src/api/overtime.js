import { request, withQuery } from './client';

const BASE = '/api/v1/overtimes';

export const overtimeApi = {
  getAll(employeeId) {
    return request(`${BASE}${withQuery({ employeeId })}`);
  },
  create(payload) {
    return request(BASE, { method: 'POST', body: JSON.stringify(payload) });
  },
  approve(id) {
    return request(`${BASE}/${id}/approve`, { method: 'PATCH' });
  },
  reject(id) {
    return request(`${BASE}/${id}/reject`, { method: 'PATCH' });
  },
};
