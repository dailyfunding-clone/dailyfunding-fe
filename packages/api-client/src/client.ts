import { Data, Effect } from "effect";
import ky, { type KyInstance, type Options } from "ky";
import type { paths } from "./schema";

export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
  status: number;
};

export class ApiRequestError extends Data.TaggedError("ApiRequestError")<{
  status: number;
  code: string;
  details: Record<string, unknown>;
  message?: string;
}> {}

export type ApiClientOptions = {
  baseUrl?: string;
  accessToken?: string | null;
  reauthToken?: string | null;
  beforeRequest?: () => Promise<void>;
  onUnauthorized?: () => Promise<boolean>;
};

type PathKey = keyof paths;
type PathMethod<P extends PathKey> = keyof paths[P] & string;

type RequestBody<
  P extends PathKey,
  M extends PathMethod<P>,
> = paths[P][M] extends { requestBody: { content: { "application/json": infer B } } }
  ? B
  : never;

type ResponseBody<
  P extends PathKey,
  M extends PathMethod<P>,
> = paths[P][M] extends { responses: infer R }
  ? R extends { 200: { content: { "application/json": infer B } } }
    ? B
    : R extends { 201: { content: { "application/json": infer B } } }
      ? B
      : R extends { 202: { content: { "application/json": infer B } } }
        ? B
        : unknown
  : unknown;

type PathParams<P extends PathKey, M extends PathMethod<P>> = paths[P][M] extends {
  parameters: { path?: infer PP };
}
  ? PP
  : never;

type QueryParams<P extends PathKey, M extends PathMethod<P>> = paths[P][M] extends {
  parameters: { query?: infer QP };
}
  ? QP
  : never;

type RequestOptions<P extends PathKey, M extends PathMethod<P>> = (keyof PathParams<
  P,
  M
> extends never
  ? { path?: never }
  : { path: PathParams<P, M> }) &
  (keyof QueryParams<P, M> extends never
    ? { query?: Record<string, unknown> }
    : { query?: QueryParams<P, M> }) & {
    reauthToken?: string;
    idempotencyKey?: string;
  };

const IDEMPOTENT_METHODS = new Set(["post", "put", "patch", "delete"]);

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

  const send = (
    method: string,
    url: string,
    body: unknown,
    idempotencyKey: string | undefined,
    reauth: string | undefined
  ) => {
    const headers: Record<string, string> = {};
    if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
    if (reauth) headers["X-Reauth-Token"] = reauth;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;
    const opts: Options = {
      method: method.toUpperCase(),
      headers,
      ...(body === undefined ? {} : { json: body }),
    };
    const program = Effect.tryPromise({
      try: async () => {
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
      },
      catch: (e) => e as Error,
    });
    return Effect.runPromise(program);
  };

  const request = async <P extends PathKey, M extends PathMethod<P>>(
    method: M,
    path: P,
    body?: RequestBody<P, M>,
    opts?: RequestOptions<P, M>
  ): Promise<ResponseBody<P, M>> => {
    const idempotencyKey = IDEMPOTENT_METHODS.has(method.toLowerCase())
      ? (opts?.idempotencyKey ?? crypto.randomUUID())
      : undefined;
    let url = `${baseUrl}${path as string}`;
    for (const [k, v] of Object.entries(opts?.path ?? {})) {
      url = url.replace(`{${k}}`, encodeURIComponent(String(v)));
    }
    const query = new URLSearchParams();
    for (const [k, v] of Object.entries(opts?.query ?? {})) {
      if (v !== undefined && v !== null) query.set(k, String(v));
    }
    const qs = query.toString();
    if (qs) url += `?${qs}`;
    return send(
      method,
      url,
      body,
      idempotencyKey,
      opts?.reauthToken ?? reauthToken ?? undefined
    ) as Promise<ResponseBody<P, M>>;
  };

  const rawRequest = <T = unknown>(
    method: "get" | "post" | "put" | "patch" | "delete",
    path: string,
    body?: unknown,
    opts?: { reauthToken?: string; idempotencyKey?: string }
  ): Promise<T> => {
    const idempotencyKey = IDEMPOTENT_METHODS.has(method)
      ? (opts?.idempotencyKey ?? crypto.randomUUID())
      : undefined;
    return send(
      method,
      `${baseUrl}${path}`,
      body,
      idempotencyKey,
      opts?.reauthToken ?? reauthToken ?? undefined
    ) as Promise<T>;
  };

  return {
    get: <P extends PathKey>(path: P, opts?: RequestOptions<P, "get">) =>
      request("get" as PathMethod<P>, path, undefined, opts),
    post: <P extends PathKey>(
      path: P,
      body?: RequestBody<P, "post">,
      opts?: RequestOptions<P, "post">
    ) => request("post" as PathMethod<P>, path, body, opts),
    put: <P extends PathKey>(
      path: P,
      body?: RequestBody<P, "put">,
      opts?: RequestOptions<P, "put">
    ) => request("put" as PathMethod<P>, path, body, opts),
    patch: <P extends PathKey>(
      path: P,
      body?: RequestBody<P, "patch">,
      opts?: RequestOptions<P, "patch">
    ) => request("patch" as PathMethod<P>, path, body, opts),
    delete: <P extends PathKey>(path: P, opts?: RequestOptions<P, "delete">) =>
      request("delete" as PathMethod<P>, path, undefined, opts),
    request: rawRequest,
  };
};

export type ApiClient = ReturnType<typeof createClient>;
