import { request, requestBlob, withQuery } from './client';

const BASE = '/api/v1/documents';

function toFormData({ employeeId, title, documentType, file }) {
  const form = new FormData();
  if (employeeId) form.append('employeeId', employeeId);
  if (title) form.append('title', title);
  if (documentType) form.append('documentType', documentType);
  if (file) form.append('file', file);
  return form;
}

function guessType(fileName = '') {
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.doc')) return 'application/msword';
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  return '';
}

function typedBlob(blob, contentType, fileName) {
  const type =
    (blob.type && blob.type !== 'application/octet-stream' && blob.type) ||
    (contentType && contentType !== 'application/octet-stream' && contentType) ||
    guessType(fileName);
  if (type && type !== blob.type) return new Blob([blob], { type });
  return blob;
}

function triggerDownload(url, fileName) {
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'document';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export const documentApi = {
  getAll(employeeId) {
    return request(`${BASE}${withQuery({ employeeId })}`);
  },
  getById(id) {
    return request(`${BASE}/${id}`);
  },
  create({ employeeId, title, documentType, file }) {
    return request(BASE, {
      method: 'POST',
      body: toFormData({ employeeId, title, documentType, file }),
    });
  },
  update(id, { title, documentType, file }) {
    return request(`${BASE}/${id}`, {
      method: 'PUT',
      body: toFormData({ title, documentType, file }),
    });
  },
  remove(id) {
    return request(`${BASE}/${id}`, { method: 'DELETE' });
  },
  async fetchFile(id) {
    const result = await requestBlob(`${BASE}/${id}/file`);
    const blob = typedBlob(result.blob, result.contentType, result.fileName);
    return { ...result, blob };
  },
  async downloadFile(id) {
    const { blob, fileName } = await this.fetchFile(id);
    const url = URL.createObjectURL(blob);
    triggerDownload(url, fileName);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
