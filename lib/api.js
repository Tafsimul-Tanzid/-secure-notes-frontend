// Small fetch wrapper for the backend. Sends the JWT from localStorage and
// turns error responses into thrown Errors with the API's message.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const clearToken = () => localStorage.removeItem('token');

export async function api(method, path, body) {
  const token = getToken();
  let res;
  try {
    res = await fetch(API_URL + path, {
      method,
      headers: {
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // render's free plan sleeps when idle, the first request can take a while
    throw new Error(`Can't reach the API at ${API_URL}. If it was asleep, try again in a minute.`);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({ error: `Unexpected response (${res.status})` }));
  if (!res.ok) {
    // token expired or user was deleted, AuthProvider listens for this and logs out
    if (res.status === 401 && token) window.dispatchEvent(new Event('auth:expired'));
    throw new Error([data.error, ...(data.details || [])].join('\n'));
  }
  return data;
}

export const splitList = (s = '') => s.split(',').map((x) => x.trim()).filter(Boolean);

export const formatDate = (d) =>
  new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
