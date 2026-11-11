// Fecha y hora "de la universidad" (America/Santiago), sin depender de la zona horaria
// en la que corra el contenedor.

export const HORA_APERTURA = 8;
export const HORA_CIERRE = 21;

export function ahoraEnZona(zonaHoraria, instante = new Date()) {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: zonaHoraria,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(instante)
      .map((p) => [p.type, p.value])
  );
  return { fecha: `${partes.year}-${partes.month}-${partes.day}`, hora: Number(partes.hour) };
}

export function sumarDias(fechaTexto, dias) {
  const fecha = new Date(`${fechaTexto}T12:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

export function diferenciaDias(desde, hasta) {
  const ms = new Date(`${hasta}T12:00:00Z`) - new Date(`${desde}T12:00:00Z`);
  return Math.round(ms / 86400000);
}

export function etiquetaHora(hora) {
  return `${String(hora).padStart(2, "0")}:00`;
}
