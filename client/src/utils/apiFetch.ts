import { errorLog } from '@/lib/utils';

export async function apiFetch(path: string, options?: RequestInit) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  try {
    const res = await fetch(`${baseUrl}/api/v1${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      const message = `API call to ${path} failed with status ${res.status}`;
      errorLog(message);
    }

    return res;
  } catch (err) {
    errorLog(`Network error during API call to ${path}`, err);
    throw err;
  }
}