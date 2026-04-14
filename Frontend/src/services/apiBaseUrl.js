function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);

if (!API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set. Frontend API requests will fail until it is configured.");
}

export { API_BASE_URL };
