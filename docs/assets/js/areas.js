let currentUser = null;
let cache = [];

function closeForm() { modal.hidden = true; }

function openForm(area = null) {
  id.value = area?.id || "";
  codigo.value = area?.codigo || "";
  nombre.value = area?.nombre || "";
  responsable_area.value = area?.responsable_area || "";
  nombre_personal.value = area?.nombre_personal || "";
  descripcion.value = area?.descripcion || "";
  formTitle.textContent = area ? "Editar área" : "Nueva área";
  modal.hidden = false;
}

async function load() {
  setLoading("rows", 6, "Cargando áreas...");
  try {
    const data = await apiGet(`/api/areas?q=${encodeURIComponent(q.value)}`);
    cache = data.areas;
    rows.innerHTML = cache.length
      ? cache.map((area) => `
        <tr>
          <td><b>${esc(area.codigo)}</b></td>
          <td>${esc(area.nombre)}</td>
          <td>${esc(area.responsable_area || "-")}</td>
          <td>${esc(area.nombre_personal || "-")}</td>
          <td>${area.total_procesos}</td>
          ${currentUser.rol === "administrador"
            ? `<td class="admin-only-column"><button class="btn btn-secondary btn-sm" onclick="openForm(cache.find(x=>x.id===${area.id}))">Editar</button>
               <button class="btn btn-danger btn-sm" onclick="removeArea(${area.id})">Eliminar</button></td>`
            : ''}
        </tr>`).join("")
      : `<tr><td colspan="${currentUser?.rol === 'administrador' ? 6 : 5}" class="empty">No hay áreas</td></tr>`;
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="${currentUser?.rol === 'administrador' ? 6 : 5}" class="empty">No se pudo cargar la información</td></tr>`;
    showMsg(error.message, "error");
  }
}

async function removeArea(areaId) {
  if (!confirm("¿Eliminar esta área?")) return;
  try {
    await apiDelete(`/api/areas/${areaId}`);
    showMsg("Área eliminada");
    await load();
  } catch (error) {
    showMsg(error.message, "error");
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const body = {
    codigo: codigo.value,
    nombre: nombre.value,
    responsable_area: responsable_area.value,
    nombre_personal: nombre_personal.value,
    descripcion: descripcion.value,
  };
  try {
    id.value ? await apiPut(`/api/areas/${id.value}`, body) : await apiPost("/api/areas", body);
    closeForm();
    showMsg("Área guardada");
    await load();
  } catch (error) {
    showMsg(error.message, "error");
  }
});

(async () => {
  currentUser = await initLayout("areas");
  if (currentUser) await load();
})();
