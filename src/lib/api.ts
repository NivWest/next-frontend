export async function api<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? endpoint : `/api/v1/${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Required to send cookies (like session_id) on all requests
    // Because we are proxying, we just need 'same-origin' if we use the proxy, 
    // but 'include' is safe to ensure cookies are sent.
    credentials: 'true' === 'true' ? 'include' : 'same-origin',
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      // Dispatch a custom event that useUIStore can listen to, or we can just throw
      window.dispatchEvent(new Event('auth-error'));
    }
    
    let message = 'An error occurred';
    try {
      const errorData = await response.json();
      message = errorData.error || errorData.message || message;
    } catch (e) {
      // Ignored
    }
    throw new Error(message);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}
