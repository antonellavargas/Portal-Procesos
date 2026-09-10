const SIDEBAR_KEY = "portal_procesos_sidebar_collapsed";

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[c]));
}

function showMsg(text, type = "ok") {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text;
  el.className = `message ${type}`;
  el.hidden = false;
  setTimeout(() => (el.hidden = true), 3500);
}

function setLoading(targetId, columns = 1, text = "Cargando información...") {
  const el = document.getElementById(targetId);
  if (!el) return;
  if (el.tagName === "TBODY") {
    el.innerHTML = `<tr><td colspan="${columns}" class="loading-cell"><span class="spinner"></span>${esc(text)}</td></tr>`;
  } else {
    el.innerHTML = `<div class="loading-block"><span class="spinner"></span>${esc(text)}</div>`;
  }
}

function applySidebarState(collapsed) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  const sidebar = document.querySelector(".app-sidebar");
  if (sidebar) sidebar.classList.toggle("collapsed", collapsed);
  const toggle = document.getElementById("sidebarToggle");
  if (toggle) {
    toggle.setAttribute("aria-label", collapsed ? "Expandir menú" : "Contraer menú");
    toggle.title = collapsed ? "Expandir menú" : "Contraer menú";
    toggle.textContent = collapsed ? "›" : "‹";
  }
}

function toggleSidebar() {
  const collapsed = !document.body.classList.contains("sidebar-collapsed");
  localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  applySidebarState(collapsed);
}

async function initLayout(active) {
  const user = await requireAuth();
  if (!user) return null;

  const adminLink = user.rol === "administrador"
    ? `<a href="usuarios.html" data-key="usuarios" title="Usuarios"><span class="nav-icon">👥</span><span class="nav-label">Usuarios</span></a>`
    : "";

  document.body.insertAdjacentHTML(
    "afterbegin",
    `<aside class="app-sidebar">
      <div class="sidebar-top">
        <div class="brand">
          <img src="assets/img/logo-refax.png" alt="REFAX">
          <div class="brand-copy"><b>Gestión de Procesos</b><small>REFAX Perú</small></div>
        </div>
        <button id="sidebarToggle" class="sidebar-toggle" type="button" onclick="toggleSidebar()" aria-label="Contraer menú" title="Contraer menú">‹</button>
      </div>
      <nav>
        <a href="dashboard.html" data-key="dashboard" title="Dashboard"><span class="nav-icon">⌂</span><span class="nav-label">Dashboard</span></a>
        <a href="areas.html" data-key="areas" title="Áreas"><span class="nav-icon">▦</span><span class="nav-label">Áreas</span></a>
        <a href="procesos.html" data-key="procesos" title="Procesos"><span class="nav-icon">⚙</span><span class="nav-label">Procesos</span></a>
        <a href="documentos.html" data-key="documentos" title="Documentos"><span class="nav-icon">▤</span><span class="nav-label">Documentos</span></a>
        <a href="reportes.html" data-key="reportes" title="Reportes"><span class="nav-icon">▥</span><span class="nav-label">Reportes</span></a>
        ${adminLink}
      </nav>
      <div class="side-user">
        <div class="side-user-icon">${esc((user.nombre || user.username || "U").charAt(0).toUpperCase())}</div>
        <div class="side-user-copy"><b>${esc(user.nombre)}</b><small>${esc(user.rol)}</small></div>
        <button class="logout-btn" onclick="logout()" title="Cerrar sesión"><span>↪</span><span class="nav-label">Cerrar sesión</span></button>
      </div>
    </aside>`
  );

  document.body.classList.add("with-sidebar");
  document.querySelector(`[data-key="${active}"]`)?.classList.add("active");
  document.querySelectorAll(".admin-only").forEach((x) => (x.hidden = user.rol !== "administrador"));

  applySidebarState(localStorage.getItem(SIDEBAR_KEY) === "1");
  return user;
}
