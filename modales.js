// ============================================
// Modales: confirmación + ficha de producto
// ============================================
import {
  esc, money, toast,
  resenasDe, promedioEstrellas, estrellasHTML,
  yaReseno
} from "./utils.js";

// ============================================
// MODAL DE CONFIRMACIÓN
// ============================================
export function confirmar(titulo, mensaje, textoBoton = "Sí, borrar"){
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
      if(!document.querySelector(".prod-modal") && !document.querySelector(".modal-overlay")){
        document.body.classList.remove("modal-open");
      }
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

// ============================================
// MODAL DE PRODUCTO
// ============================================
export function abrirProducto(prodId, dataRef){
  const p = dataRef.productos.find(x => String(x.id) === String(prodId));
  if(!p) return;

  const rs = resenasDe(prodId, dataRef);
  const prom = promedioEstrellas(prodId, dataRef);
  const puedeResenar = !yaReseno(prodId);

  const resenasHTML = rs.length
    ? rs.map(r => `
      <div class="resena-item">
        <div class="resena-head">
          <div><b>${esc(r.nombre)}</b> ${estrellasHTML(r.estrellas, false)}</div>
          <span class="resena-fecha">${new Date(r.created_at).toLocaleDateString("es")}</span>
        </div>
        ${r.comentario ? `<div class="resena-texto">${esc(r.comentario)}</div>` : ""}
      </div>`).join("")
    : `<div class="sin-resenas">Aún no hay reseñas. ¡Sé el primero en opinar!</div>`;

  const formHTML = puedeResenar ? `
    <div class="form-resena">
      <h4>Deja tu reseña</h4>
      <label class="field">
        <span class="estrellas-label">Tu calificación *</span>
        <div class="estrellas-input" id="estrellasInput" data-valor="0">
          <span data-est="1">★</span>
          <span data-est="2">★</span>
          <span data-est="3">★</span>
          <span data-est="4">★</span>
          <span data-est="5">★</span>
        </div>
      </label>
      <label class="field"><span>Tu nombre *</span><input id="resNombre" maxlength="60" placeholder="Ej: María P."></label>
      <label class="field"><span>Comentario (opcional)</span><textarea id="resComentario" rows="2" maxlength="300" placeholder="¿Qué te pareció?"></textarea></label>
      <button class="btn btn-wa" data-a="enviarResena" data-id="${p.id}">Publicar reseña</button>
    </div>` : `
    <div class="form-resena" style="text-align:center;color:#7a6889">
      Ya dejaste tu reseña para este producto. ¡Gracias!
    </div>`;

  const modal = document.createElement("div");
  modal.className = "prod-modal";
  modal.setAttribute("role","dialog");
  modal.setAttribute("aria-modal","true");
  modal.innerHTML = `
    <div class="prod-modal-inner">
      <button class="cerrar" data-cerrar="1" aria-label="Cerrar">✕</button>
      <div class="hero-img">${p.img ? `<img src="${esc(p.img)}" alt="${esc(p.nombre)}">` : "🧁"}</div>
      <div class="content">
        <h2>${esc(p.nombre)}</h2>
        ${rs.length ? `<div style="display:flex;align-items:center;gap:8px">${estrellasHTML(prom)} <b style="color:var(--plum)">${prom.toFixed(1)}</b> <span style="color:#7a6889;font-size:.9rem">(${rs.length} ${rs.length === 1 ? "reseña" : "reseñas"})</span></div>` : ""}
        <div class="precio">${money(p.precio)}</div>
        <p class="desc">${esc(p.desc)}</p>
        <div class="prod-actions">
          <button class="btn btn-wa" data-a="add" data-id="${p.id}" ${p.agotado ? "disabled" : ""} data-cerrar="1">
            ${p.agotado ? "Agotado" : "Añadir al carrito"}
          </button>
        </div>
      </div>
      <div class="resenas-seccion">
        <h3>Reseñas (${rs.length})</h3>
        <div class="resenas-lista">${resenasHTML}</div>
        ${formHTML}
      </div>
    </div>`;

  document.body.appendChild(modal);
  document.body.classList.add("modal-open");

  // Selector de estrellas
  const input = modal.querySelector("#estrellasInput");
  if(input){
    input.querySelectorAll("span").forEach(span => {
      span.addEventListener("click", () => {
        const val = Number(span.dataset.est);
        input.dataset.valor = val;
        input.querySelectorAll("span").forEach(s => {
          s.classList.toggle("on", Number(s.dataset.est) <= val);
        });
      });
      span.addEventListener("mouseenter", () => {
        const val = Number(span.dataset.est);
        input.querySelectorAll("span").forEach(s => {
          s.classList.toggle("on", Number(s.dataset.est) <= val);
        });
      });
    });
    input.addEventListener("mouseleave", () => {
      const val = Number(input.dataset.valor);
      input.querySelectorAll("span").forEach(s => {
        s.classList.toggle("on", Number(s.dataset.est) <= val);
      });
    });
  }

  const onEsc = (e) => { if(e.key === "Escape") cerrarProdModal(); };
  document.addEventListener("keydown", onEsc);

  function cerrarProdModal(){
    document.removeEventListener("keydown", onEsc);
    modal.remove();
    if(!document.querySelector(".prod-modal") && !document.querySelector(".modal-overlay")){
      document.body.classList.remove("modal-open");
    }
  }

  modal.addEventListener("click", (e) => {
    if(e.target === modal){ cerrarProdModal(); return; }
    const cerrar = e.target.closest("[data-cerrar]");
    if(cerrar){
      if(e.target.closest('[data-a="add"]')){
        setTimeout(cerrarProdModal, 80);
      } else {
        cerrarProdModal();
      }
    }
  });
}