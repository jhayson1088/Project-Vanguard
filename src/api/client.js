export const MOCK_MODE = import.meta.env.VITE_MOCK_MODE === "true";
const baseURL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api"
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
let csrfToken;
export async function request(
  path,
  { method = "GET", body, skipSessionEvent = false, ...options } = {},
) {
  if (!["GET", "HEAD", "OPTIONS"].includes(method) && !csrfToken) {
    const response = await fetch(`${baseURL}/auth/csrf/`, {
      credentials: "include",
    });
    if (!response.ok)
      throw new ApiError(
        "Could not initialize a secure session. Please try again.",
        response.status,
      );
    const data = await response.json();
    csrfToken = data.csrfToken;
  }
  const token =
    csrfToken ||
    document.cookie
      .split("; ")
      .find((c) => c.startsWith("csrftoken="))
      ?.split("=")
      .slice(1)
      .join("=");
  const isForm = body instanceof FormData;
  const response = await fetch(`${baseURL}${path}`, {
    method,
    credentials: "include",
    ...options,
    headers: {
      ...(!isForm && body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { "X-CSRFToken": decodeURIComponent(token) } : {}),
      ...options.headers,
    },
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });
  const data =
    response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    if (data?.code === "csrf_failed" || data?.code === "session_expired") csrfToken = undefined;
    if (
      !skipSessionEvent &&
      (data?.code === "session_expired" || response.status === 401 ||
        (response.status === 403 &&
          JSON.stringify(data).includes("Authentication credentials")))
    )
      window.dispatchEvent(new Event("session-expired"));
    const fields = data?.errors || data;
    const fieldMessage =
      fields && typeof fields === "object" && !Array.isArray(fields)
        ? Object.entries(fields)
            .map(
              ([key, value]) =>
                `${key}: ${Array.isArray(value) ? value.join(" ") : String(value)}`,
            )
            .join(" ")
        : "";
    throw new ApiError(
      data?.detail ||
        fieldMessage ||
        (typeof fields === "string"
          ? fields
          : Array.isArray(fields)
            ? fields.join(" ")
            : fields?.detail) ||
        (response.status === 403
          ? "You do not have permission to make this change."
          : "We couldn’t complete that request. Please try again."),
      response.status,
      fields,
    );
  }
  if (data?.csrfToken) csrfToken = data.csrfToken;
  if (path === "/auth/logout/") csrfToken = undefined;
  return data;
}
