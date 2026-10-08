import { request } from './client';

const BASE = '/api/v1/notifications';

export const notificationApi = {
  getAll() {
    return request(BASE);
  },
  markRead(id) {
    return request(`${BASE}/${id}/read`, { method: 'PATCH' });
  },
};
