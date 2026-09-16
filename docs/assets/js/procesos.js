let currentUser = null, cache = [], areas = [];

function closeForm() { modal.hidden = true; }

function fillAreas() {
  const opts = areas.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join("");
  area_id.innerHTML = '<option value="">Seleccione...</option>' + opts;
  areaFilter.innerHTML = '<option value="">Todas las áreas</option>' + opts;
}

function openForm(p = null) {
  id.value = p?.id || "";
  codigo.value = p?.codigo || "";
  area_id.value = p?.area_id || "";
  nombre.value = p?.nombre || "";
  tipo.value = p?.tipo || "";
  estado.value = p?.estado || "Activo";
  responsable.value = p?.responsable || "";
  persona_responsable.value = p?.persona_responsable || "";
  objetivo.value = p?.objetivo || "";
  areas_relacionadas.value = p?.areas_relacionadas || "";
  fecha_actualizacion.value = p?.fecha_actualizacion || "";
  es_critico.checked = !!p?.es_critico;
  formTitle.textContent = p ? "Editar proceso" : "Nuevo proceso";
  modal.hidden = false;
}

async function meta() {
  const d = await apiGet('/api/procesos/meta');
  areas = d.areas || [];
  fillAreas();
}

function safeUrl(value) {
  if (!value) return null;
  let url = String(value).trim();
  if (/^www\./i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : null;
  } catch (_) {
    return null;
  }
}

function documentLinks(proceso) {
  const documentos = (proceso.documentos || []).filter(d => d && d.estado !== 'Inactivo');
  const groups = documentos.map((doc) => {
    const links = [
      ["Abrir", doc.enlace_doc, "doc"],
      ["Flujo 1", doc.enlace_fluj, "flow"],
      ["Flujo 2", doc.enlace_fluj1, "flow"],
      ["Flujo 3", doc.enlace_fluj2, "flow"],
      ["Flujo 4", doc.enlace_fluj3, "flow"],
    ].map(([label, url, type]) => [label, safeUrl(url), type]).filter(([, url]) => url);

    if (!links.length) return "";
    return `<div class="process-file-group">
      <div class="process-file-name"><span class="tag tag-doc">${esc(doc.tipo || 'Documento')}</span><strong>${esc(doc.nombre || 'Archivo')}</strong></div>
      <div class="doc-links">${links.map(([label, url, type]) =>
        `<a class="doc-link ${type === 'doc' ? 'primary' : ''}" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${type === 'doc' ? '↗' : '⌁'} ${esc(label)}</a>`
      ).join('')}</div>
    </div>`;
  }).filter(Boolean);

  return groups.length ? `<div class="process-files">${groups.join('')}</div>` : '<span class="muted">Sin archivos cargados</span>';
}

function estadoVisual(x) {
  return x.es_critico
    ? '<span class="status-critical">Crítico</span>'
    : '<span class="status-active">Activo</span>';
}

async function load() {
  setLoading('rows', 5, 'Cargando procesos...');
  try {
    const p = new URLSearchParams();
    if (q.value) p.set('q', q.value);
    if (areaFilter.value) p.set('area_id', areaFilter.value);
    if (estadoFilter.value) p.set('estado', estadoFilter.value);
    const d = await apiGet(`/api/procesos?${p}`);
    cache = d.procesos || [];
    rows.innerHTML = cache.length ? cache.map(x => `<tr>
      <td><div class="cell-title"><strong>${esc(x.nombre)}</strong><span class="cell-sub">${esc(x.codigo)}</span></div></td>
      <td>${esc(x.area?.nombre || '-')}</td>
      <td>${estadoVisual(x)}</td>
      <td class="files-cell">${documentLinks(x)}</td>
      ${currentUser.rol === 'administrador' ? `<td class="admin-only-column"><div class="action-row"><button class="btn btn-secondary btn-sm" onclick="openForm(cache.find(y=>y.id===${x.id}))">Editar</button><button class="btn btn-danger btn-sm" onclick="removeP(${x.id})">Eliminar</button></div></td>` : ''}
    </tr>`).join('') : `<tr><td colspan="${currentUser?.rol === 'administrador' ? 5 : 4}" class="empty">No hay procesos para mostrar.</td></tr>`;
  } catch (e) {
    rows.innerHTML = `<tr><td colspan="${currentUser?.rol === 'administrador' ? 5 : 4}" class="empty">No se pudo cargar la información.</td></tr>`;
    showMsg(e.message, 'error');
  }
}

async function removeP(pid) {
  if (!confirm('¿Eliminar este proceso?')) return;
  try {
    await apiDelete(`/api/procesos/${pid}`);
    showMsg('Proceso eliminado');
    await load();
  } catch (e) { showMsg(e.message, 'error'); }
}

form.addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    codigo: codigo.value, area_id: area_id.value, nombre: nombre.value, tipo: tipo.value,
    estado: estado.value, responsable: responsable.value, persona_responsable: persona_responsable.value,
    objetivo: objetivo.value, es_critico: es_critico.checked, areas_relacionadas: areas_relacionadas.value,
    fecha_actualizacion: fecha_actualizacion.value
  };
  try {
    id.value ? await apiPut(`/api/procesos/${id.value}`, body) : await apiPost('/api/procesos', body);
    closeForm(); showMsg('Proceso guardado'); await load();
  } catch (e) { showMsg(e.message, 'error'); }
});

(async () => {
  currentUser = await initLayout('procesos');
  if (!currentUser) return;
  await Promise.all([meta(), load()]);
})();
