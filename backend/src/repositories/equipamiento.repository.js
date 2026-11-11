import { consultar } from "../config/postgres.js";

const SELECT_EQUIPAMIENTO = `
  SELECT q.id, q.nombre, q.icono,
         (SELECT COUNT(*) FROM espacio_equipamiento ee WHERE ee.equipamiento_id = q.id) AS total_espacios
  FROM equipamiento q`;

function aDto(fila) {
  if (!fila) return null;
  return { id: fila.id, nombre: fila.nombre, icono: fila.icono, totalEspacios: fila.total_espacios };
}

export async function listar() {
  const { rows } = await consultar(`${SELECT_EQUIPAMIENTO} ORDER BY q.nombre`);
  return rows.map(aDto);
}

export async function buscarPorId(id) {
  const { rows } = await consultar(`${SELECT_EQUIPAMIENTO} WHERE q.id = $1`, [id]);
  return aDto(rows[0]);
}

export async function contarExistentes(ids) {
  const { rows } = await consultar(`SELECT COUNT(*) AS total FROM equipamiento WHERE id = ANY($1::int[])`, [ids]);
  return rows[0].total;
}

export async function crear({ nombre, icono }) {
  const { rows } = await consultar(
    `INSERT INTO equipamiento (nombre, icono) VALUES ($1, $2) RETURNING id`,
    [nombre, icono]
  );
  return buscarPorId(rows[0].id);
}

export async function actualizar(id, { nombre, icono }) {
  await consultar(`UPDATE equipamiento SET nombre = $2, icono = $3 WHERE id = $1`, [id, nombre, icono]);
  return buscarPorId(id);
}

export async function eliminar(id) {
  await consultar(`DELETE FROM equipamiento WHERE id = $1`, [id]);
}
