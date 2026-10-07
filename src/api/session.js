const TOKEN_KEY = 'eh.token';
const USER_KEY = 'eh.user';

let unauthorizedHandler = null;

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(user) {
  if (user?.token) window.localStorage.setItem(TOKEN_KEY, user.token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
}

export function notifyUnauthorized() {
  clearSession();
  unauthorizedHandler?.();
}
