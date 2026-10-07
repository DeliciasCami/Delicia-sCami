// ============================================
// Helpers generales + estado global
// ============================================

export const FOTO = "foto.jpg";
export const KEY = "deliciascami_datos_v1";
export const CARTKEY = "deliciascami_carrito_v1";

export const $ = (s, r = document) => r.querySelector(s);

export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[c]));

export const app = $("#app");

// ---------- Estructura de datos por defecto ----------
export function DEFAULTS(){
  return {
    settings: {
      nombre:"Delicia's Cami", lema:"Repostería hecha con cariño",
      telefono:"+53 5123 8087", pedidos:"", grupo:"",
      instagram:"", facebook:"", tiktok:"", moneda:"CUP", foto:""
    },
    categorias: ["Cakes","Cupcakes","Panes y dulces"],
    categoriasConId: [],
    productos: [
      { id:"p1", cat:"Cakes", nombre:"Cake de vainilla", desc:"EJEMPLO: cámbialo desde el panel. Bizcocho suave con cobertura de crema.", precio:3500, img:"", agotado:false },
      { id:"p2", cat:"Cakes", nombre:"Cake de mariposas", desc:"EJEMPLO: cake decorado en tonos lila y morado.", precio:4500, img:"", agotado:false },
      { id:"p3", cat:"Cupcakes", nombre:"Cupcakes (caja de 6)", desc:"EJEMPLO: cupcakes de vainilla con crema y flor.", precio:1800, img:"", agotado:false },
      { id:"p4", cat:"Panes y dulces", nombre:"Croissants (3 unidades)", desc:"EJEMPLO: recién horneados.", precio:900, img:"", agotado:false }
    ]
  };
}

// ---------- Carga desde localStorage (respaldo) ----------
export function load(){
  try{
    const d = JSON.parse(localStorage.getItem(KEY));
    if(d && d.settings && Array.isArray(d.productos) && Array.isArray(d.categorias)){
      const b = DEFAULTS();
      return { ...b, ...d, settings: { ...b.settings, ...d.settings } };
    }
  }catch(e){}
  return DEFAULTS();
}

export function loadCart(){
  try{ return JSON.parse(localStorage.getItem(CARTKEY)) || {}; }
  catch(e){ return {}; }
}

// ---------- Estado global ----------
export let data = load();
data.resenasPorProducto = {};
export let cart = loadCart();

export let adminOK = false;
export let tab = "productos";
export let editing = null;
export let pendingImg = null;
export let pendingFoto = null;
export let filtro = "";
export let ped = { nombre:"", telefono:"", fecha:"", hora:"", notas:"" };

// ---------- Setters (necesarios porque no se pueden reasignar importaciones) ----------
export function setData(v){ data = v; }
export function setCart(v){ cart = v; }
export function setAdminOK(v){ adminOK = v; }
export function setTab(v){ tab = v; }
export function setEditing(v){ editing = v; }
export function setPendingImg(v){ pendingImg = v; }
export function setPendingFoto(v){ pendingFoto = v; }
export function setFiltro(v){ filtro = v; }
export function setPed(v){ ped = v; }

// ---------- Persistencia del carrito ----------
export function saveCart(){
  try{ localStorage.setItem(CARTKEY, JSON.stringify(cart)); }catch(e){}
}

// ---------- Toast ----------
export function toast(m){
  document.querySelectorAll(".toast").forEach(t => t.remove());
  const t = document.createElement("div");
  t.className = "toast";
  t.setAttribute("role","status");
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2800);
}

// ---------- Formateo ----------
export const money = (n, dataRef) => {
  const ref = dataRef || data;
  return Number(n || 0).toLocaleString("es", { maximumFractionDigits: 2 }) + " " + ref.settings.moneda;
};

export const waNum = (dataRef) => (dataRef || data).settings.telefono.replace(/\D/g, "");

export const waPedidos = (dataRef) => {
  const ref = dataRef || data;
  return ((ref.settings.pedidos || "").replace(/\D/g, "")) || waNum(ref);
};
export const link = u => { u = (u || "").trim(); return u && !/^https?:\/\//i.test(u) ? "https://" + u : u; };
export const hoy = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0,10);

export const cartItems = (cartRef, dataRef) => {
  const c = cartRef || cart;
  const d = dataRef || data;
  return Object.entries(c).map(([id, q]) => ({
    p: d.productos.find(x => x.id === id),
    q
  })).filter(x => x.p && !x.p.agotado && x.q > 0);
};
export const cartCount = (cartRef, dataRef) => cartItems(cartRef, dataRef).reduce((a, x) => a + x.q, 0);

export function updateBadges(){
  document.querySelectorAll("[data-count]").forEach(e => {
    const n = cartCount();
    e.textContent = n;
    e.hidden = !n;
  });
}

export function fecha(f){
  const [y,m,d] = f.split("-");
  return `${d}/${m}/${y}`;
}

export function hora12(h){
  let [H,M] = h.split(":").map(Number);
  const s = H >= 12 ? "PM" : "AM";
  H = H % 12 || 12;
  return `${H}:${String(M).padStart(2,"0")} ${s}`;
}

// ---------- Redimensionar imágenes ----------
export function resize(file, max, cb){
  toast("Cargando foto...");
  const fail = () => toast("No se pudo usar esa foto. Prueba con otra (JPG o PNG).");
  const fr = new FileReader();
  fr.onerror = fail;
  fr.onload = () => {
    const im = new Image();
    im.onload = () => {
      try{
        const k = Math.min(1, max / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = Math.round(im.width * k);
        c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", .8));
      }catch(e){ fail(); }
    };
    im.onerror = fail;
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}

// ---------- Icono SVG del carrito ----------
export const ICON_ADD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.4 11.2a1.5 1.5 0 0 0 1.5 1.2h8.7a1.5 1.5 0 0 0 1.5-1.1L21 7H6"/><path d="M13 8v5M10.5 10.5h5"/></svg>';

// ---------- Cabecera de páginas interiores ----------
export function head(titulo){
  return `<header class="top"><a href="#inicio">← Inicio</a><strong>${titulo}</strong><a href="#carrito">Carrito <span class="badge" data-count hidden></span></a></header>`;
}

// ---------- Placeholder de imagen de producto ----------
export function ph(p){
  return `<div class="ph">${p.img ? `<img src="${p.img}" alt="${esc(p.nombre)}" loading="lazy">` : "🧁"}${p.agotado ? '<span class="sold">Agotado</span>' : ""}</div>`;
}

// ============================================
// Helpers de reseñas
// ============================================
export function resenasDe(prodId, dataRef){
  return dataRef.resenasPorProducto[String(prodId)] || [];
}

export function promedioEstrellas(prodId, dataRef){
  const rs = resenasDe(prodId, dataRef);
  if(!rs.length) return 0;
  const suma = rs.reduce((a, r) => a + r.estrellas, 0);
  return suma / rs.length;
}

export function estrellasHTML(n, redondear = true){
  const val = redondear ? Math.round(n) : n;
  let html = '<span class="estrellas" aria-label="' + n.toFixed(1) + ' de 5">';
  for(let i = 1; i <= 5; i++){
    html += i <= val ? "★" : '<span class="off">★</span>';
  }
  html += "</span>";
  return html;
}

export function lineaRating(prodId, dataRef){
  const rs = resenasDe(prodId, dataRef);
  const prom = promedioEstrellas(prodId, dataRef);
  if(!rs.length) return `<div class="rating-line" data-stop="1" data-a="abrirProducto" data-id="${prodId}">Sin reseñas · <b>Sé el primero</b></div>`;
  return `<div class="rating-line" data-stop="1" data-a="abrirProducto" data-id="${prodId}">${estrellasHTML(prom)} <b>${prom.toFixed(1)}</b> · ${rs.length} reseña${rs.length === 1 ? "" : "s"}</div>`;
}

export function yaReseno(prodId){
  try{
    const arr = JSON.parse(localStorage.getItem("deliciascami_resenas") || "[]");
    return arr.includes(String(prodId));
  }catch(e){ return false; }
}

export function marcarResenado(prodId){
  try{
    const arr = JSON.parse(localStorage.getItem("deliciascami_resenas") || "[]");
    if(!arr.includes(String(prodId))) arr.push(String(prodId));
    localStorage.setItem("deliciascami_resenas", JSON.stringify(arr));
  }catch(e){}
}

// ============================================
// Getters para variables que necesitan leerse desde acciones
// ============================================
export function getEditing(){ return editing; }
export function getPendingImg(){ return pendingImg; }
export function getPendingFoto(){ return pendingFoto; }
export function getTab(){ return tab; }
export function getFiltro(){ return filtro; }
export function getAdminOK(){ return adminOK; }