import { env } from "../config/env.js";
import * as eventosRepo from "../repositories/eventos.repository.js";
import * as indicadoresRepo from "../repositories/indicadores.repository.js";
import { HORA_APERTURA, HORA_CIERRE, ahoraEnZona, diferenciaDias, sumarDias } from "../utils/tiempo.js";

const HORAS_POR_DIA = HORA_CIERRE - HORA_APERTURA;
const porcentaje = (parte, total) => (total > 0 ? Math.round((parte / total) * 1000) / 10 : 0);

// Panel de utilización. Por defecto: los últimos 30 días y los próximos 14.
export async function panel({ desde, hasta, sedeId }) {
  const hoy = ahoraEnZona(env.zonaHoraria).fecha;
  desde ??= sumarDias(hoy, -30);
  hasta ??= sumarDias(hoy, 14);
  sedeId ??= null;
  const dias = diferenciaDias(desde, hasta) + 1;

  // PostgreSQL: datos transaccionales (estado actual de las reservas)
  const [estados, tiempoRespuesta, espaciosReservables, porEspacio, porTipo, porHora, porDia] = await Promise.all([
    indicadoresRepo.resumenPorEstado(desde, hasta, sedeId),
    indicadoresRepo.tiempoMedioRespuestaHoras(desde, hasta, sedeId),
    indicadoresRepo.contarEspaciosReservables(sedeId),
    indicadoresRepo.usoPorEspacio(desde, hasta, sedeId),
    indicadoresRepo.usoPorTipo(desde, hasta, sedeId),
    indicadoresRepo.usoPorHora(desde, hasta, sedeId),
    indicadoresRepo.solicitudesPorDia(desde, hasta, sedeId)
  ]);

  // MongoDB: actividad e intentos fallidos (no existen como filas en SQL)
  const inicio = new Date(`${desde}T00:00:00Z`);
  const fin = new Date(`${hasta}T23:59:59Z`);
  const [eventosPorTipo, demandaInsatisfecha] = await Promise.all([
    eventosRepo.contarPorTipo(inicio, fin).catch(() => []),
    eventosRepo.conflictosPorEspacio(inicio, fin).catch(() => [])
  ]);

  const conteo = Object.fromEntries(["pendiente", "aprobada", "rechazada", "cancelada"].map((e) => [e, 0]));
  let horasAprobadas = 0;
  for (const fila of estados) {
    conteo[fila.estado] = fila.cantidad;
    if (fila.estado === "aprobada") horasAprobadas = fila.horas;
  }
  const total = Object.values(conteo).reduce((a, b) => a + b, 0);
  const horasDisponibles = espaciosReservables * HORAS_POR_DIA * dias;

  return {
    periodo: { desde, hasta, dias, sedeId },
    resumen: {
      totalSolicitudes: total,
      porEstado: conteo,
      horasAprobadas,
      horasDisponibles,
      tasaOcupacion: porcentaje(horasAprobadas, horasDisponibles),
      tasaAprobacion: porcentaje(conteo.aprobada, conteo.aprobada + conteo.rechazada),
      tasaCancelacion: porcentaje(conteo.cancelada, total),
      tiempoMedioRespuestaHoras: tiempoRespuesta,
      espaciosReservables
    },
    porEspacio: porEspacio.map((e) => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      tipo: e.tipo,
      color: e.tipo_color,
      edificio: e.edificio,
      reservas: e.reservas,
      horas: e.horas,
      cancelaciones: e.cancelaciones,
      ocupacion: porcentaje(e.horas, HORAS_POR_DIA * dias)
    })),
    porTipo: porTipo.map((t) => ({ tipo: t.tipo, color: t.color, reservas: t.reservas, horas: t.horas })),
    porHora: porHora.map((h) => ({ hora: h.hora, reservas: h.reservas })),
    porDia: porDia.map((d) => ({ fecha: d.fecha, solicitudes: d.solicitudes, horasAprobadas: d.horas_aprobadas })),
    actividad: { eventosPorTipo, demandaInsatisfecha }
  };
}
