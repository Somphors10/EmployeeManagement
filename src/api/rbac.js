import { request } from './client';

export const rbacApi = {
  me() {
    return request('/api/v1/rbac/me');
  },
  matrix() {
    return request('/api/v1/rbac/matrix');
  },
};
