export const ESTADOS_RESERVA = {
  pendiente: { texto: "Pendiente", icono: "bi-hourglass-split" },
  aprobada: { texto: "Aprobada", icono: "bi-check-circle" },
  rechazada: { texto: "Rechazada", icono: "bi-x-circle" },
  cancelada: { texto: "Cancelada", icono: "bi-slash-circle" }
};

export const ESTADOS_ESPACIO = {
  disponible: { texto: "Disponible", icono: "bi-check-circle" },
  mantencion: { texto: "En mantención", icono: "bi-tools" },
  inactivo: { texto: "Inactivo", icono: "bi-archive" }
};

// Texto e ícono de cada tipo de evento guardado en MongoDB
export const TIPOS_EVENTO = {
  RESERVA_SOLICITADA: { texto: "Solicitud creada", icono: "bi-send", tono: "info" },
  RESERVA_APROBADA: { texto: "Reserva aprobada", icono: "bi-check-circle", tono: "exito" },
  RESERVA_RECHAZADA: { texto: "Solicitud rechazada", icono: "bi-x-circle", tono: "error" },
  RESERVA_CANCELADA: { texto: "Reserva cancelada", icono: "bi-slash-circle", tono: "neutro" },
  RESERVA_CONFLICTO: { texto: "Intento con conflicto de horario", icono: "bi-exclamation-triangle", tono: "alerta" },
  ESPACIO_CREADO: { texto: "Espacio creado", icono: "bi-plus-square", tono: "info" },
  ESPACIO_ACTUALIZADO: { texto: "Espacio actualizado", icono: "bi-pencil-square", tono: "info" },
  ESPACIO_ESTADO_CAMBIADO: { texto: "Cambio de estado de espacio", icono: "bi-toggles", tono: "alerta" },
  ESPACIO_ELIMINADO: { texto: "Espacio eliminado", icono: "bi-trash", tono: "error" },
  EDIFICIO_CREADO: { texto: "Edificio creado", icono: "bi-building-add", tono: "info" },
  EDIFICIO_ACTUALIZADO: { texto: "Edificio actualizado", icono: "bi-building-gear", tono: "info" },
  EDIFICIO_ELIMINADO: { texto: "Edificio eliminado", icono: "bi-building-dash", tono: "error" },
  EQUIPAMIENTO_CREADO: { texto: "Equipamiento creado", icono: "bi-box-seam", tono: "info" },
  EQUIPAMIENTO_ACTUALIZADO: { texto: "Equipamiento actualizado", icono: "bi-box-seam", tono: "info" },
  EQUIPAMIENTO_ELIMINADO: { texto: "Equipamiento eliminado", icono: "bi-box-seam", tono: "error" },
  SESION_INICIADA: { texto: "Inicio de sesión", icono: "bi-box-arrow-in-right", tono: "neutro" },
  SESION_FALLIDA: { texto: "Inicio de sesión fallido", icono: "bi-shield-exclamation", tono: "alerta" }
};

export function describirEvento(tipo) {
  return TIPOS_EVENTO[tipo] ?? { texto: tipo, icono: "bi-dot", tono: "neutro" };
}

export function formatearFechaHora(valor) {
  return new Date(valor).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatearFechaCorta(fechaTexto) {
  return new Date(`${fechaTexto}T12:00:00`).toLocaleDateString("es-CL", {
    weekday: "short",
    day: "numeric",
    month: "short"
  });
}

export function plural(cantidad, singular, pluralTexto = `${singular}s`) {
  return `${cantidad} ${cantidad === 1 ? singular : pluralTexto}`;
}
