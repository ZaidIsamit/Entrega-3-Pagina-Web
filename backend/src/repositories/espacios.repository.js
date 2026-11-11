import { consultar, enTransaccion } from "../config/postgres.js";

const SELECT_ESPACIO = `
  SELECT e.id, e.codigo, e.nombre, e.piso, e.capacidad, e.exterior, e.estado, e.descripcion,
         t.id AS tipo_id, t.nombre AS tipo_nombre, t.icono AS tipo_icono, t.color AS tipo_color,
         ed.id AS edificio_id, ed.nombre AS edificio_nombre,
         s.id AS sede_id, s.nombre AS sede_nombre,
         COALESCE(
           (SELECT json_agg(json_build_object('id', q.id, 'nombre', q.nombre, 'icono', q.icono, 'cantidad', ee.cantidad)
                            ORDER BY q.nombre)
            FROM espacio_equipamiento ee
            JOIN equipamiento q ON q.id = ee.equipamiento_id
            WHERE ee.espacio_id = e.id),
           '[]'::json
         ) AS equipamiento
  FROM espacios e
  JOIN tipos_espacio t ON t.id = e.tipo_id
  JOIN edificios ed ON ed.id = e.edificio_id
  JOIN sedes s ON s.id = ed.sede_id`;

function aDto(fila) {
  if (!fila) return null;
  return {
    id: fila.id,
    codigo: fila.codigo,
    nombre: fila.nombre,
    piso: fila.piso,
    capacidad: fila.capacidad,
    exterior: fila.exterior,
    estado: fila.estado,
    descripcion: fila.descripcion,
    tipo: { id: fila.tipo_id, nombre: fila.tipo_nombre, icono: fila.tipo_icono, color: fila.tipo_color },
    edificio: { id: fila.edificio_id, nombre: fila.edificio_nombre },
    sede: { id: fila.sede_id, nombre: fila.sede_nombre },
    equipamiento: fila.equipamiento
  };
}

export async function listar({ sedeId, tipoId, edificioId, capacidadMin, q, estado, incluirInactivos }) {
  const condiciones = [];
  const parametros = [];
  const agregar = (sql, valor) => {
    parametros.push(valor);
    condiciones.push(sql.replace("?", `$${parametros.length}`));
  };

  if (sedeId) agregar("s.id = ?", sedeId);
  if (tipoId) agregar("t.id = ?", tipoId);
  if (edificioId) agregar("ed.id = ?", edificioId);
  if (capacidadMin) agregar("e.capacidad >= ?", capacidadMin);
  if (estado) agregar("e.estado = ?", estado);
  else if (!incluirInactivos) condiciones.push("e.estado <> 'inactivo'");
  if (q) {
    agregar(
      `(e.nombre ILIKE ? OR e.codigo ILIKE $${parametros.length} OR ed.nombre ILIKE $${parametros.length}
        OR t.nombre ILIKE $${parametros.length}
        OR EXISTS (SELECT 1 FROM espacio_equipamiento ee JOIN equipamiento qq ON qq.id = ee.equipamiento_id
                   WHERE ee.espacio_id = e.id AND qq.nombre ILIKE $${parametros.length}))`,
      `%${q}%`
    );
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const { rows } = await consultar(`${SELECT_ESPACIO} ${where} ORDER BY s.nombre, ed.nombre, e.codigo`, parametros);
  return rows.map(aDto);
}

export async function buscarPorId(id, cliente) {
  const ejecutor = cliente ?? { query: consultar };
  const { rows } = await ejecutor.query(`${SELECT_ESPACIO} WHERE e.id = $1`, [id]);
  return aDto(rows[0]);
}

async function reemplazarEquipamiento(cliente, espacioId, equipamiento) {
  await cliente.query(`DELETE FROM espacio_equipamiento WHERE espacio_id = $1`, [espacioId]);
  for (const item of equipamiento) {
    await cliente.query(
      `INSERT INTO espacio_equipamiento (espacio_id, equipamiento_id, cantidad) VALUES ($1, $2, $3)`,
      [espacioId, item.equipamientoId, item.cantidad]
    );
  }
}

export function crear(datos) {
  return enTransaccion(async (cliente) => {
    const { rows } = await cliente.query(
      `INSERT INTO espacios (codigo, nombre, tipo_id, edificio_id, piso, capacidad, exterior, estado, descripcion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        datos.codigo, datos.nombre, datos.tipoId, datos.edificioId, datos.piso,
        datos.capacidad, datos.exterior, datos.estado, datos.descripcion ?? null
      ]
    );
    await reemplazarEquipamiento(cliente, rows[0].id, datos.equipamiento);
    return buscarPorId(rows[0].id, cliente);
  });
}

export function actualizar(id, datos) {
  return enTransaccion(async (cliente) => {
    await cliente.query(
      `UPDATE espacios
       SET codigo = $2, nombre = $3, tipo_id = $4, edificio_id = $5, piso = $6, capacidad = $7,
           exterior = $8, estado = $9, descripcion = $10, actualizado_en = now()
       WHERE id = $1`,
      [
        id, datos.codigo, datos.nombre, datos.tipoId, datos.edificioId, datos.piso,
        datos.capacidad, datos.exterior, datos.estado, datos.descripcion ?? null
      ]
    );
    await reemplazarEquipamiento(cliente, id, datos.equipamiento);
    return buscarPorId(id, cliente);
  });
}

export async function contarReservas(id) {
  const { rows } = await consultar(`SELECT COUNT(*) AS total FROM reservas WHERE espacio_id = $1`, [id]);
  return rows[0].total;
}

export async function eliminar(id) {
  await consultar(`DELETE FROM espacios WHERE id = $1`, [id]);
}
