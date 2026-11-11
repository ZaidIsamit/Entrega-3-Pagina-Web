import * as authService from "../services/auth.service.js";
import { contexto } from "./contexto.js";

export async function login(req, res) {
  const resultado = await authService.iniciarSesion(req.datos.body, contexto(req));
  res.json(resultado);
}

export function perfil(req, res) {
  res.json(req.usuario);
}
