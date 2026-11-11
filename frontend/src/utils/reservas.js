import { HORAS, esHoraPasada } from "./fechas.js";

// "ocupacion" es la respuesta de GET /api/reservas/ocupacion:
// [{ espacioId, horaInicio, horaFin, estado: "pendiente" | "aprobada", propia }]

export function reservaEnBloque(ocupacion, espacioId, hora) {
  return ocupacion.find((r) => r.espacioId === espacioId && hora >= r.horaInicio && hora < r.horaFin);
}

export function horasLibresConsecutivas(ocupacion, espacioId, fecha, horaInicio) {
  let horas = 0;
  for (const hora of HORAS.filter((h) => h >= horaInicio)) {
    if (esHoraPasada(fecha, hora) || reservaEnBloque(ocupacion, espacioId, hora)) break;
    horas++;
  }
  return horas;
}

// libre · ocupado (aprobada de otra persona) · pendiente (solicitud de otra persona en revisión)
// mio (reserva propia) · pasado
export function estadoBloque(ocupacion, espacioId, fecha, hora) {
  if (esHoraPasada(fecha, hora)) return "pasado";
  const reserva = reservaEnBloque(ocupacion, espacioId, hora);
  if (!reserva) return "libre";
  if (reserva.propia) return "mio";
  return reserva.estado === "pendiente" ? "pendiente" : "ocupado";
}

export function estadosDelDia(ocupacion, espacioId, fecha) {
  return Object.fromEntries(HORAS.map((hora) => [hora, estadoBloque(ocupacion, espacioId, fecha, hora)]));
}
