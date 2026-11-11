import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import * as usuariosRepo from "../repositories/usuarios.repository.js";
import { errores } from "../utils/errores.js";

// Verifica el token "Authorization: Bearer <jwt>" y deja el usuario en req.usuario.
// El usuario se vuelve a leer de la base para respetar cambios de rol o desactivaciones.
export async function autenticar(req, _res, next) {
  const [esquema, token] = (req.headers.authorization || "").split(" ");
  if (esquema !== "Bearer" || !token) throw errores.noAutenticado();

  let datos;
  try {
    datos = jwt.verify(token, env.jwtSecreto);
  } catch {
    throw errores.noAutenticado("Tu sesión expiró o no es válida. Vuelve a iniciar sesión.");
  }

  const usuario = await usuariosRepo.buscarPorId(Number(datos.sub));
  if (!usuario || !usuario.activo) throw errores.noAutenticado("Tu usuario no está habilitado.");

  req.usuario = usuario;
  next();
}

export function soloAdmin(req, _res, next) {
  if (!req.usuario?.rol.esAdmin) {
    throw errores.sinPermiso("Solo la administración de espacios puede realizar esta acción.");
  }
  next();
}
