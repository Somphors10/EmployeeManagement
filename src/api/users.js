import { request } from './client';

const BASE = '/api/v1/users';

export const userApi = {
  getAll() {
    return request(BASE);
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
