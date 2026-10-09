// ============================================
// CRUD contra Supabase
// ============================================
import { sb } from "./supabase.js";
import { DEFAULTS, toast } from "./utils.js";

export async function cargarDesdeSupabase(dataRef){
  try{
    const [cats, prods, sett, res] = await Promise.all([
      sb.from("categorias").select("*").order("orden"),
      sb.from("productos").select("*").order("created_at"),
      sb.from("settings").select("*").eq("id", 1).single(),
      sb.from("resenas").select("*").order("created_at", { ascending: false })
    ]);

    if(cats.error) throw cats.error;
    if(prods.error) throw prods.error;
    if(sett.error) throw sett.error;
    if(res.error) throw res.error;

    const base = DEFAULTS();

    dataRef.categorias = cats.data.map(c => c.nombre);
    dataRef.categoriasConId = cats.data.map(c => ({ id: c.id, nombre: c.nombre }));

    dataRef.productos = prods.data.map(p => ({
      id: String(p.id),
      cat: cats.data.find(c => c.id === p.categoria_id)?.nombre || "",
      nombre: p.nombre,
      desc: p.descripcion || "",
      precio: Number(p.precio),
      img: p.img_url || "",
      agotado: !!p.agotado
    }));

    dataRef.settings = {
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
      foto: sett.data.foto_url || "",
      recargoTransferencia: Number(sett.data.recargo_transferencia ?? 15)
    };

    dataRef.resenasPorProducto = {};
    for(const r of res.data){
      const key = String(r.producto_id);
      if(!dataRef.resenasPorProducto[key]) dataRef.resenasPorProducto[key] = [];
      dataRef.resenasPorProducto[key].push(r);
    }

    return true;
  }catch(err){
    toast("Error de conexión: " + err.message);
    return false;
  }
}

// ============================================
// CATEGORÍAS
// ============================================
export async function crearCategoria(nombre, orden){
  return await sb.from("categorias").insert({ nombre, orden });
}

export async function borrarCategoria(id){
  return await sb.from("categorias").delete().eq("id", Number(id));
}

// ============================================
// PRODUCTOS
// ============================================
export async function crearProducto(payload){
  return await sb.from("productos").insert(payload);
}

export async function actualizarProducto(id, payload){
  return await sb.from("productos").update(payload).eq("id", Number(id));
}

export async function borrarProducto(id){
  return await sb.from("productos").delete().eq("id", Number(id));
}

export async function actualizarAgotado(id, agotado){
  return await sb.from("productos").update({ agotado }).eq("id", Number(id));
}

// ============================================
// PEDIDOS
// ============================================
export async function crearPedido(payload){
  return await sb.from("pedidos").insert(payload);
}

export async function borrarPedido(id){
  return await sb.from("pedidos").delete().eq("id", Number(id));
}

export async function actualizarEstadoPedido(id, estado){
  return await sb.from("pedidos").update({ estado }).eq("id", Number(id));
}

export async function listarPedidos(){
  return await sb.from("pedidos").select("*").order("created_at", { ascending: false });
}

// ============================================
// RESEÑAS
// ============================================
export async function crearResena(payload){
  return await sb.from("resenas").insert(payload);
}

export async function borrarResena(id){
  return await sb.from("resenas").delete().eq("id", Number(id));
}

// ============================================
// SETTINGS
// ============================================
export async function actualizarSettings(payload){
  return await sb.from("settings").update(payload).eq("id", 1);
}

// ============================================
// STORAGE
// ============================================
export async function subirImagen(dataUrl, path){
  const blob = await (await fetch(dataUrl)).blob();
  const up = await sb.storage.from("productos").upload(path, blob, { upsert: true });
  if(up.error) throw up.error;
  return sb.storage.from("productos").getPublicUrl(path).data.publicUrl;
}