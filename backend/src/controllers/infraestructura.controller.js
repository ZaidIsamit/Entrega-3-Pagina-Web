import * as servicio from "../services/infraestructura.service.js";
import { contexto } from "./contexto.js";

// ---------- Catálogos ----------
export async function listarSedes(_req, res) {
  res.json(await servicio.listarSedes());
}

export async function listarTiposEspacio(_req, res) {
  res.json(await servicio.listarTiposEspacio());
}

// ---------- Edificios ----------
export async function listarEdificios(req, res) {
  res.json(await servicio.listarEdificios(req.datos.query));
}

export async function crearEdificio(req, res) {
  res.status(201).json(await servicio.crearEdificio(req.datos.body, contexto(req)));
}

export async function actualizarEdificio(req, res) {
  res.json(await servicio.actualizarEdificio(req.datos.params.id, req.datos.body, contexto(req)));
}

export async function eliminarEdificio(req, res) {
  await servicio.eliminarEdificio(req.datos.params.id, contexto(req));
  res.status(204).end();
}

// ---------- Equipamiento ----------
export async function listarEquipamiento(_req, res) {
  res.json(await servicio.listarEquipamiento());
}

export async function crearEquipamiento(req, res) {
  res.status(201).json(await servicio.crearEquipamiento(req.datos.body, contexto(req)));
}

export async function actualizarEquipamiento(req, res) {
  res.json(await servicio.actualizarEquipamiento(req.datos.params.id, req.datos.body, contexto(req)));
}

export async function eliminarEquipamiento(req, res) {
  await servicio.eliminarEquipamiento(req.datos.params.id, contexto(req));
  res.status(204).end();
}

// ---------- Espacios ----------
export async function listarEspacios(req, res) {
  const filtros = { ...req.datos.query };
  // Solo la administración puede ver los espacios dados de baja
  if (!req.usuario.rol.esAdmin) {
    filtros.incluirInactivos = false;
    if (filtros.estado === "inactivo") filtros.estado = undefined;
  }
  res.json(await servicio.listarEspacios(filtros));
}

export async function obtenerEspacio(req, res) {
  res.json(await servicio.obtenerEspacio(req.datos.params.id));
}

export async function crearEspacio(req, res) {
  res.status(201).json(await servicio.crearEspacio(req.datos.body, contexto(req)));
}

export async function actualizarEspacio(req, res) {
  res.json(await servicio.actualizarEspacio(req.datos.params.id, req.datos.body, contexto(req)));
}

export async function eliminarEspacio(req, res) {
  await servicio.eliminarEspacio(req.datos.params.id, contexto(req));
  res.status(204).end();
}
