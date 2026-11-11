import { ObjectId } from "mongodb";
import { COLECCION_EVENTOS, coleccion } from "../config/mongo.js";

function eventos() {
  return coleccion(COLECCION_EVENTOS);
}

function aDto(documento) {
  const { _id, ...resto } = documento;
  return { id: _id.toString(), ...resto };
}

export async function insertar(evento) {
  const { insertedId } = await eventos().insertOne(evento);
  return insertedId.toString();
}

// Línea de tiempo de una entidad (por ejemplo, todos los cambios de la reserva 12)
export async function porEntidad(tipo, id) {
  const documentos = await eventos()
    .find({ "entidad.tipo": tipo, "entidad.id": id })
    .sort({ fecha: 1 })
    .toArray();
  return documentos.map(aDto);
}

// Feed de actividad con filtros y paginación por cursor ("antesDe" = id del último evento recibido)
export async function listar({ categoria, tipo, usuarioId, desde, hasta, antesDe, limite = 30 }) {
  const filtro = {};
  if (categoria) filtro.categoria = categoria;
  if (tipo) filtro.tipo = tipo;
  if (usuarioId) filtro["actor.usuarioId"] = usuarioId;
  if (desde || hasta) {
    filtro.fecha = {};
    if (desde) filtro.fecha.$gte = desde;
    if (hasta) filtro.fecha.$lte = hasta;
  }
  if (antesDe) filtro._id = { $lt: new ObjectId(antesDe) };

  const documentos = await eventos()
    .find(filtro)
    .sort({ _id: -1 })
    .limit(limite)
    .toArray();
  return documentos.map(aDto);
}

// Cantidad de eventos por tipo en un rango de fechas (se usa en el panel de indicadores)
export async function contarPorTipo(desde, hasta) {
  return eventos()
    .aggregate([
      { $match: { fecha: { $gte: desde, $lte: hasta } } },
      { $group: { _id: "$tipo", cantidad: { $sum: 1 } } },
      { $project: { _id: 0, tipo: "$_id", cantidad: 1 } },
      { $sort: { cantidad: -1 } }
    ])
    .toArray();
}

// Espacios más buscados sin éxito: intentos de reserva rechazados por conflicto de horario.
// Es información que no existe en PostgreSQL, porque esos intentos nunca se guardan como reserva.
export async function conflictosPorEspacio(desde, hasta, limite = 5) {
  return eventos()
    .aggregate([
      { $match: { tipo: "RESERVA_CONFLICTO", fecha: { $gte: desde, $lte: hasta } } },
      {
        $group: {
          _id: "$detalle.espacio.id",
          espacio: { $first: "$detalle.espacio.nombre" },
          intentos: { $sum: 1 }
        }
      },
      { $project: { _id: 0, espacioId: "$_id", espacio: 1, intentos: 1 } },
      { $sort: { intentos: -1 } },
      { $limit: limite }
    ])
    .toArray();
}
