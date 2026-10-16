import { request, withQuery } from './client';

const BASE_URL = '/api/v1/employees';

export const employeeApi = {
  getAll() {
    return request(BASE_URL);
  },
  search({ department, q, status } = {}) {
    return request(`${BASE_URL}/search${withQuery({ department, q, status })}`);
  },
  getById(id) {
    return request(`${BASE_URL}/${id}`);
  },
  getSummary() {
    return request(`${BASE_URL}/summary`);
  },
  getDepartments() {
    return request(`${BASE_URL}/departments`);
  },
  getDepartmentById(id) {
    return request(`${BASE_URL}/departments/${id}`);
  },
  createDepartment(payload) {
    return request(`${BASE_URL}/departments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateDepartment(id, payload) {
    return request(`${BASE_URL}/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  removeDepartment(id) {
    return request(`${BASE_URL}/departments/${id}`, { method: 'DELETE' });
  },
  getPositions() {
    return request(`${BASE_URL}/positions`);
  },
  getHistory(id) {
    return request(`${BASE_URL}/${id}/history`);
  },
  getSubordinates(id) {
    return request(`${BASE_URL}/${id}/subordinates`);
  },
  create(payload) {
    return request(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  update(id, payload) {
    return request(`${BASE_URL}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
  updateStatus(id, status) {
    return request(`${BASE_URL}/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
  transfer(id, payload) {
    return request(`${BASE_URL}/${id}/transfer`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
  assignManager(id, managerId) {
    return request(`${BASE_URL}/${id}/manager`, {
      method: 'PATCH',
      body: JSON.stringify({ managerId }),
    });
  },
  clearManager(id) {
    return request(`${BASE_URL}/${id}/manager`, {
      method: 'DELETE',
    });
  },
  remove(id) {
    return request(`${BASE_URL}/${id}`, {
      method: 'DELETE',
    });
  },
};
