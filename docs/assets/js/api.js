const TOKEN_KEY = "portal_procesos_access_token";
function getAccessToken(){return sessionStorage.getItem(TOKEN_KEY)}
function setAccessToken(token){sessionStorage.setItem(TOKEN_KEY,token)}
function clearAccessToken(){sessionStorage.removeItem(TOKEN_KEY)}
async function apiFetch(path,options={}){const headers=new Headers(options.headers||{});headers.set('Content-Type','application/json');const token=getAccessToken();if(token)headers.set('Authorization',`Bearer ${token}`);const r=await fetch(`${window.APP_CONFIG.API_URL}${path}`,{...options,headers});let data={};try{data=await r.json()}catch{}if(!r.ok){const e=new Error(data.error||`Error HTTP ${r.status}`);e.status=r.status;e.data=data;throw e}return data}
const apiGet=(p)=>apiFetch(p); const apiPost=(p,b)=>apiFetch(p,{method:'POST',body:JSON.stringify(b)}); const apiPut=(p,b)=>apiFetch(p,{method:'PUT',body:JSON.stringify(b)}); const apiDelete=(p)=>apiFetch(p,{method:'DELETE'});
