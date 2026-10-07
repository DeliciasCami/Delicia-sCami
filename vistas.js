// ============================================
// Todas las vistas de la aplicación
// ============================================
import {
  esc, money, waNum, waPedidos, link, hoy, cartItems, cartCount,
  updateBadges, fecha, hora12, ICON_ADD, head, ph,
  lineaRating, estrellasHTML
} from "./utils.js";

import { listarPedidos } from "./supabase-data.js";

// ============================================
// INICIO
// ============================================
export function vInicio(data, app){
  const s = data.settings, tel = waNum(data);
  const redes = [["Instagram", s.instagram], ["Facebook", s.facebook], ["TikTok", s.tiktok]]
    .filter(r => r[1] && r[1].trim());

  const fila = (href, t, v, ext) =>
    `<a class="fila" href="${esc(href)}" ${ext ? 'target="_blank" rel="noopener"' : ""}><b>${t}</b><span>${v}</span></a>`;

  app.innerHTML = `<div class="home">
<section class="hero"><div class="hero-in">
<div class="arch-wrap"><div class="arch"><img src="${s.foto || "foto.jpg"}" alt="${esc(s.nombre)}, repostera" onerror="this.style.visibility='hidden'"></div></div>
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
${s.grupo ? fila(link(s.grupo), "Grupo de WhatsApp", "Unirme →", 1) : ""}
${tel ? fila("https://wa.me/" + tel, "WhatsApp", esc(s.telefono), 1) : ""}
${redes.map(r => fila(link(r[1]), r[0], "Seguir →", 1)).join("")}
</section>
<footer>© ${new Date().getFullYear()} ${esc(s.nombre)} · <a href="#admin">Administrar</a></footer></div>`;
}

// ============================================
// CATÁLOGO
// ============================================
export function vCatalogo(data, app, filtroActual){
  const cats = data.categorias.filter(c => data.productos.some(p => p.cat === c));
  const filtro = (filtroActual && cats.includes(filtroActual)) ? filtroActual : "";
  const mostrar = filtro ? [filtro] : cats;

  app.innerHTML = head("Catálogo") + `<main class="page">
${cats.length ? `<div class="chips" role="group" aria-label="Categorías">
<button class="chip" data-a="filtro" data-id="" aria-pressed="${!filtro}">Todo</button>
${cats.map(c => `<button class="chip" data-a="filtro" data-id="${esc(c)}" aria-pressed="${filtro === c}">${esc(c)}</button>`).join("")}</div>` : ""}
${mostrar.map(c => `<h2 class="cat-title">${esc(c)}</h2><div class="grid">
${data.productos.filter(p => p.cat === c).map(p => `<article class="card" data-a="abrirProducto" data-id="${p.id}" style="cursor:pointer">${ph(p)}
<div class="card-b"><h3>${esc(p.nombre)}</h3><p>${esc(p.desc)}</p>
${lineaRating(p.id, data)}
<div class="card-f"><span class="price">${money(p.precio, data)}</span>
<button class="add" data-stop="1" data-a="add" data-id="${p.id}" ${p.agotado ? "disabled" : ""} aria-label="Añadir ${esc(p.nombre)} al carrito">${ICON_ADD}</button></div></div></article>`).join("")}
</div>`).join("")}
${cats.length ? "" : `<div class="empty"><h2>Pronto tendremos novedades</h2><p>Todavía no hay productos en el catálogo.</p></div>`}
</main>`;
}

// ============================================
// CARRITO
// ============================================
export function vCarrito(data, cart, ped, app){
  const items = cartItems(cart, data);
  const total = items.reduce((a, x) => a + x.p.precio * x.q, 0);

  if(!items.length){
    app.innerHTML = head("Mi carrito") + `<main class="page"><div class="empty"><h2>Tu carrito está vacío</h2><p>Elige tus dulces favoritos en el catálogo.</p><a class="btn" href="#catalogo">Ver catálogo</a></div></main>`;
    return;
  }

  app.innerHTML = head("Mi carrito") + `<main class="page" style="max-width:640px">
${items.map(({ p, q }) => `<div class="line">${ph(p)}<div><b>${esc(p.nombre)}</b><span>${money(p.precio, data)}</span>
<div class="qty"><button data-a="dec" data-id="${p.id}" aria-label="Quitar uno">−</button><span>${q}</span><button data-a="inc" data-id="${p.id}" aria-label="Añadir uno">+</button></div></div>
<div><div class="sub">${money(p.precio * q, data)}</div><button class="rm" data-a="rm" data-id="${p.id}">Quitar</button></div></div>`).join("")}
<div class="total"><span>Total</span><span>${money(total, data)}</span></div>
<section class="box"><h2>Datos de tu pedido</h2>
<label class="field"><span>Tu nombre</span><input data-ped="nombre" value="${esc(ped.nombre)}" autocomplete="name"></label>
<label class="field"><span>Tu teléfono</span><input data-ped="telefono" value="${esc(ped.telefono)}" inputmode="tel" autocomplete="tel" placeholder="+53 5123 4567"></label>
<div class="row2">
<label class="field"><span>Fecha</span><input type="date" data-ped="fecha" min="${hoy()}" value="${esc(ped.fecha)}"></label>
<label class="field"><span>Hora</span><input type="time" data-ped="hora" value="${esc(ped.hora)}"></label>
</div>
<label class="field"><span>Notas (opcional)</span><textarea rows="3" data-ped="notas" placeholder="Sabor, dedicatoria, dirección de entrega...">${esc(ped.notas)}</textarea></label>

<div class="aviso-pago">
  <div class="aviso-pago-icono">💳</div>
  <div class="aviso-pago-texto">
    <b>Forma de pago</b>
    <p>Por el momento <b>solo se acepta transferencia</b>. Al confirmar el pedido se aplicará un <b>15% adicional</b> sobre el total del encargo en concepto de gestión.</p>
  </div>
</div>

<button class="btn btn-wa" data-a="send">Enviar pedido por WhatsApp</button>
</section>
<p style="text-align:center"><button class="rm" data-a="clear">Vaciar carrito</button></p>
</main>`;
}

// ============================================
// ADMIN
// ============================================
export async function vAdmin(data, app, ctx){
  const { adminOK, sb, setAdminOK, tab, editing, draw } = ctx;

  if(!adminOK){
    const { data: { session } } = await sb.auth.getSession();
    if(session) setAdminOK(true);
  }

  if(!ctx.adminOK){
    app.innerHTML = head("Administrar") + `<main class="page" style="max-width:420px"><section class="box"><h2>Entrar al panel</h2>
<label class="field"><span>Email</span><input type="email" id="email" autocomplete="username" placeholder="tu@correo.com"></label>
<label class="field"><span>Contraseña</span><input type="password" id="pw" autocomplete="current-password"></label>
<button class="btn" data-a="login" style="width:100%">Entrar</button>
<p class="note" style="margin-top:14px">Usa el usuario que creaste en Supabase.</p></section></main>`;
    return;
  }

  const tabs = [
    ["productos", "Productos"],
    ["categorias", "Categorías"],
    ["pedidos", "Pedidos"],
    ["resenas", "Reseñas"],
    ["ajustes", "Ajustes"]
  ];

  app.innerHTML = head("Panel") + `<main class="page" style="max-width:700px">
<p class="note">Los cambios se guardan en la nube.</p>
<div class="tabs">${tabs.map(t => `<button class="chip" data-a="tab" data-id="${t[0]}" aria-pressed="${tab === t[0]}">${t[1]}</button>`).join("")}
<button class="chip" data-a="logout">Salir</button></div>
<div id="tabbody"></div></main>`;

  const tb = document.querySelector("#tabbody");

  if(tab === "productos") tb.innerHTML = editing !== null ? formProd(data, editing) : listaProd(data);
  if(tab === "categorias") tb.innerHTML = catsHtml(data);
  if(tab === "pedidos") tb.innerHTML = await pedidosHtml(data);
  if(tab === "resenas") tb.innerHTML = resenasAdminHtml(data);
  if(tab === "ajustes") tb.innerHTML = ajustesHtml(data);
}

// ---------- Sub-vistas del admin ----------
function listaProd(data){
  return `<button class="btn" data-a="newprod" style="margin-bottom:14px">Agregar producto</button>` +
    (data.productos.length
      ? data.productos.map(p => `<div class="arow">${ph(p)}<div><b>${esc(p.nombre)}</b><div>${esc(p.cat)} · ${money(p.precio, data)}</div>
<div class="acts"><button class="btn btn-sm btn-line" data-a="editprod" data-id="${p.id}">Editar</button>
<label><input type="checkbox" data-change="agotado" data-id="${p.id}" ${p.agotado ? "checked" : ""}> Agotado</label>
<button class="btn btn-sm btn-danger" data-a="delprod" data-id="${p.id}">Borrar</button></div></div></div>`).join("")
      : `<p>Aún no hay productos.</p>`);
}

function formProd(data, editing){
  const nuevo = editing === "new";
  const p = nuevo
    ? { cat: data.categorias[0] || "", nombre: "", desc: "", precio: "", img: "" }
    : data.productos.find(x => x.id === editing) || {};

  return `<section class="box"><h2>${nuevo ? "Nuevo producto" : "Editar producto"}</h2>
<label class="field"><span>Categoría</span><select id="fCat">${data.categoriasConId.map(c => `<option value="${c.id}" ${c.nombre === p.cat ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}</select></label>
<label class="field"><span>Nombre</span><input id="fNombre" value="${esc(p.nombre)}"></label>
<label class="field"><span>Descripción corta</span><textarea id="fDesc" rows="3">${esc(p.desc)}</textarea></label>
<label class="field"><span>Precio (${esc(data.settings.moneda)})</span><input id="fPrecio" type="number" min="0" step="any" inputmode="decimal" value="${esc(p.precio)}"></label>
<div class="field"><span>Foto</span>
<label class="btn btn-line btn-sm" for="fFile" style="cursor:pointer">Elegir foto</label>
<input id="fFile" class="sr" type="file" accept="image/*" data-change="imgprod">
<img id="fPrev" class="preview" alt="Vista previa de la foto" ${p.img ? `src="${p.img}"` : "hidden"}>
<small id="fMsg">${p.img ? "Toca \"Elegir foto\" para cambiarla." : "Toca \"Elegir foto\" y escoge una de tu galería."}</small></div>
<div class="acts"><button class="btn" data-a="saveprod">Guardar</button><button class="btn btn-line" data-a="cancelprod">Cancelar</button></div></section>`;
}

function catsHtml(data){
  return `<section class="box"><h2>Categorías</h2>
${data.categoriasConId.map(c => {
    const n = data.productos.filter(p => p.cat === c.nombre).length;
    return `<div class="arow" style="grid-template-columns:1fr auto"><div><b>${esc(c.nombre)}</b><div>${n} producto${n === 1 ? "" : "s"}</div></div>
<button class="btn btn-sm btn-danger" data-a="delcat" data-id="${c.id}" data-nombre="${esc(c.nombre)}">Borrar</button></div>`;
  }).join("")}
<label class="field" style="margin-top:14px"><span>Nueva categoría</span><input id="nCat" placeholder="Ej: Cheesecakes"></label>
<button class="btn" data-a="addcat">Agregar categoría</button></section>`;
}

async function pedidosHtml(data){
  const { data: pedidos, error } = await listarPedidos();

  if(error){
    return `<section class="box"><p>Error cargando pedidos: ${esc(error.message)}</p></section>`;
  }

  if(!pedidos || !pedidos.length){
    return `<section class="box"><h2>Pedidos</h2><p>Aún no hay pedidos registrados.</p></section>`;
  }

  const fechaHora = (iso) => {
    const d = new Date(iso);
    return d.toLocaleString("es", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  const etiquetas = {
    nuevo: { txt: "Nuevo", clase: "chip chip-nuevo" },
    en_preparacion: { txt: "En preparación", clase: "chip chip-prep" },
    entregado: { txt: "Entregado", clase: "chip chip-ok" },
    cancelado: { txt: "Cancelado", clase: "chip chip-cancel" }
  };

  return `<section class="box"><h2>Pedidos (${pedidos.length})</h2>
  <p style="margin:0 0 14px;color:#5b4a69;font-size:.9rem">Los más recientes aparecen primero.</p>
  ${pedidos.map(p => {
    const estado = p.estado || "nuevo";
    const et = etiquetas[estado] || etiquetas.nuevo;
    const fechaEntrega = p.fecha_entrega ? p.fecha_entrega.split("-").reverse().join("/") : "";
    const horaEntrega = p.hora_entrega ? hora12(p.hora_entrega) : "";

    const listaProd = Array.isArray(p.productos)
      ? p.productos.map(x => `• ${x.cantidad}× ${esc(x.nombre)} — ${Number(x.subtotal).toLocaleString("es")} ${esc(p.moneda)}`).join("<br>")
      : "—";

    const telLimpio = (p.cliente_telefono || "").replace(/\D/g, "");
    const waCliente = telLimpio ? `https://wa.me/${telLimpio}` : "";

    return `<div class="pedido-card">
      <div class="pedido-head">
        <div>
          <b style="font-size:1.05rem">${esc(p.cliente_nombre)}</b>
          <div style="color:#5b4a69;font-size:.9rem">
            📱 ${esc(p.cliente_telefono)}
            ${waCliente ? ` · <a href="${waCliente}" target="_blank" rel="noopener" style="color:var(--wa);font-weight:700">Abrir WhatsApp</a>` : ""}
          </div>
        </div>
        <span class="${et.clase}">${et.txt}</span>
      </div>

      <div class="pedido-info">
        <div><b>Entrega:</b> ${fechaEntrega} a las ${horaEntrega}</div>
        <div><b>Total:</b> <span class="price">${Number(p.total).toLocaleString("es")} ${esc(p.moneda)}</span></div>
        <div><b>Pedido:</b><br>${listaProd}</div>
        ${p.notas ? `<div><b>Notas:</b> ${esc(p.notas)}</div>` : ""}
        <div style="color:#9a8aa8;font-size:.82rem">Registrado el ${fechaHora(p.created_at)}</div>
      </div>

      <div class="acts pedido-acts">
        <select data-change="estado" data-id="${p.id}">
          ${["nuevo", "en_preparacion", "entregado", "cancelado"].map(e =>
            `<option value="${e}" ${e === estado ? "selected" : ""}>${etiquetas[e].txt}</option>`
          ).join("")}
        </select>
        <button class="btn btn-sm btn-danger" data-a="delpedido" data-id="${p.id}" data-nombre="${esc(p.cliente_nombre)}">Borrar</button>
      </div>
    </div>`;
  }).join("")}
  </section>`;
}

function resenasAdminHtml(data){
  const todas = [];
  for(const [prodId, arr] of Object.entries(data.resenasPorProducto)){
    const p = data.productos.find(x => String(x.id) === String(prodId));
    for(const r of arr){
      todas.push({ ...r, productoNombre: p ? p.nombre : "(producto borrado)" });
    }
  }

  if(!todas.length){
    return `<section class="box"><h2>Reseñas</h2><p>Aún no hay reseñas registradas.</p></section>`;
  }

  todas.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const total = todas.length;
  const promGeneral = (todas.reduce((a, r) => a + r.estrellas, 0) / total).toFixed(1);
  const porEstrella = [0, 0, 0, 0, 0];
  todas.forEach(r => porEstrella[r.estrellas - 1]++);

  return `<section class="box">
    <h2>Reseñas (${total})</h2>
    <div class="resumen-resenas">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:2.2rem;font-weight:700;color:var(--plum);line-height:1">${promGeneral}</div>
        <div style="color:#7a6889;font-size:.9rem">promedio general</div>
      </div>
      <div class="dist-estrellas">
        ${[5, 4, 3, 2, 1].map(n => {
          const c = porEstrella[n - 1];
          const pct = total ? Math.round((c / total) * 100) : 0;
          return `<div class="dist-row">
            <span style="min-width:44px">${n}★</span>
            <div class="dist-bar"><div class="dist-fill" style="width:${pct}%"></div></div>
            <span style="min-width:44px;text-align:right;color:#7a6889">${c}</span>
          </div>`;
        }).join("")}
      </div>
    </div>
  </section>
  <section class="box">
    <h3 style="margin-bottom:12px">Todas las reseñas</h3>
    ${todas.map(r => `
      <div class="resena-item" style="margin-bottom:10px">
        <div class="resena-head">
          <div>
            <b>${esc(r.nombre)}</b> ${estrellasHTML(r.estrellas, false)}
            <div style="color:#7a6889;font-size:.85rem;margin-top:2px">en <b>${esc(r.productoNombre)}</b></div>
          </div>
          <span class="resena-fecha">${new Date(r.created_at).toLocaleDateString("es")}</span>
        </div>
        ${r.comentario ? `<div class="resena-texto">${esc(r.comentario)}</div>` : ""}
        <div class="acts" style="margin-top:8px">
          <button class="btn btn-sm btn-danger" data-a="delresena" data-id="${r.id}">Borrar</button>
        </div>
      </div>
    `).join("")}
  </section>`;
}

function ajustesHtml(data){
  const s = data.settings;
  const f = (id, label, val, extra = "") =>
    `<label class="field"><span>${label}</span><input id="${id}" value="${esc(val)}" ${extra}></label>`;

  return `<section class="box"><h2>Ajustes</h2>
${f("sNombre", "Nombre del negocio", s.nombre)}
${f("sLema", "Frase debajo del nombre", s.lema)}
<label class="field"><span>Teléfono para dudas y sugerencias</span><input id="sTel" value="${esc(s.telefono)}" inputmode="tel"><small>Es el que se ve en la página. Con código de país.</small></label>
<label class="field"><span>WhatsApp donde recibes los pedidos</span><input id="sPed" value="${esc(s.pedidos || "")}" inputmode="tel" placeholder="Déjalo vacío para usar el mismo teléfono"><small>A este número llegan los pedidos del carrito.</small></label>
${f("sGrupo", "Enlace del grupo de WhatsApp", s.grupo, 'placeholder="https://chat.whatsapp.com/..."')}
${f("sIg", "Instagram (enlace)", s.instagram)}
${f("sFb", "Facebook (enlace)", s.facebook)}
${f("sTt", "TikTok (enlace)", s.tiktok)}
${f("sMon", "Moneda", s.moneda)}
<div class="field"><span>Mi foto</span>
<label class="btn btn-line btn-sm" for="sFile" style="cursor:pointer">Cambiar mi foto</label>
<input id="sFile" class="sr" type="file" accept="image/*" data-change="foto"><small id="sMsg"></small></div>
<button class="btn" data-a="savesettings">Guardar ajustes</button></section>`;
}