import * as catalogosRepo from "../repositories/catalogos.repository.js";
import * as edificiosRepo from "../repositories/edificios.repository.js";
import * as equipamientoRepo from "../repositories/equipamiento.repository.js";
import * as espaciosRepo from "../repositories/espacios.repository.js";
import { errores } from "../utils/errores.js";
import * as actividad from "./actividad.service.js";

// ======================= Catálogos =======================
export const listarSedes = () => catalogosRepo.listarSedes();
export const listarTiposEspacio = () => catalogosRepo.listarTiposEspacio();

// ======================= Edificios =======================
export const listarEdificios = (filtros) => edificiosRepo.listar(filtros);

async function obtenerEdificio(id) {
  const edificio = await edificiosRepo.buscarPorId(id);
  if (!edificio) throw errores.noEncontrado("El edificio");
  return edificio;
}

async function exigirSede(sedeId) {
  if (!(await catalogosRepo.buscarSede(sedeId))) {
    throw errores.solicitudInvalida("La sede indicada no existe.", [{ campo: "sedeId", mensaje: "Sede inexistente." }]);
  }
}

export async function crearEdificio(datos, ctx) {
  await exigirSede(datos.sedeId);
  const edificio = await edificiosRepo.crear(datos);
  await actividad.registrar(ctx, {
    tipo: "EDIFICIO_CREADO",
    categoria: "infraestructura",
    entidad: { tipo: "edificio", id: edificio.id, etiqueta: edificio.nombre },
    detalle: { datos }
  });
  return edificio;
}

export async function actualizarEdificio(id, datos, ctx) {
  const antes = await obtenerEdificio(id);
  await exigirSede(datos.sedeId);
  const despues = await edificiosRepo.actualizar(id, datos);
  await actividad.registrar(ctx, {
    tipo: "EDIFICIO_ACTUALIZADO",
    categoria: "infraestructura",
    entidad: { tipo: "edificio", id, etiqueta: despues.nombre },
    detalle: {
      cambios: actividad.diferencias(
        { ...antes, sedeId: antes.sede.id },
        datos,
        ["sedeId", "nombre", "direccion", "pisos"]
      )
    }
  });
  return despues;
}

export async function eliminarEdificio(id, ctx) {
  const edificio = await obtenerEdificio(id);
  if ((await edificiosRepo.contarEspacios(id)) > 0) {
    throw errores.conflicto("No se puede eliminar un edificio que tiene espacios. Elimina o mueve sus espacios primero.");
  }
  await edificiosRepo.eliminar(id);
  await actividad.registrar(ctx, {
    tipo: "EDIFICIO_ELIMINADO",
    categoria: "infraestructura",
    entidad: { tipo: "edificio", id, etiqueta: edificio.nombre },
    detalle: { edificio }
  });
}

// ======================= Equipamiento =======================
export const listarEquipamiento = () => equipamientoRepo.listar();

async function obtenerEquipamiento(id) {
  const item = await equipamientoRepo.buscarPorId(id);
  if (!item) throw errores.noEncontrado("El equipamiento");
  return item;
}

export async function crearEquipamiento(datos, ctx) {
  const item = await equipamientoRepo.crear(datos);
  await actividad.registrar(ctx, {
    tipo: "EQUIPAMIENTO_CREADO",
    categoria: "infraestructura",
    entidad: { tipo: "equipamiento", id: item.id, etiqueta: item.nombre }
  });
  return item;
}

export async function actualizarEquipamiento(id, datos, ctx) {
  const antes = await obtenerEquipamiento(id);
  const despues = await equipamientoRepo.actualizar(id, datos);
  await actividad.registrar(ctx, {
    tipo: "EQUIPAMIENTO_ACTUALIZADO",
    categoria: "infraestructura",
    entidad: { tipo: "equipamiento", id, etiqueta: despues.nombre },
    detalle: { cambios: actividad.diferencias(antes, despues, ["nombre", "icono"]) }
  });
  return despues;
}

export async function eliminarEquipamiento(id, ctx) {
  const item = await obtenerEquipamiento(id);
  if (item.totalEspacios > 0) {
    throw errores.conflicto(`"${item.nombre}" está asignado a ${item.totalEspacios} espacio(s). Quítalo de esos espacios primero.`);
  }
  await equipamientoRepo.eliminar(id);
  await actividad.registrar(ctx, {
    tipo: "EQUIPAMIENTO_ELIMINADO",
    categoria: "infraestructura",
    entidad: { tipo: "equipamiento", id, etiqueta: item.nombre }
  });
}

// ======================= Espacios =======================
export const listarEspacios = (filtros) => espaciosRepo.listar(filtros);

export async function obtenerEspacio(id) {
  const espacio = await espaciosRepo.buscarPorId(id);
  if (!espacio) throw errores.noEncontrado("El espacio");
  return espacio;
}

// Verifica que las referencias (tipo, edificio, equipamiento) existan antes de guardar
// y que el piso no supere los pisos del edificio.
async function validarReferenciasEspacio(datos) {
  const detalles = [];
  if (!(await catalogosRepo.buscarTipoEspacio(datos.tipoId))) {
    detalles.push({ campo: "tipoId", mensaje: "El tipo de espacio no existe." });
  }
  const edificio = await edificiosRepo.buscarPorId(datos.edificioId);
  if (!edificio) {
    detalles.push({ campo: "edificioId", mensaje: "El edificio no existe." });
  } else if (datos.piso > edificio.pisos) {
    detalles.push({ campo: "piso", mensaje: `${edificio.nombre} tiene ${edificio.pisos} piso(s).` });
  }
  const ids = datos.equipamiento.map((e) => e.equipamientoId);
  if (ids.length && (await equipamientoRepo.contarExistentes(ids)) !== ids.length) {
    detalles.push({ campo: "equipamiento", mensaje: "Hay equipamiento que no existe." });
  }
  if (detalles.length) throw errores.solicitudInvalida("Revisa los datos del espacio.", detalles);
}

function resumenEspacio(e) {
  return {
    codigo: e.codigo,
    nombre: e.nombre,
    tipoId: e.tipo.id,
    edificioId: e.edificio.id,
    piso: e.piso,
    capacidad: e.capacidad,
    exterior: e.exterior,
    estado: e.estado,
    descripcion: e.descripcion,
    equipamiento: e.equipamiento.map((q) => `${q.nombre} x${q.cantidad}`)
  };
}

export async function crearEspacio(datos, ctx) {
  await validarReferenciasEspacio(datos);
  const espacio = await espaciosRepo.crear(datos);
  await actividad.registrar(ctx, {
    tipo: "ESPACIO_CREADO",
    categoria: "infraestructura",
    entidad: { tipo: "espacio", id: espacio.id, etiqueta: `${espacio.codigo} · ${espacio.nombre}` },
    detalle: { datos: resumenEspacio(espacio) }
  });
  return espacio;
}

export async function actualizarEspacio(id, datos, ctx) {
  const antes = await obtenerEspacio(id);
  await validarReferenciasEspacio(datos);
  const despues = await espaciosRepo.actualizar(id, datos);
  const cambios = actividad.diferencias(resumenEspacio(antes), resumenEspacio(despues), Object.keys(resumenEspacio(antes)));
  await actividad.registrar(ctx, {
    tipo: antes.estado !== despues.estado ? "ESPACIO_ESTADO_CAMBIADO" : "ESPACIO_ACTUALIZADO",
    categoria: "infraestructura",
    entidad: { tipo: "espacio", id, etiqueta: `${despues.codigo} · ${despues.nombre}` },
    detalle: { cambios }
  });
  return despues;
}

// Un espacio con reservas no se borra (se perdería el historial); se debe marcar como inactivo.
export async function eliminarEspacio(id, ctx) {
  const espacio = await obtenerEspacio(id);
  if ((await espaciosRepo.contarReservas(id)) > 0) {
    throw errores.conflicto(
      "El espacio tiene reservas registradas. Para darlo de baja cambia su estado a \"inactivo\"."
    );
  }
  await espaciosRepo.eliminar(id);
  await actividad.registrar(ctx, {
    tipo: "ESPACIO_ELIMINADO",
    categoria: "infraestructura",
    entidad: { tipo: "espacio", id, etiqueta: `${espacio.codigo} · ${espacio.nombre}` },
    detalle: { datos: resumenEspacio(espacio) }
  });
}
