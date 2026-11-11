import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";
import { errores } from "../utils/errores.js";
import * as actividad from "./actividad.service.js";

// Hash ficticio para comparar aunque el RUT no exista y así no revelar,
// por el tiempo de respuesta, qué RUT están registrados.
const HASH_FICTICIO = bcrypt.hashSync("usuario-inexistente", 10);

export async function iniciarSesion({ rut, password }, ctx) {
  const usuario = await usuariosRepo.buscarPorRut(rut);
  const coincide = await bcrypt.compare(password, usuario?.passwordHash ?? HASH_FICTICIO);

  if (!usuario || !coincide || !usuario.activo) {
    await actividad.registrar(ctx, {
      tipo: "SESION_FALLIDA",
      categoria: "sesion",
      entidad: { tipo: "usuario", id: usuario?.id ?? null, etiqueta: `RUT ${rut}` },
      detalle: { motivo: !usuario ? "rut_no_registrado" : !coincide ? "password_incorrecta" : "usuario_inactivo" }
    });
    throw errores.noAutenticado("RUT o contraseña incorrectos.");
  }

  const { passwordHash: _omitido, ...publico } = usuario;
  const token = jwt.sign({ sub: String(usuario.id), rol: usuario.rol.slug }, env.jwtSecreto, {
    expiresIn: env.jwtExpiracion
  });

  await actividad.registrar(
    { ...ctx, usuario: publico },
    {
      tipo: "SESION_INICIADA",
      categoria: "sesion",
      entidad: { tipo: "usuario", id: usuario.id, etiqueta: usuario.nombre }
    }
  );

  return { token, usuario: publico };
}
