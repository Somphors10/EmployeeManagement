import { request } from './client';

const BASE = '/api/v1/organization/departments';

export const organizationApi = {
  getAll() {
    return request(BASE);
  },
  getById(id) {
    return request(`${BASE}/${id}`);
  },
  create(payload) {
    return request(BASE, { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id, payload) {
    return request(`${BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove(id) {
    return request(`${BASE}/${id}`, { method: 'DELETE' });
  },
};
