import { request } from './client';

const BASE = '/api/v1/settings';

export const settingApi = {
  getAll() {
    return request(BASE);
  },
  getByKey(key) {
    return request(`${BASE}/${encodeURIComponent(key)}`);
  },
  save(key, value) {
    return request(`${BASE}/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  },
};
