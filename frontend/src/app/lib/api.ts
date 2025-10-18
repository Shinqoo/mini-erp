// lib/api.ts
export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "",
  };

  const res = await fetch(`http://localhost:3000${url}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token expired or invalid
    localStorage.removeItem("token");
    window.location.href = "/auth/login";
  }

  return res;
}
