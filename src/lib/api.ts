import type { components, paths } from '@/lib/api/schema';

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

/**
 * Untyped low-level client: every typed helper below ends here. `endpoint` is relative to /api/v1 unless it
 * starts with `/`. Rejects with `ApiRequestError`; a 401/403 also dispatches the window event `auth-error`.
 * Prefer `apiGet`/`apiPost`/`apiPatch`/`apiDelete`, whose paths and bodies are checked against the contract.
 */
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

// ---------------------------------------------------------------------------------------------------------
// Typed helpers over the generated contract (src/lib/api/schema.d.ts, `npm run api:gen`, story NW-07).
// Paths are the spec's paths relative to /api/v1 (e.g. '/watchlists/{id}'); path, query, header and body
// types, and the resolved success body, all come from backend api/openapi.yaml.
// ---------------------------------------------------------------------------------------------------------

/** All named schemas of the contract, e.g. `Schemas['Order']`. */
export type Schemas = components['schemas'];

/** Every machine-readable `code` an error body can carry. */
export type ErrorCode = Schemas['ErrorCode'];

/** The base path every contract path is relative to (`servers[0].url`). */
export const API_BASE_PATH = '/api/v1';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Contract paths that have an operation for method `M`. */
export type PathsWithMethod<M extends HttpMethod> = {
  [P in keyof paths]: paths[P] extends { [K in M]: object } ? P : never;
}[keyof paths];

/** The operation behind `M P`, e.g. `Operation<'/orders', 'post'>`. */
export type Operation<P extends keyof paths, M extends HttpMethod> = paths[P] extends { [K in M]: infer Op } ? Op : never;

type SuccessStatus = 200 | 201 | 202 | 204;

type JsonContent<R> = R extends { content: { 'application/json': infer B } } ? B : void;

/** The JSON body of an operation's 2xx responses (`void` for 204). */
export type SuccessBody<Op> = Op extends { responses: infer Rs }
  ? { [S in keyof Rs]: S extends SuccessStatus ? JsonContent<Rs[S]> : never }[keyof Rs]
  : never;

/** The JSON request body of an operation, or never when it takes none. */
export type RequestBody<Op> = Op extends { requestBody: { content: { 'application/json': infer B } } } ? B : never;

type ParamLocation = 'path' | 'query' | 'header';

type Param<Op, L extends ParamLocation> = Op extends { parameters: infer Ps }
  ? L extends keyof Ps
    ? Exclude<Ps[L], undefined>
    : never
  : never;

type ParamIsRequired<Op, L extends ParamLocation> = Op extends { parameters: infer Ps }
  ? L extends keyof Ps
    ? // eslint-disable-next-line @typescript-eslint/no-empty-object-type
      {} extends Pick<Ps, L>
      ? false
      : true
    : false
  : false;

type ParamField<Op, L extends ParamLocation, Name extends string> = [Param<Op, L>] extends [never]
  ? { [N in Name]?: never }
  : ParamIsRequired<Op, L> extends true
    ? { [N in Name]: Param<Op, L> }
    : { [N in Name]?: Param<Op, L> };

type BodyField<Op> = [RequestBody<Op>] extends [never] ? { body?: never } : { body: RequestBody<Op> };

/** Options of one typed call: required exactly when the contract requires them. */
export type RequestOptions<Op> = ParamField<Op, 'path', 'path'> &
  ParamField<Op, 'query', 'query'> &
  ParamField<Op, 'header', 'headers'> &
  BodyField<Op> & { signal?: AbortSignal };

// The options argument may be left out when nothing in it is required.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type OptionsArg<Op> = {} extends RequestOptions<Op> ? [options?: RequestOptions<Op>] : [options: RequestOptions<Op>];

type QueryValue = string | number | boolean | null | undefined;

interface LooseOptions {
  path?: Record<string, string | number | undefined>;
  query?: Record<string, QueryValue>;
  headers?: Record<string, string | undefined>;
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Builds `/api/v1<path>?<query>`: `{name}` segments are replaced by the URI-encoded path parameter, and query
 * entries that are undefined or null are left out (in insertion order otherwise).
 */
export function buildApiUrl(path: string, options: Pick<LooseOptions, 'path' | 'query'> = {}): string {
  const resolved = path.replace(/\{([^}]+)\}/g, (_, name: string) => {
    const value = options.path?.[name];
    if (value === undefined) throw new Error(`Missing path parameter "${name}" for ${path}`);
    return encodeURIComponent(String(value));
  });
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value));
  }
  const qs = query.toString();
  return `${API_BASE_PATH}${resolved}${qs ? `?${qs}` : ''}`;
}

function send<T>(method: HttpMethod, path: string, options: LooseOptions = {}): Promise<T> {
  const init: RequestInit = {};
  // GET stays the fetch default, so init carries no method for it.
  if (method !== 'get') init.method = method.toUpperCase();
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(options.headers ?? {})) {
    if (value !== undefined) headers[key] = value;
  }
  if (Object.keys(headers).length > 0) init.headers = headers;
  if (options.body !== undefined) init.body = JSON.stringify(options.body);
  if (options.signal) init.signal = options.signal;
  return api<T>(buildApiUrl(path, options), init);
}

/** `GET` a contract path, e.g. `apiGet('/orders', { query: { limit: 20 } })`. */
export function apiGet<P extends PathsWithMethod<'get'>>(
  path: P,
  ...[options]: OptionsArg<Operation<P, 'get'>>
): Promise<SuccessBody<Operation<P, 'get'>>> {
  return send('get', path, options as LooseOptions | undefined);
}

/** `POST` to a contract path; `body` is the operation's request schema. */
export function apiPost<P extends PathsWithMethod<'post'>>(
  path: P,
  ...[options]: OptionsArg<Operation<P, 'post'>>
): Promise<SuccessBody<Operation<P, 'post'>>> {
  return send('post', path, options as LooseOptions | undefined);
}

/** `PUT` to a contract path. */
export function apiPut<P extends PathsWithMethod<'put'>>(
  path: P,
  ...[options]: OptionsArg<Operation<P, 'put'>>
): Promise<SuccessBody<Operation<P, 'put'>>> {
  return send('put', path, options as LooseOptions | undefined);
}

/** `PATCH` a contract path. */
export function apiPatch<P extends PathsWithMethod<'patch'>>(
  path: P,
  ...[options]: OptionsArg<Operation<P, 'patch'>>
): Promise<SuccessBody<Operation<P, 'patch'>>> {
  return send('patch', path, options as LooseOptions | undefined);
}

/** `DELETE` a contract path. */
export function apiDelete<P extends PathsWithMethod<'delete'>>(
  path: P,
  ...[options]: OptionsArg<Operation<P, 'delete'>>
): Promise<SuccessBody<Operation<P, 'delete'>>> {
  return send('delete', path, options as LooseOptions | undefined);
}
