async function login(username, password) {
  const data = await apiPost("/api/auth/login", { username, password });
  setAccessToken(data.access_token);
  return data.usuario;
}

async function getCurrentUser() {
  const data = await apiGet("/api/auth/me");
  return data.usuario;
}

function logout() {
  clearAccessToken();
  window.location.href = "login.html";
}

async function requireAuth({ adminOnly = false } = {}) {
  try {
    const usuario = await getCurrentUser();
    if (adminOnly && usuario.rol !== "administrador") {
      window.location.href = "dashboard.html";
      return null;
    }
    return usuario;
  } catch (_) {
    clearAccessToken();
    window.location.href = "login.html";
    return null;
  }
}
