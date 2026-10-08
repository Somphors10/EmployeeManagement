import { request } from './client';

export const reportApi = {
  summary() {
    return request('/api/v1/reports/summary');
  },
};
