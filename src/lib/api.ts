const GENERIC_ERROR_MESSAGE = 'An error occurred';

/**
 * Thrown by `api()` on a non-OK response. `message` is the backend's `error` text (or a generic fallback),
 * `status` the HTTP status and `code` the machine-readable `code` of the `{error, code}` body, when there is one.
 */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

function stringField(body: unknown, key: string): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const value: unknown = (body as Record<string, unknown>)[key];
  return typeof value === 'string' && value !== '' ? value : null;
}

async function toRequestError(response: Response): Promise<ApiRequestError> {
  let message = GENERIC_ERROR_MESSAGE;
  let code: string | null = null;
  try {
    const errorData: unknown = await response.json();
    message = stringField(errorData, 'error') ?? stringField(errorData, 'message') ?? message;
    code = stringField(errorData, 'code');
  } catch {
    // Not a JSON error body; keep the generic message
  }
  return new ApiRequestError(message, response.status, code);
}

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
    throw await toRequestError(response);
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text);
}
