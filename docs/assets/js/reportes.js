function bars(el,data){const max=Math.max(1,...data.map(x=>x.cantidad));el.innerHTML=data.length?data.map(x=>`<div class="bar-row"><span>${esc(x.nombre)}</span><div class="bar-track"><div class="bar-fill" style="width:${x.cantidad/max*100}%"></div></div><b>${x.cantidad}</b></div>`).join(''):'<div class="empty">Sin datos</div>'}(async()=>{if(!await initLayout('reportes'))return;try{const r=await apiGet('/api/reportes');a.textContent=r.totales.areas;p.textContent=r.totales.procesos;c.textContent=r.totales.criticos;d.textContent=r.totales.documentos;bars(pa,r.procesos_por_area);bars(dt,r.documentos_por_tipo);bars(pt,r.procesos_por_tipo)}catch(e){showMsg(e.message,'error')}})();

document.addEventListener("DOMContentLoaded", async () => {
    await cargarReportes();
});