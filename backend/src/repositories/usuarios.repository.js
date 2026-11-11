import { consultar } from "../config/postgres.js";

const SELECT_USUARIO = `
  SELECT u.id, u.rut, u.nombre, u.email, u.activo, u.password_hash,
         r.id AS rol_id, r.nombre AS rol_nombre, r.slug AS rol_slug,
         r.max_horas_reserva, r.requiere_aprobacion, r.es_admin
  FROM usuarios u
  JOIN roles r ON r.id = u.rol_id`;

function aDto(fila, { incluirHash = false } = {}) {
  if (!fila) return null;
  const usuario = {
    id: fila.id,
    rut: fila.rut,
    nombre: fila.nombre,
    email: fila.email,
    activo: fila.activo,
    rol: {
      id: fila.rol_id,
      nombre: fila.rol_nombre,
      slug: fila.rol_slug,
      maxHorasReserva: fila.max_horas_reserva,
      requiereAprobacion: fila.requiere_aprobacion,
      esAdmin: fila.es_admin
    }
  };
  if (incluirHash) usuario.passwordHash = fila.password_hash;
  return usuario;
}

export async function buscarPorRut(rut) {
  const { rows } = await consultar(`${SELECT_USUARIO} WHERE u.rut = $1`, [rut]);
  return aDto(rows[0], { incluirHash: true });
}

export async function buscarPorId(id) {
  const { rows } = await consultar(`${SELECT_USUARIO} WHERE u.id = $1`, [id]);
  return aDto(rows[0]);
}
