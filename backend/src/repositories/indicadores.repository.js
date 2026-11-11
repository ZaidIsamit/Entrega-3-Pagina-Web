import { consultar } from "../config/postgres.js";
import { HORA_APERTURA, HORA_CIERRE } from "../utils/tiempo.js";

// Filtro común: rango de fechas y, opcionalmente, una sede.
// $1 = desde, $2 = hasta, $3 = sedeId (o NULL para todas)
const FILTRO_RESERVAS = `
  FROM reservas r
  JOIN espacios e ON e.id = r.espacio_id
  JOIN edificios ed ON ed.id = e.edificio_id
  WHERE r.fecha BETWEEN $1 AND $2 AND ($3::varchar IS NULL OR ed.sede_id = $3)`;

export async function resumenPorEstado(desde, hasta, sedeId) {
  const { rows } = await consultar(
    `SELECT r.estado, COUNT(*) AS cantidad, COALESCE(SUM(r.hora_fin - r.hora_inicio), 0) AS horas
     ${FILTRO_RESERVAS}
     GROUP BY r.estado`,
    [desde, hasta, sedeId]
  );
  return rows;
}

export async function tiempoMedioRespuestaHoras(desde, hasta, sedeId) {
  const { rows } = await consultar(
    `SELECT ROUND(AVG(EXTRACT(EPOCH FROM (r.revisada_en - r.creada_en)) / 3600)::numeric, 1) AS horas
     ${FILTRO_RESERVAS} AND r.revisada_en IS NOT NULL`,
    [desde, hasta, sedeId]
  );
  return rows[0].horas;
}

export async function contarEspaciosReservables(sedeId) {
  const { rows } = await consultar(
    `SELECT COUNT(*) AS total FROM espacios e JOIN edificios ed ON ed.id = e.edificio_id
     WHERE e.estado = 'disponible' AND ($1::varchar IS NULL OR ed.sede_id = $1)`,
    [sedeId]
  );
  return rows[0].total;
}

export async function usoPorEspacio(desde, hasta, sedeId) {
  const { rows } = await consultar(
    `SELECT e.id, e.codigo, e.nombre, t.nombre AS tipo, t.color AS tipo_color, ed.nombre AS edificio,
            COUNT(r.id) FILTER (WHERE r.estado = 'aprobada') AS reservas,
            COALESCE(SUM(r.hora_fin - r.hora_inicio) FILTER (WHERE r.estado = 'aprobada'), 0) AS horas,
            COUNT(r.id) FILTER (WHERE r.estado = 'cancelada') AS cancelaciones
     FROM espacios e
     JOIN tipos_espacio t ON t.id = e.tipo_id
     JOIN edificios ed ON ed.id = e.edificio_id
     LEFT JOIN reservas r ON r.espacio_id = e.id AND r.fecha BETWEEN $1 AND $2
     WHERE e.estado <> 'inactivo' AND ($3::varchar IS NULL OR ed.sede_id = $3)
     GROUP BY e.id, t.nombre, t.color, ed.nombre
     ORDER BY horas DESC, e.codigo`,
    [desde, hasta, sedeId]
  );
  return rows;
}

export async function usoPorTipo(desde, hasta, sedeId) {
  const { rows } = await consultar(
    `SELECT t.nombre AS tipo, t.color, COUNT(*) AS reservas, SUM(r.hora_fin - r.hora_inicio) AS horas
     ${FILTRO_RESERVAS.replace("JOIN edificios", "JOIN tipos_espacio t ON t.id = e.tipo_id JOIN edificios")}
       AND r.estado = 'aprobada'
     GROUP BY t.nombre, t.color
     ORDER BY horas DESC`,
    [desde, hasta, sedeId]
  );
  return rows;
}

// Cuántas reservas aprobadas cubren cada bloque horario (08 a 20).
export async function usoPorHora(desde, hasta, sedeId) {
  const { rows } = await consultar(
    `SELECT h.hora, COUNT(r.id) AS reservas
     FROM generate_series(${HORA_APERTURA}, ${HORA_CIERRE - 1}) AS h(hora)
     LEFT JOIN (
       SELECT r.id, r.hora_inicio, r.hora_fin ${FILTRO_RESERVAS} AND r.estado = 'aprobada'
     ) r ON h.hora >= r.hora_inicio AND h.hora < r.hora_fin
     GROUP BY h.hora
     ORDER BY h.hora`,
    [desde, hasta, sedeId]
  );
  return rows;
}

export async function solicitudesPorDia(desde, hasta, sedeId) {
  const { rows } = await consultar(
    `SELECT d.fecha::date::text AS fecha,
            COUNT(r.id) AS solicitudes,
            COALESCE(SUM(r.hora_fin - r.hora_inicio) FILTER (WHERE r.estado = 'aprobada'), 0) AS horas_aprobadas
     FROM generate_series($1::date, $2::date, interval '1 day') AS d(fecha)
     LEFT JOIN (
       SELECT r.* ${FILTRO_RESERVAS}
     ) r ON r.fecha = d.fecha::date
     GROUP BY d.fecha
     ORDER BY d.fecha`,
    [desde, hasta, sedeId]
  );
  return rows;
}
