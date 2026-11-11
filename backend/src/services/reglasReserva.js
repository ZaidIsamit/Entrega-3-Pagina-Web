// Reglas de negocio de las reservas.
// Son funciones puras (no tocan la base de datos) para poder probarlas con tests unitarios.
// Cada regla devuelve null si se cumple, o un objeto { codigo, mensaje } si no.

import { HORA_APERTURA, HORA_CIERRE, diferenciaDias, etiquetaHora } from "../utils/tiempo.js";

export const ANTICIPACION_MAXIMA_DIAS = 60;

export function hayTraslape(a, b) {
  return a.horaInicio < b.horaFin && b.horaInicio < a.horaFin;
}

export function validarHorario({ fecha, horaInicio, horaFin }, ahora) {
  if (horaFin <= horaInicio) {
    return { codigo: "HORARIO_INVALIDO", mensaje: "La hora de término debe ser posterior a la de inicio." };
  }
  if (horaInicio < HORA_APERTURA || horaFin > HORA_CIERRE) {
    return {
      codigo: "FUERA_DE_HORARIO",
      mensaje: `Los espacios se reservan entre ${etiquetaHora(HORA_APERTURA)} y ${etiquetaHora(HORA_CIERRE)}.`
    };
  }
  if (fecha < ahora.fecha || (fecha === ahora.fecha && horaInicio <= ahora.hora)) {
    return { codigo: "HORARIO_PASADO", mensaje: "No se puede reservar un bloque que ya comenzó o pasó." };
  }
  if (diferenciaDias(ahora.fecha, fecha) > ANTICIPACION_MAXIMA_DIAS) {
    return {
      codigo: "FECHA_MUY_LEJANA",
      mensaje: `Solo se puede reservar con hasta ${ANTICIPACION_MAXIMA_DIAS} días de anticipación.`
    };
  }
  return null;
}

export function validarDuracionPorRol(duracion, rol) {
  if (duracion > rol.maxHorasReserva) {
    return {
      codigo: "DURACION_EXCEDIDA",
      mensaje: `Tu rol (${rol.nombre}) permite reservar como máximo ${rol.maxHorasReserva} horas seguidas.`
    };
  }
  return null;
}

export function validarCapacidad(personas, espacio) {
  if (personas > espacio.capacidad) {
    return {
      codigo: "CAPACIDAD_EXCEDIDA",
      mensaje: `${espacio.nombre} tiene capacidad para ${espacio.capacidad} personas.`
    };
  }
  return null;
}

export function validarEspacioReservable(espacio) {
  if (espacio.estado === "mantencion") {
    return { codigo: "ESPACIO_EN_MANTENCION", mensaje: `${espacio.nombre} está en mantención y no se puede reservar.` };
  }
  if (espacio.estado !== "disponible") {
    return { codigo: "ESPACIO_NO_DISPONIBLE", mensaje: `${espacio.nombre} no está disponible para reservas.` };
  }
  return null;
}

// Docentes y administración quedan aprobados de inmediato;
// estudiantes y organizaciones quedan pendientes hasta que la administración revise.
export function estadoInicial(rol) {
  return rol.requiereAprobacion ? "pendiente" : "aprobada";
}

function yaComenzo(reserva, ahora) {
  return reserva.fecha < ahora.fecha || (reserva.fecha === ahora.fecha && reserva.horaInicio <= ahora.hora);
}

export function validarCancelacion(reserva, usuario, ahora) {
  const esDueno = reserva.solicitante.id === usuario.id;
  if (!esDueno && !usuario.rol.esAdmin) {
    return { codigo: "SIN_PERMISO", mensaje: "Solo puedes cancelar tus propias reservas." };
  }
  if (!["pendiente", "aprobada"].includes(reserva.estado)) {
    return { codigo: "ESTADO_INVALIDO", mensaje: `La reserva está ${reserva.estado} y ya no se puede cancelar.` };
  }
  if (yaComenzo(reserva, ahora)) {
    return { codigo: "RESERVA_INICIADA", mensaje: "La reserva ya comenzó o terminó; no se puede cancelar." };
  }
  return null;
}

// accion: "aprobar" | "rechazar". Una solicitud vencida se puede rechazar, pero no aprobar.
export function validarRevision(reserva, ahora, accion) {
  if (reserva.estado !== "pendiente") {
    return { codigo: "ESTADO_INVALIDO", mensaje: `Solo se pueden revisar solicitudes pendientes (esta está ${reserva.estado}).` };
  }
  if (accion === "aprobar" && yaComenzo(reserva, ahora)) {
    return { codigo: "RESERVA_INICIADA", mensaje: "El horario de la solicitud ya pasó; no se puede aprobar." };
  }
  return null;
}
