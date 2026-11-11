import { verificarMongo } from "../config/mongo.js";
import { verificarPostgres } from "../config/postgres.js";
import * as actividad from "../services/actividad.service.js";
import * as indicadores from "../services/indicadores.service.js";

export async function panelIndicadores(req, res) {
  res.json(await indicadores.panel(req.datos.query));
}

export async function listarActividad(req, res) {
  res.json(await actividad.listar(req.datos.query));
}

export async function miActividad(req, res) {
  res.json(await actividad.listarDelUsuario(req.usuario, req.datos.query));
}

// Estado de los servicios. Responde 503 si alguna base de datos no está disponible.
export async function salud(_req, res) {
  const revisar = (fn) => fn().then(() => "ok").catch(() => "error");
  const [postgres, mongo] = await Promise.all([revisar(verificarPostgres), revisar(verificarMongo)]);
  const ok = postgres === "ok" && mongo === "ok";
  res.status(ok ? 200 : 503).json({ estado: ok ? "ok" : "degradado", postgres, mongo, hora: new Date().toISOString() });
}
