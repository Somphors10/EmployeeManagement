import { request, withQuery } from './client';

const BASE_URL = '/api/v1/leaves';

export const leaveApi = {
  getAll({ employeeId, status } = {}) {
    return request(`${BASE_URL}${withQuery({ employeeId, status })}`);
  },
  getById(id) {
    return request(`${BASE_URL}/${id}`);
  },
  create(payload) {
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  approve(id) {
    return request(`${BASE_URL}/${id}/approve`, { method: 'PATCH' });
  },
  reject(id) {
    return request(`${BASE_URL}/${id}/reject`, { method: 'PATCH' });
  },
  cancel(id) {
    return request(`${BASE_URL}/${id}/cancel`, { method: 'PATCH' });
  },
  balances(employeeId) {
    return request(`${BASE_URL}/balances${withQuery({ employeeId })}`);
  },
};
