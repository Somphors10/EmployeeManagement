import { request, requestBlob, withQuery } from './client';

const BASE = '/api/v1/reports';

export const reportApi = {
  summary(params = {}) {
    return request(`${BASE}/summary${withQuery(params)}`);
  },
  exportCsv(type, params = {}) {
    return requestBlob(`${BASE}/export${withQuery({ type, ...params })}`);
  },
};
