// ============================================
// Acciones del objeto A (handlers de eventos)
// ============================================
import {
  $, toast, money, hoy, fecha, hora12,
  saveCart, cartItems, updateBadges,
  marcarResenado, calcularTotales,
  setCart, setPed, setAdminOK, setEditing, setPendingImg, setPendingFoto, setTab
} from "./utils.js";

import { confirmar, abrirProducto as abrirProductoModal } from "./modales.js";

import {
  crearCategoria, borrarCategoria,
  crearProducto, actualizarProducto, borrarProducto,
  crearPedido, borrarPedido,
  crearResena, borrarResena,
  actualizarSettings,
  subirImagen,
  cargarDesdeSupabase,
  actualizarAgotado,
  actualizarEstadoPedido
} from "./supabase-data.js";

// ============================================
// Fábrica de acciones
// ============================================
export function crearAcciones(ctx){
  const { getData, getCart, getPed, getSb, draw, go } = ctx;

  return {
    // ============================================
    // CARRITO
    // ============================================
    add(id){
      const data = getData();
      const cart = getCart();
      const p = data.productos.find(x => x.id === id);
      if(!p || p.agotado) return;
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      updateBadges();
      toast(`${p.nombre} añadido al carrito`);
    },

    inc(id){
      const cart = getCart();
      cart[id] = (cart[id] || 0) + 1;
      saveCart();
      draw();
    },

    dec(id){
      const cart = getCart();
      cart[id] = (cart[id] || 0) - 1;
      if(cart[id] <= 0) delete cart[id];
      saveCart();
      draw();
    },

    rm(id){
      const cart = getCart();
      delete cart[id];
      saveCart();
      draw();
    },

    async clear(){
      const ok = await confirmar(
        "Vaciar carrito",
        "Se quitarán todos los productos de tu carrito. ¿Continuar?",
        "Sí, vaciar"
      );
      if(!ok) return;
      setCart({});
      setPed({ ...getPed(), metodoPago: "" });
      saveCart();
      draw();
    },

    filtro(id){
      ctx.setFiltro(id);
      draw();
      window.scrollTo(0, 0);
    },

    // ============================================
    // MÉTODO DE PAGO
    // ============================================
    metodoPago(id){
      const ped = getPed();
      setPed({ ...ped, metodoPago: id });
      draw();
    },

    // ============================================
    // PRODUCTO (modal)
    // ============================================
    abrirProducto(id){
      abrirProductoModal(id, getData());
    },

    // ============================================
    // RESEÑAS — enviar
    // ============================================
    async enviarResena(prodId){
      const input = document.getElementById("estrellasInput");
      const estrellas = Number(input?.dataset?.valor || 0);
      const nombre = (document.getElementById("resNombre")?.value || "").trim();
      const comentario = (document.getElementById("resComentario")?.value || "").trim();

      if(!estrellas) return toast("Elige cuántas estrellas dar.");
      if(!nombre) return toast("Escribe tu nombre.");
      if(nombre.length < 2) return toast("El nombre es muy corto.");

      const { error } = await crearResena({
        producto_id: Number(prodId),
        nombre,
        estrellas,
        comentario: comentario || null
      });

      if(error){
        toast("Error publicando: " + error.message);
        return;
      }

      marcarResenado(prodId);
      await cargarDesdeSupabase(getData());
      toast("¡Gracias por tu reseña!");

      document.querySelectorAll(".prod-modal").forEach(m => m.remove());
      abrirProductoModal(prodId, getData());
    },

    // ============================================
    // PEDIDO — enviar
    // ============================================
    async send(){
      const data = getData();
      const cart = getCart();
      const ped = getPed();
      const items = cartItems(cart, data);

      if(!items.length) return toast("Tu carrito está vacío.");
      if(!ped.nombre.trim()) return toast("Escribe tu nombre.");
      if(!ped.telefono.trim()) return toast("Escribe tu teléfono.");
      if(!ped.fecha) return toast("Elige la fecha en que quieres tu pedido.");
      if(ped.fecha < hoy()) return toast("Esa fecha ya pasó. Elige otra.");
      if(!ped.hora) return toast("Elige la hora.");
      if(!ped.metodoPago) return toast("Elige el método de pago.");

      const metodo = ped.metodoPago;
      const { subtotal, porcentaje, aplicaRecargo, recargo, total } = calcularTotales(cart, data, metodo);

      const metodoTexto = metodo === "efectivo" ? "Efectivo" : `Transferencia (+${porcentaje}%)`;

      let msg = `Hola, quiero hacer un pedido en ${data.settings.nombre}:\n\n` +
        items.map(x => `• ${x.q} x ${x.p.nombre} – ${money(x.p.precio * x.q, data)}`).join("\n") +
        `\n\nSubtotal: ${money(subtotal, data)}`;
      if(aplicaRecargo){
        msg += `\nRecargo por transferencia (${porcentaje}%): +${money(recargo, data)}`;
      }
      msg += `\n*Total a pagar: ${money(total, data)}*\n` +
        `Método de pago: ${metodoTexto}\n\n` +
        `Nombre: ${ped.nombre.trim()}\n` +
        `Teléfono: ${ped.telefono.trim()}\n` +
        `Fecha: ${fecha(ped.fecha)}\n` +
        `Hora: ${hora12(ped.hora)}` +
        (ped.notas.trim() ? `\nNotas: ${ped.notas.trim()}` : "");

      const waUrl = `https://wa.me/${(data.settings.pedidos || data.settings.telefono).replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`;

      const payload = {
        cliente_nombre: ped.nombre.trim(),
        cliente_telefono: ped.telefono.trim(),
        fecha_entrega: ped.fecha,
        hora_entrega: ped.hora,
        notas: ped.notas.trim() || null,
        productos: items.map(x => ({
          id: x.p.id,
          nombre: x.p.nombre,
          cantidad: x.q,
          precio: x.p.precio,
          subtotal: x.p.precio * x.q
        })),
        subtotal: Number(subtotal.toFixed(2)),
        recargo: Number(recargo.toFixed(2)),
        total: Number(total.toFixed(2)),
        moneda: data.settings.moneda,
        metodo_pago: metodo,
        whatsapp_url: waUrl,
        estado: "nuevo"
      };

      try{
        const { error } = await crearPedido(payload);
        if(error) throw error;
      }catch(err){
        console.error("Error guardando pedido:", err);
        toast("No se pudo guardar en el historial, pero se abrirá WhatsApp.");
      }

      window.open(waUrl, "_blank", "noopener");

      setCart({});
      saveCart();
      setPed({ nombre: "", telefono: "", fecha: "", hora: "", notas: "", metodoPago: "" });

      toast("Pedido enviado. ¡Gracias!");
      draw();
    },

    // ============================================
    // AUTH
    // ============================================
    async login(){
      const sb = getSb();
      const email = ($("#email")?.value || "").trim();
      const pw = $("#pw")?.value || "";
      if(!email) return toast("Escribe tu email.");
      if(!pw) return toast("Escribe tu contraseña.");

      const { error } = await sb.auth.signInWithPassword({ email, password: pw });
      if(error){
        toast("Email o contraseña incorrectos.");
        return;
      }
      setAdminOK(true);
      draw();
      toast("¡Bienvenida!");
    },

    togglePass(){
      const input = document.getElementById("pw");
      const icono = document.querySelector(".ojo-icono");
      if(!input || !icono) return;

      if(input.type === "password"){
        input.type = "text";
        icono.textContent = "🙈";
        icono.dataset.ojo = "abierto";
      } else {
        input.type = "password";
        icono.textContent = "👁️";
        icono.dataset.ojo = "cerrado";
      }
      input.focus();
    },

    async logout(){
      const sb = getSb();
      await sb.auth.signOut();
      setAdminOK(false);
      setEditing(null);
      go("inicio");
    },

    // ============================================
    // TABS Y NAVEGACIÓN EN EL PANEL
    // ============================================
    tab(id){
      setTab(id);
      setEditing(null);
      draw();
    },

    newprod(){
      setEditing("new");
      setPendingImg(null);
      draw();
    },

    editprod(id){
      setEditing(id);
      setPendingImg(null);
      draw();
    },

    cancelprod(){
      setEditing(null);
      setPendingImg(null);
      draw();
    },

    // ============================================
    // PRODUCTOS
    // ============================================
    async saveprod(){
      const nombre = $("#fNombre").value.trim();
      const precio = parseFloat($("#fPrecio").value);
      const catId = $("#fCat").value;
      const editing = ctx.getEditing();
      const pendingImg = ctx.getPendingImg();

      if(!nombre) return toast("Escribe el nombre del producto.");
      if(isNaN(precio) || precio < 0) return toast("Escribe un precio válido.");
      if(!catId) return toast("Elige una categoría.");

      let imgUrl = null;
      if(pendingImg){
        try{
          imgUrl = await subirImagen(pendingImg, `producto_${Date.now()}.jpg`);
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
        ({ error } = await crearProducto(payload));
      } else {
        ({ error } = await actualizarProducto(editing, payload));
      }

      if(error){
        toast("Error guardando: " + error.message);
        return;
      }

      await cargarDesdeSupabase(getData());
      setEditing(null);
      setPendingImg(null);
      toast("Producto guardado en la nube");
      draw();
    },

    async delprod(id){
      const data = getData();
      const p = data.productos.find(x => x.id === id);
      const nombre = p ? p.nombre : "este producto";
      const ok = await confirmar(
        "Borrar producto",
        `¿Seguro que quieres borrar "${nombre}"? Esta acción no se puede deshacer.`,
        "Sí, borrar"
      );
      if(!ok) return;

      const { error } = await borrarProducto(id);
      if(error){
        toast("Error borrando: " + error.message);
        return;
      }

      const cart = getCart();
      delete cart[id];
      saveCart();

      await cargarDesdeSupabase(getData());
      toast("Producto borrado de la nube");
      draw();
    },

    // ============================================
    // CATEGORÍAS
    // ============================================
    async addcat(){
      const data = getData();
      const v = $("#nCat").value.trim();
      if(!v) return toast("Escribe el nombre de la categoría.");
      if(data.categorias.includes(v)) return toast("Esa categoría ya existe.");

      const siguienteOrden = data.categorias.length + 1;
      const { error } = await crearCategoria(v, siguienteOrden);

      if(error){
        toast("Error creando categoría: " + error.message);
        return;
      }

      await cargarDesdeSupabase(getData());
      toast("Categoría creada en la nube");
      draw();
    },

    async delcat(id, boton){
      const data = getData();
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

      const { error } = await borrarCategoria(id);
      if(error){
        toast("Error borrando: " + error.message);
        return;
      }

      await cargarDesdeSupabase(getData());
      toast("Categoría borrada de la nube");
      draw();
    },

    // ============================================
    // PEDIDOS (admin)
    // ============================================
    async delpedido(id){
      const ok = await confirmar(
        "Borrar pedido",
        "¿Seguro que quieres borrar este pedido del historial? Esta acción no se puede deshacer.",
        "Sí, borrar"
      );
      if(!ok) return;

      const { error } = await borrarPedido(id);
      if(error){
        toast("Error borrando: " + error.message);
        return;
      }

      toast("Pedido borrado");
      draw();
    },

    // ============================================
    // RESEÑAS (admin)
    // ============================================
    async delresena(id){
      const ok = await confirmar(
        "Borrar reseña",
        "¿Seguro que quieres borrar esta reseña? Esta acción no se puede deshacer.",
        "Sí, borrar"
      );
      if(!ok) return;

      const { error } = await borrarResena(id);
      if(error){
        toast("Error borrando: " + error.message);
        return;
      }

      await cargarDesdeSupabase(getData());
      toast("Reseña borrada");
      draw();
    },

    // ============================================
    // AJUSTES
    // ============================================
    async savesettings(){
      const data = getData();
      const pendingFoto = ctx.getPendingFoto();

      const recargoRaw = $("#sRecargo").value.trim();
      const recargoNum = recargoRaw === "" ? 0 : parseFloat(recargoRaw);
      if(isNaN(recargoNum) || recargoNum < 0 || recargoNum > 100){
        return toast("El recargo debe ser un número entre 0 y 100.");
      }

      const upd = {
        nombre: $("#sNombre").value.trim() || data.settings.nombre,
        lema: $("#sLema").value.trim(),
        telefono: $("#sTel").value.trim(),
        pedidos: $("#sPed").value.trim(),
        grupo: $("#sGrupo").value.trim(),
        instagram: $("#sIg").value.trim(),
        facebook: $("#sFb").value.trim(),
        tiktok: $("#sTt").value.trim(),
        moneda: $("#sMon").value.trim() || "CUP",
        recargo_transferencia: recargoNum
      };

      if(pendingFoto){
        try{
          upd.foto_url = await subirImagen(pendingFoto, `perfil_${Date.now()}.jpg`);
        }catch(err){
          toast("Error subiendo foto: " + err.message);
          return;
        }
        setPendingFoto(null);
      }

      const { error } = await actualizarSettings(upd);
      if(error){
        toast("Error guardando ajustes: " + error.message);
        return;
      }

      await cargarDesdeSupabase(getData());
      toast("Ajustes guardados en la nube");
      draw();
    },

    // ============================================
    // CAMBIOS EN INPUTS (change)
    // ============================================
    async agotado(id, agotado){
      const { error } = await actualizarAgotado(id, agotado);
      if(error){
        toast("Error actualizando: " + error.message);
        return false;
      }
      await cargarDesdeSupabase(getData());
      toast(agotado ? "Marcado como agotado" : "Disponible de nuevo");
      draw();
      return true;
    },

    async estado(id, nuevoEstado){
      const { error } = await actualizarEstadoPedido(id, nuevoEstado);
      if(error){
        toast("Error actualizando: " + error.message);
        return;
      }
      toast("Estado actualizado");
      draw();
    }
  };
}