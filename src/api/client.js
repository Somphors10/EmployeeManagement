import { getToken, notifyUnauthorized } from './session';

async function request(url, options = {}) {
  const { skipAuth, headers: extraHeaders, ...rest } = options;
  const token = skipAuth ? null : getToken();
  const isFormData = typeof FormData !== 'undefined' && rest.body instanceof FormData;

  const response = await fetch(url, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders || {}),
    },
    ...rest,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (response.status === 401 && !skipAuth) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    const fallback =
      response.status === 403 ? 'Access denied' : `Request failed with status ${response.status}`;
    const message = data?.message || fallback;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return data;
}

function withQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

async function requestBlob(url, options = {}) {
  const { skipAuth, headers: extraHeaders, ...rest } = options;
  const token = skipAuth ? null : getToken();

  const response = await fetch(url, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(extraHeaders || {}),
    },
    ...rest,
  });

  if (response.status === 401 && !skipAuth) {
    notifyUnauthorized();
  }

  if (!response.ok) {
    let data = null;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const fallback =
      response.status === 403 ? 'Access denied' : `Request failed with status ${response.status}`;
    const error = new Error(data?.message || fallback);
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename\*?=(?:UTF-8''|")?([^\";]+)/i);
  const fileName = match ? decodeURIComponent(match[1].replace(/"/g, '')) : 'document';
  return { blob, fileName, contentType: response.headers.get('Content-Type') };
}

export { request, requestBlob, withQuery };
