import { request, withQuery } from './client';

export const dashboardApi = {
  getTotals() {
    return request('/api/v1/dashboard');
  },
  getNavigation() {
    return request('/api/v1/navigation');
  },
};
