const TOKEN_KEY = "portal_procesos_access_token";

function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

function setAccessToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

function clearAccessToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");

  const token = getAccessToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${window.APP_CONFIG.API_URL}${path}`, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await response.json();
  } catch (_) {
    data = {};
  }

  if (!response.ok) {
    const error = new Error(data.error || `Error HTTP ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

async function apiGet(path) {
  return apiFetch(path);
}

async function apiPost(path, body) {
  return apiFetch(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
