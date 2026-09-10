(async () => {
  if (!await initLayout("dashboard")) return;
  setLoading("areasBars", 1, "Cargando resumen...");
  setLoading("criticos", 1, "Cargando procesos críticos...");
  setLoading("recentes", 5, "Cargando procesos recientes...");
  try {
    const data = await apiGet("/api/dashboard");
    kAreas.textContent = data.kpis.areas;
    kProcesos.textContent = data.kpis.procesos;
    kCriticos.textContent = `${data.kpis.criticos} (${data.kpis.porcentaje_criticos}%)`;
    kDocumentos.textContent = data.kpis.documentos;

    const max = Math.max(1, ...data.procesos_por_area.map((x) => x.cantidad));
    areasBars.innerHTML = data.procesos_por_area.length
      ? data.procesos_por_area.map((x) => `<div class="bar-row"><span>${esc(x.area)}</span><div class="bar-track"><div class="bar-fill" style="width:${x.cantidad / max * 100}%"></div></div><b>${x.cantidad}</b></div>`).join("")
      : '<div class="empty">Sin datos</div>';

    criticos.innerHTML = data.criticos_recientes.length
      ? data.criticos_recientes.map((x) => `<p><span class="badge-red">Crítico</span> <b>${esc(x.codigo)}</b> · ${esc(x.nombre)}<br><small class="muted">${esc(x.area)}</small></p>`).join("")
      : '<div class="empty">No hay procesos críticos</div>';

    recientes.innerHTML = data.procesos_recientes.length
      ? data.procesos_recientes.map((x) => `<tr><td>${esc(x.codigo)}</td><td>${esc(x.nombre)}</td><td>${esc(x.area)}</td><td>${esc(x.tipo || "-")}</td><td>${x.es_critico ? '<span class="badge-red">Sí</span>' : "No"}</td></tr>`).join("")
      : '<tr><td colspan="5" class="empty">Sin datos</td></tr>';
  } catch (error) {
    showMsg(error.message, "error");
  }
})();
