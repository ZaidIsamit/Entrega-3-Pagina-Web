export const HORA_APERTURA = 8;
export const HORA_CIERRE = 21;

export const HORAS = Array.from(
  { length: HORA_CIERRE - HORA_APERTURA },
  (_, i) => HORA_APERTURA + i
);

export function fechaISO(fecha = new Date()) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, "0");
  const d = String(fecha.getDate()).padStart(2, "0");
  return `${a}-${m}-${d}`;
}

export function sumarDias(fechaTexto, dias) {
  const fecha = new Date(`${fechaTexto}T12:00:00`);
  fecha.setDate(fecha.getDate() + dias);
  return fechaISO(fecha);
}

export function diferenciaDias(desde, hasta) {
  const ms = new Date(`${hasta}T12:00:00`) - new Date(`${desde}T12:00:00`);
  return Math.round(ms / 86400000);
}

export function etiquetaHora(hora) {
  return `${String(hora).padStart(2, "0")}:00`;
}

export function rangoHorario(hora, duracion) {
  return `${etiquetaHora(hora)} – ${etiquetaHora(hora + duracion)}`;
}

export function esHoraPasada(fechaTexto, hora) {
  return new Date(`${fechaTexto}T${etiquetaHora(hora)}:00`).getTime() < Date.now();
}

export function formatearFechaLarga(fechaTexto) {
  const texto = new Date(`${fechaTexto}T12:00:00`).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
