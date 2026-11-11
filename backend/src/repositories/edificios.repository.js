import { consultar } from "../config/postgres.js";

const SELECT_EDIFICIO = `
  SELECT ed.id, ed.nombre, ed.direccion, ed.pisos, ed.sede_id,
         s.nombre AS sede_nombre,
         (SELECT COUNT(*) FROM espacios e WHERE e.edificio_id = ed.id AND e.estado <> 'inactivo') AS total_espacios
  FROM edificios ed
  JOIN sedes s ON s.id = ed.sede_id`;

function aDto(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    nombre: fila.nombre,
    direccion: fila.direccion,
    pisos: fila.pisos,
    sede: { id: fila.sede_id, nombre: fila.sede_nombre },
    totalEspacios: fila.total_espacios
  };
}

export async function listar({ sedeId } = {}) {
  const parametros = [];
  let where = "";
  if (sedeId) {
    parametros.push(sedeId);
    where = "WHERE ed.sede_id = $1";
  }
  const { rows } = await consultar(`${SELECT_EDIFICIO} ${where} ORDER BY s.nombre, ed.nombre`, parametros);
  return rows.map(aDto);
}

export async function buscarPorId(id) {
  const { rows } = await consultar(`${SELECT_EDIFICIO} WHERE ed.id = $1`, [id]);
  return aDto(rows[0]);
}

export async function crear({ sedeId, nombre, direccion, pisos }) {
  const { rows } = await consultar(
    `INSERT INTO edificios (sede_id, nombre, direccion, pisos) VALUES ($1, $2, $3, $4) RETURNING id`,
    [sedeId, nombre, direccion ?? null, pisos]
  );
  return buscarPorId(rows[0].id);
}

export async function actualizar(id, { sedeId, nombre, direccion, pisos }) {
  await consultar(
    `UPDATE edificios SET sede_id = $2, nombre = $3, direccion = $4, pisos = $5 WHERE id = $1`,
    [id, sedeId, nombre, direccion ?? null, pisos]
  );
  return buscarPorId(id);
}

export async function contarEspacios(id) {
  const { rows } = await consultar(`SELECT COUNT(*) AS total FROM espacios WHERE edificio_id = $1`, [id]);
  return rows[0].total;
}

export async function eliminar(id) {
  await consultar(`DELETE FROM edificios WHERE id = $1`, [id]);
}
