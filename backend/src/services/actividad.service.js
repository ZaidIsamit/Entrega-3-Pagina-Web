import * as eventosRepo from "../repositories/eventos.repository.js";
import * as reservasRepo from "../repositories/reservas.repository.js";
import { errores } from "../utils/errores.js";

// Registra un evento en MongoDB (colección "eventos").
// PostgreSQL guarda el estado ACTUAL de cada reserva/espacio; MongoDB guarda la HISTORIA:
// quién hizo qué, cuándo, con qué datos y también los intentos fallidos (que nunca llegan a SQL).
//
// El registro es "best effort": si MongoDB falla, la operación principal (ya confirmada en
// PostgreSQL) no se revierte; solo se informa el error en el log del servidor.
export async function registrar(ctx, { tipo, categoria, entidad, detalle = {} }) {
  const evento = {
    tipo,
    categoria,
    fecha: new Date(),
    actor: ctx?.usuario
      ? { usuarioId: ctx.usuario.id, nombre: ctx.usuario.nombre, rol: ctx.usuario.rol.nombre }
      : null,
    entidad: { tipo: entidad.tipo, id: entidad.id ?? null, etiqueta: entidad.etiqueta ?? "" },
    detalle,
    origen: { ip: ctx?.ip ?? null, userAgent: ctx?.userAgent ?? null }
  };
  try {
    await eventosRepo.insertar(evento);
  } catch (error) {
    console.error(`No se pudo registrar el evento ${tipo} en MongoDB:`, error.message);
  }
}

// Calcula qué campos cambiaron entre dos versiones de un objeto (para auditoría de ediciones)
export function diferencias(antes, despues, campos) {
  const cambios = {};
  for (const campo of campos) {
    const a = JSON.stringify(antes[campo] ?? null);
    const d = JSON.stringify(despues[campo] ?? null);
    if (a !== d) cambios[campo] = { antes: antes[campo] ?? null, despues: despues[campo] ?? null };
  }
  return cambios;
}

export function listar(filtros) {
  return eventosRepo.listar(filtros);
}

export function listarDelUsuario(usuario, { limite, antesDe }) {
  return eventosRepo.listar({ usuarioId: usuario.id, limite, antesDe });
}

// Historial completo de una reserva. Solo lo ve el solicitante o la administración.
export async function historialDeReserva(id, usuario) {
  const reserva = await reservasRepo.buscarPorId(id);
  if (!reserva) throw errores.noEncontrado("La reserva");
  if (reserva.solicitante.id !== usuario.id && !usuario.rol.esAdmin) {
    throw errores.sinPermiso("Solo puedes ver el historial de tus reservas.");
  }
  return eventosRepo.porEntidad("reserva", id);
}
