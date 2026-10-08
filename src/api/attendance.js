import { request, withQuery } from './client';

const BASE = '/api/v1/attendances';

export const attendanceApi = {
  getAll({ employeeId, date, from, to } = {}) {
    return request(`${BASE}${withQuery({ employeeId, date, from, to })}`);
  },
  getById(id) {
    return request(`${BASE}/${id}`);
  },
  checkIn(employeeId) {
    return request(`${BASE}/check-in`, {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    });
  },
  checkOut(employeeId) {
    return request(`${BASE}/check-out`, {
      method: 'POST',
      body: JSON.stringify({ employeeId }),
    });
  },
  correct(id, payload) {
    return request(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};
