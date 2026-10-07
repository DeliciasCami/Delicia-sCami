// ============================================
// Router por hash + navegación
// ============================================
import {
  app, updateBadges, setEditing
} from "./utils.js";

import { vInicio, vCatalogo, vCarrito, vAdmin } from "./vistas.js";

// ============================================
// Estado del router
// ============================================
let current = "inicio";
let ctx = null;   // contexto con getters y setters que se inyecta desde app.js

// ============================================
// Registro de vistas
// ============================================
const VIEWS = {
  inicio: (data, ctx) => vInicio(data, app),
  catalogo: (data, ctx) => vCatalogo(data, app, ctx.getFiltro()),
  carrito: (data, ctx) => vCarrito(data, ctx.getCart(), ctx.getPed(), app),
  admin: async (data, ctx) => {
    await vAdmin(data, app, {
      adminOK: ctx.getAdminOK(),
      setAdminOK: ctx.setAdminOK,
      sb: ctx.getSb(),
      tab: ctx.getTab(),
      editing: ctx.getEditing(),
      draw
    });
  }
};

// ============================================
// Leer la vista actual desde el hash
// ============================================
const fromHash = () => {
  try{
    const h = (location.hash || "").slice(1);
    return VIEWS[h] ? h : "inicio";
  }catch(e){
    return "inicio";
  }
};

// ============================================
// Redibujar la vista actual manteniendo el scroll
// ============================================
export function draw(){
  const y = window.scrollY;
  const data = ctx.getData();
  VIEWS[current](data, ctx);
  updateBadges();
  window.scrollTo(0, y);
}

// ============================================
// Navegar a otra vista
// ============================================
export function go(v, push = true){
  if(!VIEWS[v]) v = "inicio";
  current = v;
  setEditing(null);
  if(push){
    try{ history.pushState(null, "", "#" + v); }catch(e){}
  }
  const data = ctx.getData();
  VIEWS[current](data, ctx);
  updateBadges();
  window.scrollTo(0, 0);
}

// ============================================
// Inicializar el router
// ============================================
export function initRouter(contexto){
  ctx = contexto;
  current = fromHash();

  // Listener global: enlaces internos
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if(!a) return;
    e.preventDefault();
    go(a.getAttribute("href").slice(1));
  });

  // Listener: botón atrás/adelante del navegador
  addEventListener("popstate", () => go(fromHash(), false));

  // Primera pintura
  go(current, false);
}