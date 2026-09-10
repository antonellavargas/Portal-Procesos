let currentUser = null;
let cache = [];
let areas = [];
let tipos = [];

function closeForm() { modal.hidden = true; }

function fillAreas() {
  const areaOptions = areas.map((a) => `<option value="${a.id}">${esc(a.codigo)} · ${esc(a.nombre)}</option>`).join("");
  area_id.innerHTML = '<option value="">Seleccione...</option>' + areaOptions;
  areaFilter.innerHTML = '<option value="">Todas las áreas</option>' + areaOptions;
  if (typeof tipoFilter !== "undefined") {
    tipoFilter.innerHTML = '<option value="">Todos los tipos</option>' + tipos.map((t) => `<option>${esc(t)}</option>`).join("");
  }
}

function openForm(proceso = null) {
  id.value = proceso?.id || "";
  codigo.value = proceso?.codigo || "";
  area_id.value = proceso?.area_id || "";
  nombre.value = proceso?.nombre || "";
  tipo.value = proceso?.tipo || "";
  responsable.value = proceso?.responsable || "";
  persona_responsable.value = proceso?.persona_responsable || "";
  objetivo.value = proceso?.objetivo || "";
  areas_relacionadas.value = proceso?.areas_relacionadas || "";
  fecha_actualizacion.value = proceso?.fecha_actualizacion || "";
  es_critico.checked = !!proceso?.es_critico;
  formTitle.textContent = proceso ? "Editar proceso" : "Nuevo proceso";
  modal.hidden = false;
}

function updateStats() {
  procCount.textContent = cache.length;
  procCriticos.textContent = cache.filter((x) => x.es_critico).length;
  procAreas.textContent = new Set(cache.map((x) => x.area?.nombre).filter(Boolean)).size;
  procDocs.textContent = cache.reduce((acc, x) => acc + Number(x.total_documentos || 0), 0);
}

async function meta() {
  const data = await apiGet("/api/procesos/meta");
  areas = data.areas || [];
  tipos = data.tipos || [];
  fillAreas();
}

async function load() {
  setLoading("rows", 8, "Cargando procesos...");
  try {
    const params = new URLSearchParams();
    if (q.value) params.set("q", q.value);
    if (areaFilter.value) params.set("area_id", areaFilter.value);
    if (typeof tipoFilter !== "undefined" && tipoFilter.value) params.set("tipo", tipoFilter.value);
    if (critico.value) params.set("critico", critico.value);
    const data = await apiGet(`/api/procesos?${params}`);
    cache = data.procesos;
    updateStats();
    rows.innerHTML = cache.length
      ? cache.map((p) => `
        <tr>
          <td><span class="badge">${esc(p.codigo)}</span></td>
          <td>
            <div class="cell-title">
              <strong>${esc(p.nombre)}</strong>
              <span class="cell-sub">${esc(p.objetivo || "Sin objetivo registrado")}</span>
            </div>
          </td>
          <td>${esc(p.area?.nombre || "-")}</td>
          <td>${p.tipo ? `<span class="tag tag-dark">${esc(p.tipo)}</span>` : '<span class="muted">-</span>'}</td>
          <td>${esc(p.responsable || p.persona_responsable || "-")}</td>
          <td>${p.es_critico ? '<span class="badge-red">Crítico</span>' : '<span class="badge">No crítico</span>'}</td>
          <td><span class="badge">${Number(p.total_documentos || 0)} docs.</span></td>
          ${currentUser.rol === "administrador"
            ? `<td class="admin-only-column"><div class="action-row"><button class="btn btn-secondary btn-sm" onclick="openForm(cache.find(x=>x.id===${p.id}))">Editar</button>
               <button class="btn btn-danger btn-sm" onclick="removeP(${p.id})">Eliminar</button></div></td>`
            : ''}
        </tr>`).join("")
      : `<tr><td colspan="${currentUser?.rol === 'administrador' ? 8 : 7}" class="empty">No hay procesos para mostrar.</td></tr>`;
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="${currentUser?.rol === 'administrador' ? 8 : 7}" class="empty">No se pudo cargar la información.</td></tr>`;
    showMsg(error.message, "error");
  }
}

async function removeP(processId) {
  if (!confirm("¿Eliminar el proceso y sus documentos asociados?")) return;
  try {
    await apiDelete(`/api/procesos/${processId}`);
    showMsg("Proceso eliminado");
    await load();
  } catch (error) {
    showMsg(error.message, "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    codigo: codigo.value,
    area_id: area_id.value,
    nombre: nombre.value,
    tipo: tipo.value,
    responsable: responsable.value,
    persona_responsable: persona_responsable.value,
    objetivo: objetivo.value,
    es_critico: es_critico.checked,
    areas_relacionadas: areas_relacionadas.value,
    fecha_actualizacion: fecha_actualizacion.value,
  };
  try {
    id.value ? await apiPut(`/api/procesos/${id.value}`, body) : await apiPost("/api/procesos", body);
    closeForm();
    showMsg("Proceso guardado");
    await load();
  } catch (error) {
    showMsg(error.message, "error");
  }
});

(async () => {
  currentUser = await initLayout("procesos");
  if (!currentUser) return;
  setLoading("rows", 8, "Cargando procesos...");
  try {
    await Promise.all([meta(), load()]);
  } catch (error) {
    showMsg(error.message, "error");
  }
})();
