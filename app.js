const FOTO="foto.jpg";
const KEY="deliciascami_datos_v1", CARTKEY="deliciascami_carrito_v1";

// ============================================
// CONFIGURACIÓN DE SUPABASE
// ============================================
const SUPABASE_URL = "https://kwjlvrvuzfdjfezlxqxi.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3amx2cnZ1emZkamZlemx4cXhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNjM2OTcsImV4cCI6MjEwNjgzOTY5N30.roNpCFolqZwIKSAeoYgvH2SWGJvht_0sVfThDKoUV78";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function DEFAULTS(){return{
settings:{nombre:"Delicia's Cami",lema:"Repostería hecha con cariño",telefono:"+53 5123 8087",pedidos:"",grupo:"",instagram:"",facebook:"",tiktok:"",moneda:"CUP",foto:""},
categorias:["Cakes","Cupcakes","Panes y dulces"],
categoriasConId:[],
productos:[
{id:"p1",cat:"Cakes",nombre:"Cake de vainilla",desc:"EJEMPLO: cámbialo desde el panel. Bizcocho suave con cobertura de crema.",precio:3500,img:"",agotado:false},
{id:"p2",cat:"Cakes",nombre:"Cake de mariposas",desc:"EJEMPLO: cake decorado en tonos lila y morado.",precio:4500,img:"",agotado:false},
{id:"p3",cat:"Cupcakes",nombre:"Cupcakes (caja de 6)",desc:"EJEMPLO: cupcakes de vainilla con crema y flor.",precio:1800,img:"",agotado:false},
{id:"p4",cat:"Panes y dulces",nombre:"Croissants (3 unidades)",desc:"EJEMPLO: recién horneados.",precio:900,img:"",agotado:false}
]};}
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const app=$("#app");
function load(){
try{const d=JSON.parse(localStorage.getItem(KEY));
if(d&&d.settings&&Array.isArray(d.productos)&&Array.isArray(d.categorias)){const b=DEFAULTS();return{...b,...d,settings:{...b.settings,...d.settings}};}
}catch(e){}
return DEFAULTS();
}
function loadCart(){try{return JSON.parse(localStorage.getItem(CARTKEY))||{}}catch(e){return{}}}
let data=load(), cart=loadCart();
let adminOK=false, tab="productos", editing=null, pendingImg=null, pendingFoto=null, filtro="";
let ped={nombre:"",fecha:"",hora:"",notas:""};

// ============================================
// CARGA DE DATOS DESDE SUPABASE
// ============================================
async function cargarDesdeSupabase(){
  try{
    const [cats, prods, sett] = await Promise.all([
      sb.from("categorias").select("*").order("orden"),
      sb.from("productos").select("*").order("created_at"),
      sb.from("settings").select("*").eq("id", 1).single()
    ]);
    if(cats.error) throw cats.error;
    if(prods.error) throw prods.error;
    if(sett.error) throw sett.error;

    const base = DEFAULTS();
    data.categorias = cats.data.map(c => c.nombre);
    data.categoriasConId = cats.data.map(c => ({ id: c.id, nombre: c.nombre }));
    data.productos = prods.data.map(p => ({
      id: String(p.id),
      cat: cats.data.find(c => c.id === p.categoria_id)?.nombre || "",
      nombre: p.nombre,
      desc: p.descripcion || "",
      precio: Number(p.precio),
      img: p.img_url || "",
      agotado: !!p.agotado
    }));
    data.settings = {
      ...base.settings,
      nombre: sett.data.nombre || base.settings.nombre,
      lema: sett.data.lema || "",
      telefono: sett.data.telefono || "",
      pedidos: sett.data.pedidos || "",
      grupo: sett.data.grupo || "",
      instagram: sett.data.instagram || "",
      facebook: sett.data.facebook || "",
      tiktok: sett.data.tiktok || "",
      moneda: sett.data.moneda || "CUP",
      foto: sett.data.foto_url || ""
    };
    return true;
  }catch(err){
    toast("Error de conexión: " + err.message);
    return false;
  }
}

function saveCart(){try{localStorage.setItem(CARTKEY,JSON.stringify(cart))}catch(e){}}
function toast(m){
document.querySelectorAll(".toast").forEach(t=>t.remove());
const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=m;
document.body.appendChild(t);setTimeout(()=>t.remove(),2800);
}
function confirmar(titulo, mensaje, textoBoton = "Sí, borrar"){
  return new Promise(resolve => {
    document.querySelectorAll(".modal-overlay").forEach(m => m.remove());
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.setAttribute("role","dialog");
    overlay.setAttribute("aria-modal","true");
    overlay.innerHTML = `
      <div class="modal">
        <h3>${esc(titulo)}</h3>
        <p>${esc(mensaje)}</p>
        <div class="modal-acts">
          <button class="btn btn-line btn-cancel" data-modal="cancel">Cancelar</button>
          <button class="btn btn-confirm" data-modal="ok">${esc(textoBoton)}</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add("modal-open");

    const cerrar = (valor) => {
      overlay.remove();
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKey);
      resolve(valor);
    };
    const onKey = (e) => {
      if(e.key === "Escape") cerrar(false);
      if(e.key === "Enter") cerrar(true);
    };
    overlay.addEventListener("click", (e) => {
      if(e.target === overlay) return cerrar(false);
      const b = e.target.closest("[data-modal]");
      if(!b) return;
      cerrar(b.dataset.modal === "ok");
    });
    document.addEventListener("keydown", onKey);
    overlay.querySelector('[data-modal="cancel"]').focus();
  });
}
const money=n=>Number(n||0).toLocaleString("es",{maximumFractionDigits:2})+" "+data.settings.moneda;
const waNum=()=>data.settings.telefono.replace(/\D/g,"");
const waPedidos=()=>((data.settings.pedidos||"").replace(/\D/g,""))||waNum();
const link=u=>{u=(u||"").trim();return u&&!/^https?:\/\//i.test(u)?"https://"+u:u};
const hoy=()=>new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10);
const cartItems=()=>Object.entries(cart).map(([id,q])=>({p:data.productos.find(x=>x.id===id),q})).filter(x=>x.p&&!x.p.agotado&&x.q>0);
const cartCount=()=>cartItems().reduce((a,x)=>a+x.q,0);
function updateBadges(){document.querySelectorAll("[data-count]").forEach(e=>{const n=cartCount();e.textContent=n;e.hidden=!n})}
function resize(file,max,cb){
toast("Cargando foto...");
const fail=()=>toast("No se pudo usar esa foto. Prueba con otra (JPG o PNG).");
const fr=new FileReader();
fr.onerror=fail;
fr.onload=()=>{const im=new Image();
im.onload=()=>{try{const k=Math.min(1,max/Math.max(im.width,im.height));const c=document.createElement("canvas");
c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
cb(c.toDataURL("image/jpeg",.8));}catch(e){fail()}};
im.onerror=fail;
im.src=fr.result;};
fr.readAsDataURL(file);
}
const ICON_ADD='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6"/><path d="M13 8v5M10.5 10.5h5"/></svg>';
function head(titulo){
return `<header class="top"><a href="#inicio">← Inicio</a><strong>${titulo}</strong><a href="#carrito">Carrito <span class="badge" data-count hidden></span></a></header>`;
}
function ph(p){return `<div class="ph">${p.img?`<img src="${p.img}" alt="${esc(p.nombre)}" loading="lazy">`:"🧁"}${p.agotado?'<span class="sold">Agotado</span>':""}</div>`}
/* ---------- INICIO ---------- */
function vInicio(){
const s=data.settings, tel=waNum();
const redes=[["Instagram",s.instagram],["Facebook",s.facebook],["TikTok",s.tiktok]].filter(r=>r[1]&&r[1].trim());
const fila=(href,t,v,ext)=>`<a class="fila" href="${esc(href)}" ${ext?'target="_blank" rel="noopener"':""}><b>${t}</b><span>${v}</span></a>`;
app.innerHTML=`<div class="home">
<section class="hero"><div class="hero-in">
<div class="arch-wrap"><div class="arch"><img src="${s.foto||FOTO}" alt="${esc(s.nombre)}, repostera" onerror="this.style.visibility='hidden'"></div></div>
<h1>${esc(s.nombre)}</h1>
<p class="lema">${esc(s.lema)}</p>
<div class="cta">
<a class="btn" href="#catalogo">Catálogo</a>
<a class="btn btn-line" href="#carrito">Mi carrito <span class="badge" data-count hidden></span></a>
</div>
</div></section>
<section class="contacto">
<h2>¿Dudas o sugerencias?</h2>
<p>Escríbeme y te respondo. Para hacer un pedido, usa el catálogo.</p>
${s.grupo?fila(link(s.grupo),"Grupo de WhatsApp","Unirme →",1):""}
${tel?fila("https://wa.me/"+tel,"WhatsApp",esc(s.telefono),1):""}
${redes.map(r=>fila(link(r[1]),r[0],"Seguir →",1)).join("")}
</section>
<footer>© ${new Date().getFullYear()} ${esc(s.nombre)} · <a href="#admin">Administrar</a></footer></div>`;
}
/* ---------- CATÁLOGO ---------- */
function vCatalogo(){
const cats=data.categorias.filter(c=>data.productos.some(p=>p.cat===c));
if(filtro&&!cats.includes(filtro))filtro="";
const mostrar=filtro?[filtro]:cats;
app.innerHTML=head("Catálogo")+`<main class="page">
${cats.length?`<div class="chips" role="group" aria-label="Categorías">
<button class="chip" data-a="filtro" data-id="" aria-pressed="${!filtro}">Todo</button>
${cats.map(c=>`<button class="chip" data-a="filtro" data-id="${esc(c)}" aria-pressed="${filtro===c}">${esc(c)}</button>`).join("")}</div>`:""}
${mostrar.map(c=>`<h2 class="cat-title">${esc(c)}</h2><div class="grid">
${data.productos.filter(p=>p.cat===c).map(p=>`<article class="card">${ph(p)}
<div class="card-b"><h3>${esc(p.nombre)}</h3><p>${esc(p.desc)}</p>
<div class="card-f"><span class="price">${money(p.precio)}</span>
<button class="add" data-a="add" data-id="${p.id}" ${p.agotado?"disabled":""} aria-label="Añadir ${esc(p.nombre)} al carrito">${ICON_ADD}</button></div></div></article>`).join("")}
</div>`).join("")}
${cats.length?"":`<div class="empty"><h2>Pronto tendremos novedades</h2><p>Todavía no hay productos en el catálogo.</p></div>`}
</main>`;
}
/* ---------- CARRITO ---------- */
function fecha(f){const [y,m,d]=f.split("-");return `${d}/${m}/${y}`}
function hora12(h){let [H,M]=h.split(":").map(Number);const s=H>=12?"PM":"AM";H=H%12||12;return `${H}:${String(M).padStart(2,"0")} ${s}`}
function vCarrito(){
const items=cartItems(), total=items.reduce((a,x)=>a+x.p.precio*x.q,0);
if(!items.length){
app.innerHTML=head("Mi carrito")+`<main class="page"><div class="empty"><h2>Tu carrito está vacío</h2><p>Elige tus dulces favoritos en el catálogo.</p><a class="btn" href="#catalogo">Ver catálogo</a></div></main>`;return;
}
app.innerHTML=head("Mi carrito")+`<main class="page" style="max-width:640px">
${items.map(({p,q})=>`<div class="line">${ph(p)}<div><b>${esc(p.nombre)}</b><span>${money(p.precio)}</span>
<div class="qty"><button data-a="dec" data-id="${p.id}" aria-label="Quitar uno">−</button><span>${q}</span><button data-a="inc" data-id="${p.id}" aria-label="Añadir uno">+</button></div></div>
<div><div class="sub">${money(p.precio*q)}</div><button class="rm" data-a="rm" data-id="${p.id}">Quitar</button></div></div>`).join("")}
<div class="total"><span>Total</span><span>${money(total)}</span></div>
<section class="box"><h2>Datos de tu pedido</h2>
<label class="field"><span>Tu nombre</span><input data-ped="nombre" value="${esc(ped.nombre)}" autocomplete="name"></label>
<div class="row2">
<label class="field"><span>Fecha</span><input type="date" data-ped="fecha" min="${hoy()}" value="${esc(ped.fecha)}"></label>
<label class="field"><span>Hora</span><input type="time" data-ped="hora" value="${esc(ped.hora)}"></label>
</div>
<label class="field"><span>Notas (opcional)</span><textarea rows="3" data-ped="notas" placeholder="Sabor, dedicatoria, dirección de entrega...">${esc(ped.notas)}</textarea></label>
<button class="btn btn-wa" data-a="send">Enviar pedido por WhatsApp</button>
</section>
<p style="text-align:center"><button class="rm" data-a="clear">Vaciar carrito</button></p>
</main>`;
}
/* ---------- ADMIN ---------- */
async function vAdmin(){
if(!adminOK){
  const { data: { session } } = await sb.auth.getSession();
  adminOK = !!session;
}
if(!adminOK){
app.innerHTML=head("Administrar")+`<main class="page" style="max-width:420px"><section class="box"><h2>Entrar al panel</h2>
<label class="field"><span>Email</span><input type="email" id="email" autocomplete="username" placeholder="tu@correo.com"></label>
<label class="field"><span>Contraseña</span><input type="password" id="pw" autocomplete="current-password"></label>
<button class="btn" data-a="login" style="width:100%">Entrar</button>
<p class="note" style="margin-top:14px">Usa el usuario que creaste en Supabase.</p></section></main>`;
return;
}
const tabs=[["productos","Productos"],["categorias","Categorías"],["ajustes","Ajustes"]];
app.innerHTML=head("Panel")+`<main class="page" style="max-width:700px">
<p class="note">Los cambios se guardan en la nube.</p>
<div class="tabs">${tabs.map(t=>`<button class="chip" data-a="tab" data-id="${t[0]}" aria-pressed="${tab===t[0]}">${t[1]}</button>`).join("")}
<button class="chip" data-a="logout">Salir</button></div>
<div id="tabbody"></div></main>`;
const tb=$("#tabbody");
if(tab==="productos")tb.innerHTML=editing!==null?formProd():listaProd();
if(tab==="categorias")tb.innerHTML=catsHtml();
if(tab==="ajustes")tb.innerHTML=ajustesHtml();
}
function listaProd(){
return `<button class="btn" data-a="newprod" style="margin-bottom:14px">Agregar producto</button>`+
(data.productos.length?data.productos.map(p=>`<div class="arow">${ph(p).replace('class="ph"','class="ph"')}<div><b>${esc(p.nombre)}</b><div>${esc(p.cat)} · ${money(p.precio)}</div>
<div class="acts"><button class="btn btn-sm btn-line" data-a="editprod" data-id="${p.id}">Editar</button>
<label><input type="checkbox" data-change="agotado" data-id="${p.id}" ${p.agotado?"checked":""}> Agotado</label>
<button class="btn btn-sm btn-danger" data-a="delprod" data-id="${p.id}">Borrar</button></div></div></div>`).join(""):`<p>Aún no hay productos.</p>`);
}
function formProd(){
const nuevo=editing==="new", p=nuevo?{cat:data.categorias[0]||"",nombre:"",desc:"",precio:"",img:""}:data.productos.find(x=>x.id===editing)||{};
return `<section class="box"><h2>${nuevo?"Nuevo producto":"Editar producto"}</h2>
<label class="field"><span>Categoría</span><select id="fCat">${data.categoriasConId.map(c=>`<option value="${c.id}" ${c.nombre===p.cat?"selected":""}>${esc(c.nombre)}</option>`).join("")}</select></label>
<label class="field"><span>Nombre</span><input id="fNombre" value="${esc(p.nombre)}"></label>
<label class="field"><span>Descripción corta</span><textarea id="fDesc" rows="3">${esc(p.desc)}</textarea></label>
<label class="field"><span>Precio (${esc(data.settings.moneda)})</span><input id="fPrecio" type="number" min="0" step="any" inputmode="decimal" value="${esc(p.precio)}"></label>
<div class="field"><span>Foto</span>
<label class="btn btn-line btn-sm" for="fFile" style="cursor:pointer">Elegir foto</label>
<input id="fFile" class="sr" type="file" accept="image/*" data-change="imgprod">
<img id="fPrev" class="preview" alt="Vista previa de la foto" ${p.img?`src="${p.img}"`:'hidden'}>
<small id="fMsg">${p.img?"Toca \"Elegir foto\" para cambiarla.":"Toca \"Elegir foto\" y escoge una de tu galería."}</small></div>
<div class="acts"><button class="btn" data-a="saveprod">Guardar</button><button class="btn btn-line" data-a="cancelprod">Cancelar</button></div></section>`;
}
function catsHtml(){
return `<section class="box"><h2>Categorías</h2>
${data.categoriasConId.map(c=>{
  const n = data.productos.filter(p=>p.cat===c.nombre).length;
  return `<div class="arow" style="grid-template-columns:1fr auto"><div><b>${esc(c.nombre)}</b><div>${n} producto${n===1?"":"s"}</div></div>
<button class="btn btn-sm btn-danger" data-a="delcat" data-id="${c.id}" data-nombre="${esc(c.nombre)}">Borrar</button></div>`
}).join("")}
<label class="field" style="margin-top:14px"><span>Nueva categoría</span><input id="nCat" placeholder="Ej: Cheesecakes"></label>
<button class="btn" data-a="addcat">Agregar categoría</button></section>`;
}
function ajustesHtml(){
const s=data.settings;
const f=(id,label,val,extra="")=>`<label class="field"><span>${label}</span><input id="${id}" value="${esc(val)}" ${extra}></label>`;
return `<section class="box"><h2>Ajustes</h2>
${f("sNombre","Nombre del negocio",s.nombre)}
${f("sLema","Frase debajo del nombre",s.lema)}
<label class="field"><span>Teléfono para dudas y sugerencias</span><input id="sTel" value="${esc(s.telefono)}" inputmode="tel"><small>Es el que se ve en la página. Con código de país.</small></label>
<label class="field"><span>WhatsApp donde recibes los pedidos</span><input id="sPed" value="${esc(s.pedidos||"")}" inputmode="tel" placeholder="Déjalo vacío para usar el mismo teléfono"><small>A este número llegan los pedidos del carrito.</small></label>
${f("sGrupo","Enlace del grupo de WhatsApp",s.grupo,'placeholder="https://chat.whatsapp.com/..."')}
${f("sIg","Instagram (enlace)",s.instagram)}
${f("sFb","Facebook (enlace)",s.facebook)}
${f("sTt","TikTok (enlace)",s.tiktok)}
${f("sMon","Moneda",s.moneda)}
<div class="field"><span>Mi foto</span>
<label class="btn btn-line btn-sm" for="sFile" style="cursor:pointer">Cambiar mi foto</label>
<input id="sFile" class="sr" type="file" accept="image/*" data-change="foto"><small id="sMsg"></small></div>
<button class="btn" data-a="savesettings">Guardar ajustes</button></section>`;
}
/* ---------- ACCIONES ---------- */
const A={
add(id){const p=data.productos.find(x=>x.id===id);if(!p||p.agotado)return;cart[id]=(cart[id]||0)+1;saveCart();updateBadges();toast(`${p.nombre} añadido al carrito`)},
inc(id){cart[id]=(cart[id]||0)+1;saveCart();draw()},
dec(id){cart[id]=(cart[id]||0)-1;if(cart[id]<=0)delete cart[id];saveCart();draw()},
rm(id){delete cart[id];saveCart();draw()},
async clear(){
  const ok = await confirmar(
    "Vaciar carrito",
    "Se quitarán todos los productos de tu carrito. ¿Continuar?",
    "Sí, vaciar"
  );
  if(!ok) return;
  cart = {};
  saveCart();
  draw();
},
filtro(id){filtro=id;draw();window.scrollTo(0,0)},
send(){
const items=cartItems();
if(!items.length)return toast("Tu carrito está vacío.");
if(!ped.nombre.trim())return toast("Escribe tu nombre.");
if(!ped.fecha)return toast("Elige la fecha en que quieres tu pedido.");
if(ped.fecha<hoy())return toast("Esa fecha ya pasó. Elige otra.");
if(!ped.hora)return toast("Elige la hora.");
const total=items.reduce((a,x)=>a+x.p.precio*x.q,0);
const msg=`Hola, quiero hacer un pedido en ${data.settings.nombre}:\n\n`+
items.map(x=>`• ${x.q} x ${x.p.nombre} – ${money(x.p.precio*x.q)}`).join("\n")+
`\n\nTotal: ${money(total)}\n\nNombre: ${ped.nombre.trim()}\nFecha: ${fecha(ped.fecha)}\nHora: ${hora12(ped.hora)}`+
(ped.notas.trim()?`\nNotas: ${ped.notas.trim()}`:"");
window.open(`https://wa.me/${waPedidos()}?text=${encodeURIComponent(msg)}`,"_blank","noopener");
toast("Se abrió WhatsApp: toca enviar para confirmar tu pedido.");
},
async login(){
  const email = ($("#email")?.value || "").trim();
  const pw = $("#pw")?.value || "";
  if(!email) return toast("Escribe tu email.");
  if(!pw) return toast("Escribe tu contraseña.");
  const { error } = await sb.auth.signInWithPassword({ email, password: pw });
  if(error){
    toast("Email o contraseña incorrectos.");
    return;
  }
  adminOK = true;
  draw();
  toast("¡Bienvenida!");
},
async logout(){
  await sb.auth.signOut();
  adminOK = false;
  editing = null;
  go("inicio");
},
tab(id){tab=id;editing=null;draw()},
newprod(){editing="new";pendingImg=null;draw()},
editprod(id){editing=id;pendingImg=null;draw()},
cancelprod(){editing=null;pendingImg=null;draw()},
async saveprod(){
  const nombre = $("#fNombre").value.trim();
  const precio = parseFloat($("#fPrecio").value);
  const catId  = $("#fCat").value;

  if(!nombre) return toast("Escribe el nombre del producto.");
  if(isNaN(precio) || precio < 0) return toast("Escribe un precio válido.");
  if(!catId) return toast("Elige una categoría.");

  let imgUrl = null;
  if(pendingImg){
    try{
      const blob = await (await fetch(pendingImg)).blob();
      const path = `producto_${Date.now()}.jpg`;
      const up = await sb.storage.from("productos").upload(path, blob, { upsert: true });
      if(up.error) throw up.error;
      imgUrl = sb.storage.from("productos").getPublicUrl(path).data.publicUrl;
    }catch(err){
      toast("Error subiendo foto: " + err.message);
      return;
    }
  }

  const payload = {
    categoria_id: Number(catId),
    nombre,
    descripcion: $("#fDesc").value.trim(),
    precio
  };
  if(imgUrl) payload.img_url = imgUrl;

  let error;
  if(editing === "new"){
    ({ error } = await sb.from("productos").insert(payload));
  } else {
    ({ error } = await sb.from("productos").update(payload).eq("id", Number(editing)));
  }

  if(error){
    toast("Error guardando: " + error.message);
    return;
  }

  await cargarDesdeSupabase();
  editing = null;
  pendingImg = null;
  toast("Producto guardado en la nube");
  draw();
},
async delprod(id){
  const p = data.productos.find(x => x.id === id);
  const nombre = p ? p.nombre : "este producto";
  const ok = await confirmar(
    "Borrar producto",
    `¿Seguro que quieres borrar "${nombre}"? Esta acción no se puede deshacer.`,
    "Sí, borrar"
  );
  if(!ok) return;

  const { error } = await sb.from("productos").delete().eq("id", Number(id));
  if(error){
    toast("Error borrando: " + error.message);
    return;
  }

  delete cart[id];
  saveCart();

  await cargarDesdeSupabase();
  toast("Producto borrado de la nube");
  draw();
},
async addcat(){
  const v = $("#nCat").value.trim();
  if(!v) return toast("Escribe el nombre de la categoría.");
  if(data.categorias.includes(v)) return toast("Esa categoría ya existe.");

  const siguienteOrden = data.categorias.length + 1;

  const { error } = await sb.from("categorias").insert({
    nombre: v,
    orden: siguienteOrden
  });

  if(error){
    toast("Error creando categoría: " + error.message);
    return;
  }

  await cargarDesdeSupabase();
  toast("Categoría creada en la nube");
  draw();
},
async delcat(id, boton){
  const nombre = boton?.dataset?.nombre || "";
  const cat = data.categoriasConId.find(c => String(c.id) === String(id));
  const nombreReal = nombre || cat?.nombre || "";

  if(data.productos.some(p => p.cat === nombreReal)){
    return toast("Primero cambia o borra los productos de esa categoría.");
  }

  const ok = await confirmar(
    "Borrar categoría",
    `¿Seguro que quieres borrar la categoría "${nombreReal}"?`,
    "Sí, borrar"
  );
  if(!ok) return;

  const { error } = await sb.from("categorias").delete().eq("id", Number(id));
  if(error){
    toast("Error borrando: " + error.message);
    return;
  }

  await cargarDesdeSupabase();
  toast("Categoría borrada de la nube");
  draw();
},
async savesettings(){
  const upd = {
    nombre: $("#sNombre").value.trim() || data.settings.nombre,
    lema: $("#sLema").value.trim(),
    telefono: $("#sTel").value.trim(),
    pedidos: $("#sPed").value.trim(),
    grupo: $("#sGrupo").value.trim(),
    instagram: $("#sIg").value.trim(),
    facebook: $("#sFb").value.trim(),
    tiktok: $("#sTt").value.trim(),
    moneda: $("#sMon").value.trim() || "CUP"
  };

  if(pendingFoto){
    const blob = await (await fetch(pendingFoto)).blob();
    const path = `perfil_${Date.now()}.jpg`;
    const up = await sb.storage.from("productos").upload(path, blob, { upsert: true });
    if(up.error){
      toast("Error subiendo foto: " + up.error.message);
      return;
    }
    upd.foto_url = sb.storage.from("productos").getPublicUrl(path).data.publicUrl;
    pendingFoto = null;
  }

  const { error } = await sb.from("settings").update(upd).eq("id", 1);
  if(error){
    toast("Error guardando ajustes: " + error.message);
    return;
  }

  await cargarDesdeSupabase();
  toast("Ajustes guardados en la nube");
  draw();
}
};
document.addEventListener("click",e=>{const b=e.target.closest("[data-a]");if(b&&A[b.dataset.a])A[b.dataset.a](b.dataset.id,b)});
document.addEventListener("input",e=>{const k=e.target.dataset&&e.target.dataset.ped;if(k)ped[k]=e.target.value});
document.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.id==="pw")A.login()});
document.addEventListener("change",e=>{
const t=e.target,k=t.dataset&&t.dataset.change;if(!k)return;
if(k==="agotado"){
  const id = t.dataset.id;
  const agotado = t.checked;
  (async () => {
    const { error } = await sb.from("productos").update({ agotado }).eq("id", Number(id));
    if(error){
      toast("Error actualizando: " + error.message);
      t.checked = !agotado;
      return;
    }
    await cargarDesdeSupabase();
    toast(agotado ? "Marcado como agotado" : "Disponible de nuevo");
    draw();
  })();
}
if(k==="imgprod"&&t.files[0])resize(t.files[0],640,u=>{pendingImg=u;const im=$("#fPrev");im.src=u;im.hidden=false;$("#fMsg").textContent="Foto lista. Toca Guardar para terminar.";toast("Foto lista")});
if(k==="foto"&&t.files[0])resize(t.files[0],800,u=>{pendingFoto=u;$("#sMsg").textContent="Foto lista. Toca Guardar ajustes.";toast("Foto lista: toca Guardar ajustes")});
});
/* ---------- RUTAS ---------- */
const VIEWS={inicio:vInicio,catalogo:vCatalogo,carrito:vCarrito,admin:vAdmin};
const fromHash=()=>{try{const h=(location.hash||"").slice(1);return VIEWS[h]?h:"inicio"}catch(e){return "inicio"}};
let current=fromHash();
function draw(){const y=window.scrollY;VIEWS[current]();updateBadges();window.scrollTo(0,y)}
function go(v,push=true){
if(!VIEWS[v])v="inicio";
current=v;editing=null;
if(push){try{history.pushState(null,"","#"+v)}catch(e){}}
VIEWS[current]();updateBadges();window.scrollTo(0,0);
}
document.addEventListener("click",e=>{
const a=e.target.closest('a[href^="#"]');
if(!a)return;
e.preventDefault();
go(a.getAttribute("href").slice(1));
});
addEventListener("popstate",()=>go(fromHash(),false));

// ============================================
// ARRANQUE
// ============================================
(async () => {
  const ok = await cargarDesdeSupabase();
  if(!ok){
    data = load();
  }
  go(current, false);
})();