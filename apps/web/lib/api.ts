const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else if (typeof window !== "undefined") {
    const storedDosenToken = localStorage.getItem("fisgrade_dosen_token");
    const storedStudentToken = localStorage.getItem("fisgrade_student_token");
    if (endpoint.startsWith("/api/me") || endpoint.startsWith("/api/submissions") || endpoint.startsWith("/api/contradictions") || endpoint.startsWith("/api/surveys")) {
      if (storedStudentToken) headers.set("Authorization", `Bearer ${storedStudentToken}`);
    } else if (storedDosenToken) {
      headers.set("Authorization", `Bearer ${storedDosenToken}`);
    }
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = `Galat (${res.status})`;
    try {
      const errJson = await res.json();
      if (typeof errJson.detail === "string") {
        errMessage = errJson.detail;
      } else if (errJson.detail && errJson.detail.pesan) {
        errMessage = errJson.detail.pesan;
      } else if (errJson.pesan) {
        errMessage = errJson.pesan;
      }
    } catch {}
    throw new Error(errMessage);
  }

  return res.json();
}
