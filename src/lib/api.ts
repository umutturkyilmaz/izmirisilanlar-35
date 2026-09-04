const API_URL = (import.meta.env.VITE_PUBLIC_API_URL || '').replace(/\/$/, '');

/** Dev: Vite proxy; prod: VITE_PUBLIC_API_URL zorunlu */
export const isApiConfigured = Boolean(
  import.meta.env.DEV || (API_URL && !API_URL.includes('YOUR_')),
);

const TOKEN_KEY = 'izmir_api_token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

type Opts = {
  method?: string;
  body?: unknown;
  auth?: boolean;
  formData?: FormData;
};

export async function api<T = unknown>(path: string, opts: Opts = {}): Promise<T> {
  if (!isApiConfigured) {
    throw new Error('API URL eksik. Railway Variables: VITE_PUBLIC_API_URL');
  }
  const headers: Record<string, string> = {};
  if (opts.auth !== false) {
    const t = getToken();
    if (t) headers.Authorization = `Bearer ${t}`;
  }
  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData;
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(`${API_URL}${path}`, {
    method: opts.method || (opts.body || opts.formData ? 'POST' : 'GET'),
    headers,
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function uploadFile(file: File, opts?: { private?: boolean }): Promise<string> {
  const fd = new FormData();
  fd.append('file', file);
  const q = opts?.private ? '?private=1' : '';
  const data = await api<{ url: string }>(`/api/upload${q}`, { method: 'POST', formData: fd });
  return data.url;
}

export default api;
