import { MongoClient } from "mongodb";
import { env } from "./env.js";

export const COLECCION_EVENTOS = "eventos";

const cliente = new MongoClient(env.mongoUrl, { serverSelectionTimeoutMS: 5000 });
let baseDatos = null;

// Esquema del documento de evento. MongoDB lo valida en cada inserción.
// "detalle" queda abierto a propósito: cada tipo de evento guarda datos distintos.
const validadorEventos = {
  $jsonSchema: {
    bsonType: "object",
    required: ["tipo", "categoria", "fecha", "entidad"],
    properties: {
      tipo: { bsonType: "string", description: "Ej: RESERVA_SOLICITADA, ESPACIO_ACTUALIZADO" },
      categoria: { enum: ["reserva", "infraestructura", "sesion"] },
      fecha: { bsonType: "date" },
      actor: {
        bsonType: ["object", "null"],
        properties: {
          usuarioId: { bsonType: "int" },
          nombre: { bsonType: "string" },
          rol: { bsonType: "string" }
        }
      },
      entidad: {
        bsonType: "object",
        required: ["tipo"],
        properties: {
          tipo: { enum: ["reserva", "espacio", "edificio", "equipamiento", "usuario"] },
          id: { bsonType: ["int", "null"] },
          etiqueta: { bsonType: "string" }
        }
      },
      detalle: { bsonType: "object" },
      origen: { bsonType: "object" }
    }
  }
};

export async function conectarMongo() {
  await cliente.connect();
  baseDatos = cliente.db(env.mongoDb);
  await prepararColecciones();
  return baseDatos;
}

async function prepararColecciones() {
  const existentes = await baseDatos.listCollections({ name: COLECCION_EVENTOS }).toArray();
  if (existentes.length === 0) {
    await baseDatos.createCollection(COLECCION_EVENTOS, { validator: validadorEventos });
  } else {
    await baseDatos.command({ collMod: COLECCION_EVENTOS, validator: validadorEventos });
  }

  const eventos = baseDatos.collection(COLECCION_EVENTOS);
  await eventos.createIndexes([
    { key: { fecha: -1 }, name: "por_fecha" },
    { key: { "entidad.tipo": 1, "entidad.id": 1, fecha: 1 }, name: "por_entidad" },
    { key: { "actor.usuarioId": 1, fecha: -1 }, name: "por_actor" },
    { key: { categoria: 1, tipo: 1, fecha: -1 }, name: "por_tipo" }
  ]);
}

export function coleccion(nombre) {
  if (!baseDatos) throw new Error("MongoDB no está conectado");
  return baseDatos.collection(nombre);
}

export async function verificarMongo() {
  await cliente.db("admin").command({ ping: 1 });
}

export async function cerrarMongo() {
  await cliente.close();
}
