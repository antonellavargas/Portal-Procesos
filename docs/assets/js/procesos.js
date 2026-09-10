let currentUser = null;
let cache = [];
let areas = [];

function closeForm() { modal.hidden = true; }

function fillAreas() {
  const options = areas.map((a) => `<option value="${a.id}">${esc(a.codigo)} · ${esc(a.nombre)}</option>`).join("");
  area_id.innerHTML = '<option value="">Seleccione...</option>' + options;
  areaFilter.innerHTML = '<option value="">Todas las áreas</option>' + options;
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

async function meta() {
  const data = await apiGet("/api/procesos/meta");
  areas = data.areas;
  fillAreas();
}

async function load() {
  setLoading("rows", 8, "Cargando procesos...");
  try {
    const params = new URLSearchParams();
    if (q.value) params.set("q", q.value);
    if (areaFilter.value) params.set("area_id", areaFilter.value);
    if (critico.value) params.set("critico", critico.value);
    const data = await apiGet(`/api/procesos?${params}`);
    cache = data.procesos;
    rows.innerHTML = cache.length
      ? cache.map((p) => `
        <tr>
          <td><b>${esc(p.codigo)}</b></td>
          <td>${esc(p.nombre)}</td>
          <td>${esc(p.area?.nombre || "-")}</td>
          <td>${esc(p.tipo || "-")}</td>
          <td>${esc(p.responsable || p.persona_responsable || "-")}</td>
          <td>${p.es_critico ? '<span class="badge-red">Crítico</span>' : "No"}</td>
          <td>${p.total_documentos}</td>
          <td>${currentUser.rol === "administrador"
            ? `<button class="btn btn-secondary btn-sm" onclick="openForm(cache.find(x=>x.id===${p.id}))">Editar</button>
               <button class="btn btn-danger btn-sm" onclick="removeP(${p.id})">Eliminar</button>`
            : '<span class="muted">Consulta</span>'}</td>
        </tr>`).join("")
      : '<tr><td colspan="8" class="empty">No hay procesos</td></tr>';
  } catch (error) {
    rows.innerHTML = '<tr><td colspan="8" class="empty">No se pudo cargar la información</td></tr>';
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
