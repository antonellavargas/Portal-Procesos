window.APP_CONFIG = {
  API_URL: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://127.0.0.1:8000"
    : "https://TU-APP-SERVICE.azurewebsites.net"
};
