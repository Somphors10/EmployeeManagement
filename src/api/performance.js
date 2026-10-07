import { request, withQuery } from './client';

const BASE = '/api/v1/performance-reviews';

export const performanceApi = {
  getAll(employeeId) {
    return request(`${BASE}${withQuery({ employeeId })}`);
  },
  getById(id) {
    return request(`${BASE}/${id}`);
  },
  create(payload) {
    return request(BASE, { method: 'POST', body: JSON.stringify(payload) });
  },
};
