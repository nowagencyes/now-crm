const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const schemas = {
  clientes: [
    ["nombre","Nombre","text"],["empresa","Empresa","text"],["telefono","Teléfono","text"],["email","Email","email"],["instagram","Instagram","text"],["servicio","Servicio","text"],["estado","Estado","select",["Activo","Potencial","Pausado","Finalizado"]]
  ],
  facturas: [
    ["numero","Nº factura","text"],["cliente","Cliente","text"],["concepto","Concepto","text"],["base","Base €","number"],["igic","IGIC %","number"],["estado","Estado","select",["Pendiente","Pagado","Vencido","Anulada"]]
  ],
  pagos: [
    ["cliente","Cliente","text"],["servicio","Servicio","text"],["importe","Importe €","number"],["fecha","Fecha","date"],["estado","Estado","select",["Pendiente","Pagado","Vencido"]]
  ],
  proyectos: [
    ["proyecto","Proyecto","text"],["cliente","Cliente","text"],["tipo","Tipo","text"],["fecha","Fecha","date"],["estado","Estado","select",["Briefing","Planificado","Grabando","Editando","Entregado","Finalizado"]],["notas","Notas","textarea"]
  ],
  rrss: [
    ["cliente","Cliente","text"],["instagram","Instagram","text"],["pack","Pack","text"],["posts","Posts","number"],["reels","Reels","number"],["estado","Estado","select",["Pendiente","En progreso","Aprobación","Publicado","Finalizado"]]
  ],
  accesos: [
    ["cliente","Cliente","text"],["instagram","Instagram usuario","text"],["tiktok","TikTok usuario","text"],["facebook","Facebook usuario","text"],["email","Email vinculado","email"],["notas","Notas","textarea"]
  ]
};

let currentView = "dashboard";
let editingId = null;
let cache = {};

const qs = s => document.querySelector(s);
const qsa = s => document.querySelectorAll(s);
const euro = n => `${Number(n || 0).toFixed(2)}€`;

async function init(){
  if(SUPABASE_URL.includes("PEGA_AQUI")){
    alert("Falta configurar Supabase en config.js");
  }
  const { data } = await sb.auth.getSession();
  setAuth(!!data.session);
  sb.auth.onAuthStateChange((_event, session)=>setAuth(!!session));
}

function setAuth(logged){
  qs("#auth-screen").classList.toggle("hidden", logged);
  qs("#app").classList.toggle("hidden", !logged);
  if(logged) loadAll();
}

qs("#login-btn").onclick = async () => {
  const email = qs("#auth-email").value;
  const password = qs("#auth-password").value;
  const { error } = await sb.auth.signInWithPassword({ email, password });
  qs("#auth-msg").textContent = error ? error.message : "Entrando...";
};

qs("#signup-btn").onclick = async () => {
  const email = qs("#auth-email").value;
  const password = qs("#auth-password").value;
  const { error } = await sb.auth.signUp({ email, password });
  qs("#auth-msg").textContent = error ? error.message : "Usuario creado. Revisa tu email si Supabase pide confirmación.";
};

qs("#logout-btn").onclick = async () => sb.auth.signOut();

qsa("nav button").forEach(btn=>{
  btn.onclick = () => showView(btn.dataset.view);
});

function showView(view){
  currentView = view;
  qsa("nav button").forEach(b=>b.classList.toggle("active", b.dataset.view===view));
  qsa(".view").forEach(v=>v.classList.remove("active-view"));
  qs(`#${view}`).classList.add("active-view");
  qs("#page-title").textContent = view.charAt(0).toUpperCase()+view.slice(1);
  qs("#add-btn").style.display = view==="dashboard" ? "none" : "block";
}

qs("#add-btn").onclick = () => openModal(currentView);

function openModal(table, row=null){
  editingId = row?.id || null;
  qs("#modal-title").textContent = editingId ? "Editar registro" : "Nuevo registro";
  const fields = qs("#fields");
  fields.innerHTML = "";
  schemas[table].forEach(([key,label,type,opts])=>{
    let el;
    if(type==="select"){
      el = document.createElement("select");
      el.innerHTML = `<option value="">Seleccionar</option>` + opts.map(o=>`<option>${o}</option>`).join("");
    } else if(type==="textarea"){
      el = document.createElement("textarea");
    } else {
      el = document.createElement("input");
      el.type = type;
    }
    el.name = key;
    el.placeholder = label;
    el.value = row?.[key] ?? "";
    fields.appendChild(el);
  });
  qs("#modal").showModal();
}

qs("#record-form").onsubmit = async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  Object.keys(payload).forEach(k => {
    if(["base","igic","importe","posts","reels"].includes(k)) payload[k] = Number(payload[k] || 0);
  });
  let error;
  if(editingId){
    ({ error } = await sb.from(currentView).update(payload).eq("id", editingId));
  } else {
    ({ error } = await sb.from(currentView).insert(payload));
  }
  if(error){ alert(error.message); return; }
  qs("#modal").close();
  loadAll();
};

async function loadAll(){
  for(const table of Object.keys(schemas)){
    const { data, error } = await sb.from(table).select("*").order("created_at",{ascending:false});
    if(error){ console.error(table, error); cache[table]=[]; }
    else cache[table]=data || [];
  }
  render();
}

function badge(v){
  let cls = "pending";
  if(["Activo","Pagado","Publicado","Finalizado","Entregado"].includes(v)) cls="ok";
  if(["Vencido","Anulada","Pausado"].includes(v)) cls="danger";
  return `<span class="badge ${cls}">${v || "-"}</span>`;
}

function actions(table,id){
  return `<button class="action" onclick="editRow('${table}','${id}')">Editar</button><button class="action delete" onclick="deleteRow('${table}','${id}')">Borrar</button>`;
}

window.editRow = (table,id) => {
  const row = cache[table].find(x=>x.id===id);
  currentView = table;
  openModal(table,row);
};

window.deleteRow = async (table,id) => {
  if(!confirm("¿Borrar registro?")) return;
  const { error } = await sb.from(table).delete().eq("id",id);
  if(error) alert(error.message);
  loadAll();
};

function render(){
  renderClientes(); renderFacturas(); renderPagos(); renderProyectos(); renderRRSS(); renderAccesos(); renderDash();
}

function renderClientes(){
  qs("#clientes-body").innerHTML = cache.clientes.map(r=>`<tr><td><strong>${r.nombre||""}</strong></td><td>${r.empresa||""}</td><td>${r.telefono||""}</td><td>${r.email||""}</td><td>${r.instagram||""}</td><td>${r.servicio||""}</td><td>${badge(r.estado)}</td><td>${actions("clientes",r.id)}</td></tr>`).join("");
}

function renderFacturas(){
  qs("#facturas-body").innerHTML = cache.facturas.map(r=>{
    const igicVal = Number(r.base||0)*Number(r.igic||0)/100;
    const total = Number(r.base||0)+igicVal;
    return `<tr><td>${r.numero||""}</td><td>${r.cliente||""}</td><td>${r.concepto||""}</td><td>${euro(r.base)}</td><td>${euro(igicVal)}</td><td><strong>${euro(total)}</strong></td><td>${badge(r.estado)}</td><td>${actions("facturas",r.id)}</td></tr>`;
  }).join("");
}

function renderPagos(){
  qs("#pagos-body").innerHTML = cache.pagos.map(r=>`<tr><td>${r.cliente||""}</td><td>${r.servicio||""}</td><td>${euro(r.importe)}</td><td>${r.fecha||""}</td><td>${badge(r.estado)}</td><td>${actions("pagos",r.id)}</td></tr>`).join("");
}

function renderProyectos(){
  qs("#proyectos-body").innerHTML = cache.proyectos.map(r=>`<tr><td>${r.proyecto||""}</td><td>${r.cliente||""}</td><td>${r.tipo||""}</td><td>${r.fecha||""}</td><td>${badge(r.estado)}</td><td>${r.notas||""}</td><td>${actions("proyectos",r.id)}</td></tr>`).join("");
}

function renderRRSS(){
  qs("#rrss-body").innerHTML = cache.rrss.map(r=>`<tr><td>${r.cliente||""}</td><td>${r.instagram||""}</td><td>${r.pack||""}</td><td>${r.posts||0}</td><td>${r.reels||0}</td><td>${badge(r.estado)}</td><td>${actions("rrss",r.id)}</td></tr>`).join("");
}

function renderAccesos(){
  qs("#accesos-body").innerHTML = cache.accesos.map(r=>`<tr><td>${r.cliente||""}</td><td>${r.instagram||""}</td><td>${r.tiktok||""}</td><td>${r.facebook||""}</td><td>${r.email||""}</td><td>${r.notas||""}</td><td>${actions("accesos",r.id)}</td></tr>`).join("");
}

function renderDash(){
  const facturado = cache.facturas.reduce((a,r)=>a + Number(r.base||0) + (Number(r.base||0)*Number(r.igic||0)/100),0);
  const pendiente = cache.facturas.filter(r=>r.estado==="Pendiente").reduce((a,r)=>a + Number(r.base||0) + (Number(r.base||0)*Number(r.igic||0)/100),0);
  qs("#kpi-clientes").textContent = cache.clientes.length;
  qs("#kpi-facturado").textContent = euro(facturado);
  qs("#kpi-pendiente").textContent = euro(pendiente);
  qs("#kpi-proyectos").textContent = cache.proyectos.length;
  qs("#dash-clientes").innerHTML = cache.clientes.slice(0,6).map(r=>`<tr><td><strong>${r.nombre||""}</strong></td><td>${r.empresa||""}</td><td>${r.servicio||""}</td><td>${badge(r.estado)}</td></tr>`).join("");
}

init();
