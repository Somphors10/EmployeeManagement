import { request, withQuery } from './client';

const BASE = '/api/v1/payrolls';

export const payrollApi = {
  getAll({ employeeId, status } = {}) {
    return request(`${BASE}${withQuery({ employeeId, status })}`);
  },
  getById(id) {
    return request(`${BASE}/${id}`);
  },
  create(payload) {
    return request(BASE, { method: 'POST', body: JSON.stringify(payload) });
  },
  markPaid(id) {
    return request(`${BASE}/${id}/pay`, { method: 'PATCH' });
  },
};
