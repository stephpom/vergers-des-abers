const BASE = import.meta.env.VITE_API_URL || "";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    if (opts.body instanceof FormData) {
      body = opts.body;
    } else {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(opts.body);
    }
  }
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers,
    body,
    credentials: "include",
  });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, data?.error || res.statusText, data?.details);
  }
  return data as T;
}
