import ky, { type KyInstance, type Options } from "ky";
import type { paths } from "./schema";

export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
  status: number;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Record<string, unknown>;

  constructor(args: {
    status: number;
    code: string;
    details: Record<string, unknown>;
    message?: string;
  }) {
    super(args.message ?? `request failed: ${args.status}`);
    this.name = "ApiRequestError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
  }
}

export type ApiClientOptions = {
  baseUrl?: string;
  accessToken?: string | null;
  reauthToken?: string | null;
  beforeRequest?: () => Promise<void>;
  onUnauthorized?: () => Promise<boolean>;
};

type PathKey = keyof paths;
type Method = "get" | "put" | "post" | "delete" | "patch";

type PathsWith<M extends Method> = {
  [K in PathKey]: paths[K][M & keyof paths[K]] extends never ? never : K;
}[PathKey];

type OpOf<P extends PathKey, M extends Method> = M extends keyof paths[P] ? paths[P][M] : never;

type RequestBody<P extends PathKey, M extends Method> =
  OpOf<P, M> extends {
    requestBody?: { content: { "application/json": infer B } };
  }
    ? B
    : never;

type ResponseBody<P extends PathKey, M extends Method> =
  OpOf<P, M> extends { responses: infer R }
    ? R extends { 200: { content: { "application/json": infer B } } }
      ? B
      : R extends { 201: { content: { "application/json": infer B } } }
        ? B
        : R extends { 202: { content: { "application/json": infer B } } }
          ? B
          : unknown
    : unknown;

type PathParams<P extends PathKey, M extends Method> =
  OpOf<P, M> extends {
    parameters: { path?: infer PP };
  }
    ? PP
    : never;

type QueryParams<P extends PathKey, M extends Method> =
  OpOf<P, M> extends {
    parameters: { query?: infer QP };
  }
    ? QP
    : never;

type RequestOptions<P extends PathKey, M extends Method> = (keyof PathParams<P, M> extends never
  ? { path?: never }
  : { path: PathParams<P, M> }) &
  (keyof QueryParams<P, M> extends never
    ? { query?: never }
    : { query?: QueryParams<P, M> }) & {
    reauthToken?: string;
    idempotencyKey?: string;
  };

const IDEMPOTENT_METHODS = new Set(["post", "put", "patch", "delete"]);

const buildUrl = (
  baseUrl: string,
  path: string,
  params?: { path?: Record<string, unknown>; query?: Record<string, unknown> },
) => {
  let url = `${baseUrl}${path}`;
  for (const [k, v] of Object.entries(params?.path ?? {})) {
    url = url.replaceAll(`{${k}}`, encodeURIComponent(String(v)));
  }
  const unfilled = url.match(/\{[^}/]+\}/);
  if (unfilled) {
    throw new Error(`missing path param: ${unfilled[0]}`);
  }
  const query = new URLSearchParams();
  for (const [k, v] of Object.entries(params?.query ?? {})) {
    if (v === undefined || v === null) continue;
    if (Array.isArray(v)) {
      for (const item of v) query.append(k, String(item));
      continue;
    }
    if (typeof v === "object") {
      query.set(k, JSON.stringify(v));
      continue;
    }
    query.set(k, String(v));
  }
  const qs = query.toString();
  return qs ? `${url}?${qs}` : url;
};

const csrfToken = () => {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : undefined;
};

export const createClient = (options: ApiClientOptions = {}) => {
  const { baseUrl = "", accessToken, reauthToken, beforeRequest, onUnauthorized } = options;

  const http: KyInstance = ky.create({
    credentials: "include",
    throwHttpErrors: false,
    hooks: {
      beforeRequest: [
        async () => {
          await beforeRequest?.();
        },
      ],
      afterResponse: [
        async ({ response, retryCount }) => {
          if (
            response.status === 401 &&
            retryCount === 0 &&
            onUnauthorized &&
            (await onUnauthorized())
          ) {
            return ky.retry();
          }
        },
      ],
    },
  });

  const send = async (
    method: string,
    url: string,
    body: unknown,
    idempotencyKey: string | undefined,
    reauth: string | undefined,
  ) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    if (reauth) headers["X-Reauth-Token"] = reauth;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    if (method !== "get") {
      const csrf = csrfToken();
      if (csrf) headers["X-CSRF-Token"] = csrf;
    }
    const opts: Options = {
      method: method.toUpperCase(),
      headers,
      ...(body === undefined ? {} : { json: body }),
    };
    const res = await http(url, opts);
    const data = (await res.json().catch(() => null)) as Partial<ApiError> | null;
    if (!res.ok) {
      throw new ApiRequestError({
        status: res.status,
        code: data?.code ?? "UNKNOWN",
        details: data?.details ?? {},
        message: data?.message ?? `request failed: ${res.status}`,
      });
    }
    return data as unknown;
  };

  type SendOpts = {
    path?: Record<string, unknown>;
    query?: Record<string, unknown>;
    reauthToken?: string;
    idempotencyKey?: string;
  };

  const request = (method: Method, path: PathKey, body: unknown, opts?: SendOpts) => {
    const idempotencyKey = IDEMPOTENT_METHODS.has(method)
      ? (opts?.idempotencyKey ?? crypto.randomUUID())
      : undefined;
    const url = buildUrl(baseUrl, path as string, opts);
    return send(method, url, body, idempotencyKey, opts?.reauthToken ?? reauthToken ?? undefined);
  };

  const rawRequest = <T = unknown>(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    body?: unknown,
    opts?: {
      path?: Record<string, unknown>;
      query?: Record<string, unknown>;
      reauthToken?: string;
      idempotencyKey?: string;
    },
  ): Promise<T> => {
    const idempotencyKey = IDEMPOTENT_METHODS.has(method)
      ? (opts?.idempotencyKey ?? crypto.randomUUID())
      : undefined;
    return send(
      method,
      buildUrl(baseUrl, path, opts),
      body,
      idempotencyKey,
      opts?.reauthToken ?? reauthToken ?? undefined,
    ) as Promise<T>;
  };

  return {
    get: <P extends PathsWith<"get">>(path: P, opts?: RequestOptions<P, "get">) =>
      request("get", path, undefined, opts as SendOpts | undefined) as Promise<
        ResponseBody<P, "get">
      >,
    post: <P extends PathsWith<"post">>(
      path: P,
      body?: RequestBody<P, "post">,
      opts?: RequestOptions<P, "post">,
    ) =>
      request("post", path, body, opts as SendOpts | undefined) as Promise<ResponseBody<P, "post">>,
    put: <P extends PathsWith<"put">>(
      path: P,
      body?: RequestBody<P, "put">,
      opts?: RequestOptions<P, "put">,
    ) =>
      request("put", path, body, opts as SendOpts | undefined) as Promise<ResponseBody<P, "put">>,
    patch: <P extends PathsWith<"patch">>(
      path: P,
      body?: RequestBody<P, "patch">,
      opts?: RequestOptions<P, "patch">,
    ) =>
      request("patch", path, body, opts as SendOpts | undefined) as Promise<
        ResponseBody<P, "patch">
      >,
    delete: <P extends PathsWith<"delete">>(path: P, opts?: RequestOptions<P, "delete">) =>
      request("delete", path, undefined, opts as SendOpts | undefined) as Promise<
        ResponseBody<P, "delete">
      >,
    request: rawRequest,
  };
};

export type ApiClient = ReturnType<typeof createClient>;
