let csrfToken: string | undefined;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export const setCsrfToken = (nextToken: string | null | undefined) => {
  csrfToken = nextToken ?? undefined;
};

type ApiRequestOptions = Omit<RequestInit, "body"> & { body?: unknown };

const apiRequest = async <T>(
  path: string,
  init?: ApiRequestOptions,
): Promise<T> => {
  const { body, ...restInit } = init ?? {};
  const headers = new Headers(init?.headers);

  if (body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const method = init?.method?.toUpperCase() ?? "GET";

  if (method !== "GET" && method !== "HEAD" && csrfToken) {
    headers.set("x-csrf-token", csrfToken);
  }

  const requestInit: RequestInit = {
    ...restInit,
    headers,
    credentials: "include",
  };

  if (body !== undefined) {
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(path, requestInit);

  const contentType = response.headers.get("content-type");
  const payload =
    contentType?.includes("application/json")
      ? await response.json()
      : response.status === 204
        ? undefined
        : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "message" in payload
        ? String(payload.message)
        : "요청 처리에 실패했습니다.";
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
};

export const apiGet = <T>(path: string) => apiRequest<T>(path);

export const apiPost = <T>(path: string, body?: unknown) =>
  apiRequest<T>(path, {
    method: "POST",
    ...(body !== undefined ? { body } : {}),
  });
