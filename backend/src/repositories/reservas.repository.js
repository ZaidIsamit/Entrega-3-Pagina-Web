import { consultar } from "../config/postgres.js";

const ESTADOS_ACTIVOS = ["pendiente", "aprobada"];

const SELECT_RESERVA = `
  SELECT r.id, r.fecha, r.hora_inicio, r.hora_fin, r.personas, r.motivo, r.estado,
         r.motivo_rechazo, r.revisada_en, r.cancelada_en, r.creada_en, r.actualizada_en,
         e.id AS espacio_id, e.codigo AS espacio_codigo, e.nombre AS espacio_nombre,
         e.capacidad AS espacio_capacidad, e.exterior AS espacio_exterior,
         t.nombre AS tipo_nombre, t.icono AS tipo_icono, t.color AS tipo_color,
         ed.nombre AS edificio_nombre, s.id AS sede_id, s.nombre AS sede_nombre,
         u.id AS usuario_id, u.nombre AS usuario_nombre, u.rut AS usuario_rut,
         ro.nombre AS usuario_rol,
         rv.id AS revisor_id, rv.nombre AS revisor_nombre
  FROM reservas r
  JOIN espacios e ON e.id = r.espacio_id
  JOIN tipos_espacio t ON t.id = e.tipo_id
  JOIN edificios ed ON ed.id = e.edificio_id
  JOIN sedes s ON s.id = ed.sede_id
  JOIN usuarios u ON u.id = r.usuario_id
  JOIN roles ro ON ro.id = u.rol_id
  LEFT JOIN usuarios rv ON rv.id = r.revisada_por`;

function aDto(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    fecha: fila.fecha,
    horaInicio: fila.hora_inicio,
    horaFin: fila.hora_fin,
    duracion: fila.hora_fin - fila.hora_inicio,
    personas: fila.personas,
    motivo: fila.motivo,
    estado: fila.estado,
    motivoRechazo: fila.motivo_rechazo,
    revisadaEn: fila.revisada_en,
    canceladaEn: fila.cancelada_en,
    creadaEn: fila.creada_en,
    actualizadaEn: fila.actualizada_en,
    espacio: {
      id: fila.espacio_id,
      codigo: fila.espacio_codigo,
      nombre: fila.espacio_nombre,
      capacidad: fila.espacio_capacidad,
      exterior: fila.espacio_exterior,
      tipo: { nombre: fila.tipo_nombre, icono: fila.tipo_icono, color: fila.tipo_color },
      edificio: fila.edificio_nombre,
      sede: { id: fila.sede_id, nombre: fila.sede_nombre }
    },
    solicitante: {
      id: fila.usuario_id,
      nombre: fila.usuario_nombre,
      rut: fila.usuario_rut,
      rol: fila.usuario_rol
    },
    revisor: fila.revisor_id ? { id: fila.revisor_id, nombre: fila.revisor_nombre } : null
  };
}

export async function buscarPorId(id) {
  const { rows } = await consultar(`${SELECT_RESERVA} WHERE r.id = $1`, [id]);
  return aDto(rows[0]);
}

// alcance: "proximas" (hoy en adelante, ordenadas por fecha ascendente)
//          "historial" (pasadas, más recientes primero)
export async function listar({ usuarioId, estado, fecha, desde, hasta, sedeId, espacioId, alcance, hoy, limite = 200 }) {
  const condiciones = [];
  const parametros = [];
  const agregar = (sql, valor) => {
    parametros.push(valor);
    condiciones.push(sql.replace("?", `$${parametros.length}`));
  };

  if (usuarioId) agregar("r.usuario_id = ?", usuarioId);
  if (estado) agregar("r.estado = ?", estado);
  if (fecha) agregar("r.fecha = ?", fecha);
  if (desde) agregar("r.fecha >= ?", desde);
  if (hasta) agregar("r.fecha <= ?", hasta);
  if (sedeId) agregar("s.id = ?", sedeId);
  if (espacioId) agregar("e.id = ?", espacioId);
  if (alcance === "proximas") agregar("r.fecha >= ?", hoy);
  if (alcance === "historial") agregar("r.fecha < ?", hoy);

  const orden =
    alcance === "historial"
      ? "r.fecha DESC, r.hora_inicio DESC"
      : "r.fecha ASC, r.hora_inicio ASC";
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  parametros.push(limite);

  const { rows } = await consultar(
    `${SELECT_RESERVA} ${where} ORDER BY ${orden} LIMIT $${parametros.length}`,
    parametros
  );
  return rows.map(aDto);
}

// Bloques ocupados (pendientes y aprobadas) de una sede en una fecha.
// No expone datos personales de otros usuarios: solo indica si la reserva es propia.
export async function ocupacionPorSede(sedeId, fecha) {
  const { rows } = await consultar(
    `SELECT r.id, r.espacio_id, r.hora_inicio, r.hora_fin, r.estado, r.usuario_id
     FROM reservas r
     JOIN espacios e ON e.id = r.espacio_id
     JOIN edificios ed ON ed.id = e.edificio_id
     WHERE ed.sede_id = $1 AND r.fecha = $2 AND r.estado = ANY($3)
     ORDER BY r.espacio_id, r.hora_inicio`,
    [sedeId, fecha, ESTADOS_ACTIVOS]
  );
  return rows;
}

export async function ocupacionPorEspacio(espacioId, fecha) {
  const { rows } = await consultar(
    `SELECT id, espacio_id, hora_inicio, hora_fin, estado, usuario_id
     FROM reservas
     WHERE espacio_id = $1 AND fecha = $2 AND estado = ANY($3)
     ORDER BY hora_inicio`,
    [espacioId, fecha, ESTADOS_ACTIVOS]
  );
  return rows;
}

export async function buscarTraslapeEspacio({ espacioId, fecha, horaInicio, horaFin }) {
  const { rows } = await consultar(
    `SELECT id, hora_inicio, hora_fin, estado FROM reservas
     WHERE espacio_id = $1 AND fecha = $2 AND estado = ANY($5)
       AND int4range(hora_inicio, hora_fin) && int4range($3, $4)
     LIMIT 1`,
    [espacioId, fecha, horaInicio, horaFin, ESTADOS_ACTIVOS]
  );
  return rows[0] || null;
}

export async function buscarTraslapeUsuario({ usuarioId, fecha, horaInicio, horaFin }) {
  const { rows } = await consultar(
    `SELECT r.id, r.hora_inicio, r.hora_fin, e.nombre AS espacio_nombre FROM reservas r
     JOIN espacios e ON e.id = r.espacio_id
     WHERE r.usuario_id = $1 AND r.fecha = $2 AND r.estado = ANY($5)
       AND int4range(r.hora_inicio, r.hora_fin) && int4range($3, $4)
     LIMIT 1`,
    [usuarioId, fecha, horaInicio, horaFin, ESTADOS_ACTIVOS]
  );
  return rows[0] || null;
}

export async function crear({ espacioId, usuarioId, fecha, horaInicio, horaFin, personas, motivo, estado }) {
  const { rows } = await consultar(
    `INSERT INTO reservas (espacio_id, usuario_id, fecha, hora_inicio, hora_fin, personas, motivo, estado)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [espacioId, usuarioId, fecha, horaInicio, horaFin, personas, motivo, estado]
  );
  return buscarPorId(rows[0].id);
}

// Cambia el estado solo si la reserva sigue en uno de los estados esperados.
// Si otro usuario la modificó antes, no se actualiza ninguna fila y se devuelve null.
export async function cambiarEstado(id, estadosEsperados, { estado, motivoRechazo = null, revisadaPor = null }) {
  const { rowCount } = await consultar(
    `UPDATE reservas
     SET estado = $3::varchar,
         motivo_rechazo = COALESCE($4, motivo_rechazo),
         revisada_por = COALESCE($5, revisada_por),
         revisada_en = CASE WHEN $3::varchar IN ('aprobada', 'rechazada') THEN now() ELSE revisada_en END,
         cancelada_en = CASE WHEN $3::varchar = 'cancelada' THEN now() ELSE cancelada_en END,
         actualizada_en = now()
     WHERE id = $1 AND estado = ANY($2)`,
    [id, estadosEsperados, estado, motivoRechazo, revisadaPor]
  );
  return rowCount === 0 ? null : buscarPorId(id);
}
