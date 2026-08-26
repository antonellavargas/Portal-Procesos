async function apiGet(path) {
  const response = await fetch(`${window.APP_CONFIG.API_URL}${path}`);

  if (!response.ok) {
    throw new Error(`Error HTTP ${response.status}`);
  }

  return response.json();
}
