import { consultar } from "../config/postgres.js";

export async function listarSedes() {
  const { rows } = await consultar(
    `SELECT id, nombre, ciudad, latitud, longitud FROM sedes ORDER BY orden, nombre`
  );
  return rows;
}

export async function buscarSede(id) {
  const { rows } = await consultar(`SELECT id, nombre FROM sedes WHERE id = $1`, [id]);
  return rows[0] || null;
}

export async function listarTiposEspacio() {
  const { rows } = await consultar(`SELECT id, nombre, icono, color FROM tipos_espacio ORDER BY id`);
  return rows;
}

export async function buscarTipoEspacio(id) {
  const { rows } = await consultar(`SELECT id, nombre FROM tipos_espacio WHERE id = $1`, [id]);
  return rows[0] || null;
}
