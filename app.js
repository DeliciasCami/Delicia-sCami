// ============================================
// Punto de entrada de la aplicación
// ============================================
import { sb } from "./supabase.js";
import {
  data, cart, ped,
  setCart, setPed, setAdminOK, setEditing,
  setPendingImg, setPendingFoto, setTab,
  getEditing, getPendingImg, getPendingFoto, getTab, getAdminOK,
  toast, $, resize
} from "./utils.js";

import { crearAcciones } from "./acciones.js";
import { draw, go, initRouter } from "./router.js";
import { cargarDesdeSupabase } from "./supabase-data.js";

let filtroActual = "";

const ctx = {
  getData: () => data,
  getCart: () => cart,
  getPed: () => ped,
  getSb: () => sb,
  getEditing,
  getPendingImg,
  getPendingFoto,
  getTab,
  getFiltro: () => filtroActual,
  getAdminOK,
  setAdminOK,
  setEditing,
  setPendingImg,
  setPendingFoto,
  setTab,
  setFiltro: (v) => { filtroActual = v; },
  setCart,
  setPed,
  draw
};

const A = crearAcciones({ ...ctx, go });
window.__A = A;

document.addEventListener("click", e => {
  const stopper = e.target.closest("[data-stop]");
  if(stopper){
    e.stopPropagation();
    if(stopper.dataset.a && A[stopper.dataset.a]) A[stopper.dataset.a](stopper.dataset.id, stopper);
    return;
  }
  const b = e.target.closest("[data-a]");
  if(b && A[b.dataset.a]) A[b.dataset.a](b.dataset.id, b);
});

document.addEventListener("input", e => {
  const k = e.target.dataset && e.target.dataset.ped;
  if(!k) return;
  setPed({ ...ped, [k]: e.target.value });
});

document.addEventListener("keydown", e => {
  if(e.key === "Enter" && e.target.id === "pw") A.login();
});

document.addEventListener("change", e => {
  const t = e.target;
  const k = t.dataset && t.dataset.change;
  if(!k) return;

  if(k === "agotado"){
    const id = t.dataset.id;
    const agotado = t.checked;
    A.agotado(id, agotado).then(ok => {
      if(ok === false) t.checked = !agotado;
    });
  }

  if(k === "estado"){
    A.estado(t.dataset.id, t.value);
  }

  if(k === "imgprod" && t.files[0]){
    resize(t.files[0], 640, u => {
      setPendingImg(u);
      const im = $("#fPrev");
      if(im){ im.src = u; im.hidden = false; }
      const msg = $("#fMsg");
      if(msg) msg.textContent = "Foto lista. Toca Guardar para terminar.";
      toast("Foto lista");
    });
  }

  if(k === "foto" && t.files[0]){
    resize(t.files[0], 800, u => {
      setPendingFoto(u);
      const msg = $("#sMsg");
      if(msg) msg.textContent = "Foto lista. Toca Guardar ajustes.";
      toast("Foto lista: toca Guardar ajustes");
    });
  }
});

(async () => {
  const ok = await cargarDesdeSupabase(data);
  initRouter(ctx);
  if(!ok) toast("No se pudo conectar con el servidor. Usando datos locales.");
})();