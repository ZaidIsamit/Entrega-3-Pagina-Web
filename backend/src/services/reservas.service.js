import { env } from "../config/env.js";
import * as reservasRepo from "../repositories/reservas.repository.js";
import { ErrorApp, errores } from "../utils/errores.js";
import { HORA_APERTURA, HORA_CIERRE, ahoraEnZona, etiquetaHora } from "../utils/tiempo.js";
import * as actividad from "./actividad.service.js";
import { obtenerEspacio } from "./infraestructura.service.js";
import * as reglas from "./reglasReserva.js";

const ahora = () => ahoraEnZona(env.zonaHoraria);

function etiquetaReserva(r) {
  return `${r.espacio.nombre} · ${r.fecha} ${etiquetaHora(r.horaInicio)}–${etiquetaHora(r.horaFin)}`;
}

function fallaRegla(resultado) {
  if (!resultado) return;
  if (resultado.codigo === "SIN_PERMISO") throw errores.sinPermiso(resultado.mensaje);
  throw errores.reglaNegocio(resultado.codigo, resultado.mensaje);
}

async function obtenerReserva(id) {
  const reserva = await reservasRepo.buscarPorId(id);
  if (!reserva) throw errores.noEncontrado("La reserva");
  return reserva;
}

// ---------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------

// Bloques ocupados de todos los espacios de una sede (para las tarjetas del catálogo).
export async function ocupacion({ sedeId, fecha }, usuario) {
  const filas = await reservasRepo.ocupacionPorSede(sedeId, fecha);
  return filas.map((f) => ({
    espacioId: f.espacio_id,
    horaInicio: f.hora_inicio,
    horaFin: f.hora_fin,
    estado: f.estado,
    propia: f.usuario_id === usuario.id,
    reservaId: f.usuario_id === usuario.id || usuario.rol.esAdmin ? f.id : null
  }));
}

// Estado de cada bloque horario de un espacio en una fecha.
export async function disponibilidad(espacioId, fecha, usuario) {
  const espacio = await obtenerEspacio(espacioId);
  const ocupadas = await reservasRepo.ocupacionPorEspacio(espacioId, fecha);
  const momento = ahora();

  const bloques = [];
  for (let hora = HORA_APERTURA; hora < HORA_CIERRE; hora++) {
    const reserva = ocupadas.find((r) => hora >= r.hora_inicio && hora < r.hora_fin);
    let estado = "libre";
    if (fecha < momento.fecha || (fecha === momento.fecha && hora <= momento.hora)) estado = "pasado";
    else if (reserva && reserva.usuario_id === usuario.id) estado = "mio";
    else if (reserva) estado = reserva.estado === "pendiente" ? "pendiente" : "ocupado";
    bloques.push({ hora, estado });
  }

  return {
    espacio: { id: espacio.id, nombre: espacio.nombre, estado: espacio.estado, capacidad: espacio.capacidad },
    fecha,
    reservable: espacio.estado === "disponible",
    maxHorasRol: usuario.rol.maxHorasReserva,
    bloques
  };
}

export async function misReservas(usuario, { alcance, estado }) {
  return reservasRepo.listar({
    usuarioId: usuario.id,
    estado,
    alcance: alcance === "todas" ? undefined : alcance,
    hoy: ahora().fecha
  });
}

export function listarTodas(filtros) {
  return reservasRepo.listar(filtros);
}

export async function obtener(id, usuario) {
  const reserva = await obtenerReserva(id);
  if (reserva.solicitante.id !== usuario.id && !usuario.rol.esAdmin) {
    throw errores.sinPermiso("Solo puedes ver tus propias reservas.");
  }
  return reserva;
}

// ---------------------------------------------------------------------
// Crear una solicitud de reserva
// ---------------------------------------------------------------------
export async function crear(datos, ctx) {
  const { usuario } = ctx;
  const espacio = await obtenerEspacio(datos.espacioId);
  const solicitud = {
    espacioId: espacio.id,
    fecha: datos.fecha,
    horaInicio: datos.horaInicio,
    horaFin: datos.horaInicio + datos.duracion
  };

  fallaRegla(reglas.validarEspacioReservable(espacio));
  fallaRegla(reglas.validarHorario(solicitud, ahora()));
  fallaRegla(reglas.validarDuracionPorRol(datos.duracion, usuario.rol));
  fallaRegla(reglas.validarCapacidad(datos.personas, espacio));

  // Regla principal: evitar la doble reserva del espacio.
  // Se revisa aquí para dar un mensaje claro, y además la restricción EXCLUDE de PostgreSQL
  // lo garantiza si dos personas reservan exactamente al mismo tiempo.
  const choque = await reservasRepo.buscarTraslapeEspacio(solicitud);
  if (choque) {
    await registrarConflicto(ctx, espacio, solicitud, "espacio_ocupado");
    throw errores.conflicto(
      `${espacio.nombre} ya está reservado de ${etiquetaHora(choque.hora_inicio)} a ${etiquetaHora(choque.hora_fin)} ese día.`,
      { horaInicio: choque.hora_inicio, horaFin: choque.hora_fin }
    );
  }

  // Una persona no puede estar en dos espacios a la vez.
  const propia = await reservasRepo.buscarTraslapeUsuario({ ...solicitud, usuarioId: usuario.id });
  if (propia) {
    await registrarConflicto(ctx, espacio, solicitud, "usuario_con_reserva");
    throw errores.conflicto(
      `Ya tienes una reserva en ese horario: ${propia.espacio_nombre} de ${etiquetaHora(propia.hora_inicio)} a ${etiquetaHora(propia.hora_fin)}.`
    );
  }

  const estado = reglas.estadoInicial(usuario.rol);
  let reserva;
  try {
    reserva = await reservasRepo.crear({
      ...solicitud,
      usuarioId: usuario.id,
      personas: datos.personas,
      motivo: datos.motivo,
      estado
    });
  } catch (error) {
    if (error.code === "23P01") await registrarConflicto(ctx, espacio, solicitud, "carrera_simultanea");
    throw error;
  }

  const entidad = { tipo: "reserva", id: reserva.id, etiqueta: etiquetaReserva(reserva) };
  await actividad.registrar(ctx, {
    tipo: "RESERVA_SOLICITADA",
    categoria: "reserva",
    entidad,
    detalle: {
      espacio: { id: espacio.id, nombre: espacio.nombre },
      fecha: reserva.fecha,
      horaInicio: reserva.horaInicio,
      horaFin: reserva.horaFin,
      personas: reserva.personas,
      motivo: reserva.motivo,
      estadoInicial: estado
    }
  });
  if (estado === "aprobada") {
    await actividad.registrar(ctx, {
      tipo: "RESERVA_APROBADA",
      categoria: "reserva",
      entidad,
      detalle: { automatica: true, razon: `El rol ${usuario.rol.nombre} no requiere aprobación.` }
    });
  }
  return reserva;
}

function registrarConflicto(ctx, espacio, solicitud, motivo) {
  return actividad.registrar(ctx, {
    tipo: "RESERVA_CONFLICTO",
    categoria: "reserva",
    entidad: { tipo: "espacio", id: espacio.id, etiqueta: espacio.nombre },
    detalle: {
      motivo,
      espacio: { id: espacio.id, nombre: espacio.nombre },
      fecha: solicitud.fecha,
      horaInicio: solicitud.horaInicio,
      horaFin: solicitud.horaFin
    }
  });
}

// ---------------------------------------------------------------------
// Flujo de revisión: aprobar, rechazar y cancelar
// ---------------------------------------------------------------------
async function cambiarEstado(reserva, estadosEsperados, cambios) {
  const actualizada = await reservasRepo.cambiarEstado(reserva.id, estadosEsperados, cambios);
  if (!actualizada) {
    throw new ErrorApp(409, "ESTADO_CAMBIADO", "La reserva fue modificada por otra persona. Actualiza la página.");
  }
  return actualizada;
}

export async function aprobar(id, ctx) {
  const reserva = await obtenerReserva(id);
  fallaRegla(reglas.validarRevision(reserva, ahora(), "aprobar"));
  const actualizada = await cambiarEstado(reserva, ["pendiente"], { estado: "aprobada", revisadaPor: ctx.usuario.id });
  await actividad.registrar(ctx, {
    tipo: "RESERVA_APROBADA",
    categoria: "reserva",
    entidad: { tipo: "reserva", id, etiqueta: etiquetaReserva(reserva) },
    detalle: { estadoAnterior: "pendiente", solicitante: reserva.solicitante.nombre }
  });
  return actualizada;
}

export async function rechazar(id, motivo, ctx) {
  const reserva = await obtenerReserva(id);
  fallaRegla(reglas.validarRevision(reserva, ahora(), "rechazar"));
  const actualizada = await cambiarEstado(reserva, ["pendiente"], {
    estado: "rechazada",
    motivoRechazo: motivo,
    revisadaPor: ctx.usuario.id
  });
  await actividad.registrar(ctx, {
    tipo: "RESERVA_RECHAZADA",
    categoria: "reserva",
    entidad: { tipo: "reserva", id, etiqueta: etiquetaReserva(reserva) },
    detalle: { estadoAnterior: "pendiente", motivo, solicitante: reserva.solicitante.nombre }
  });
  return actualizada;
}

export async function cancelar(id, motivo, ctx) {
  const reserva = await obtenerReserva(id);
  fallaRegla(reglas.validarCancelacion(reserva, ctx.usuario, ahora()));
  const actualizada = await cambiarEstado(reserva, ["pendiente", "aprobada"], { estado: "cancelada" });
  await actividad.registrar(ctx, {
    tipo: "RESERVA_CANCELADA",
    categoria: "reserva",
    entidad: { tipo: "reserva", id, etiqueta: etiquetaReserva(reserva) },
    detalle: {
      estadoAnterior: reserva.estado,
      motivo,
      canceladaPorAdministracion: reserva.solicitante.id !== ctx.usuario.id
    }
  });
  return actualizada;
}
