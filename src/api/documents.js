import { request, withQuery } from './client';

const BASE = '/api/v1/documents';

export const documentApi = {
  getAll(employeeId) {
    return request(`${BASE}${withQuery({ employeeId })}`);
  },
  getById(id) {
    return request(`${BASE}/${id}`);
  },
  create(payload) {
    return request(BASE, { method: 'POST', body: JSON.stringify(payload) });
  },
  remove(id) {
    return request(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
