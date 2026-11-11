import * as actividad from "../services/actividad.service.js";
import * as servicio from "../services/reservas.service.js";
import { contexto } from "./contexto.js";

export async function ocupacion(req, res) {
  res.json(await servicio.ocupacion(req.datos.query, req.usuario));
}

export async function disponibilidad(req, res) {
  res.json(await servicio.disponibilidad(req.datos.params.id, req.datos.query.fecha, req.usuario));
}

export async function misReservas(req, res) {
  res.json(await servicio.misReservas(req.usuario, req.datos.query));
}

export async function listar(req, res) {
  res.json(await servicio.listarTodas(req.datos.query));
}

export async function obtener(req, res) {
  res.json(await servicio.obtener(req.datos.params.id, req.usuario));
}

export async function historial(req, res) {
  res.json(await actividad.historialDeReserva(req.datos.params.id, req.usuario));
}

export async function crear(req, res) {
  const reserva = await servicio.crear(req.datos.body, contexto(req));
  res.status(201).location(`/api/reservas/${reserva.id}`).json(reserva);
}

export async function aprobar(req, res) {
  res.json(await servicio.aprobar(req.datos.params.id, contexto(req)));
}

export async function rechazar(req, res) {
  res.json(await servicio.rechazar(req.datos.params.id, req.datos.body.motivo, contexto(req)));
}

export async function cancelar(req, res) {
  res.json(await servicio.cancelar(req.datos.params.id, req.datos.body.motivo, contexto(req)));
}
