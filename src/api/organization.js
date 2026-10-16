import { request } from './client';

const ORG_BASE = '/api/v1/organization/departments';

export const organizationApi = {
  getAll() {
    return request(ORG_BASE);
  },
  getById(id) {
    return request(`${ORG_BASE}/${id}`);
  },
  create(payload) {
    return request(ORG_BASE, { method: 'POST', body: JSON.stringify(payload) });
  },
  update(id, payload) {
    return request(`${ORG_BASE}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  remove(id) {
    return request(`${ORG_BASE}/${id}`, { method: 'DELETE' });
  },
};
