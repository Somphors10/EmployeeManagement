import { request } from './client';

export const authApi = {
  login(username, password) {
    return request('/api/v1/auth/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ username, password }),
    });
  },
  me() {
    return request('/api/v1/auth/me');
  },
  changePassword(currentPassword, newPassword) {
    return request('/api/v1/auth/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },
};
