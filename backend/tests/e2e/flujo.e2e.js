// Prueba de integración: recorre el flujo principal contra la API ya levantada
// (PostgreSQL + MongoDB reales). Se ejecuta con:  API_URL=http://localhost:3000/api npm run test:e2e
// Al final cancela lo que creó, así que se puede ejecutar varias veces.

import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

const API = process.env.API_URL || "http://localhost:3000/api";

async function llamar(metodo, ruta, { token, cuerpo } = {}) {
  const respuesta = await fetch(`${API}${ruta}`, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined
  });
  const texto = await respuesta.text();
  return { estado: respuesta.status, datos: texto ? JSON.parse(texto) : null };
}

async function login(rut) {
  const r = await llamar("POST", "/auth/login", { cuerpo: { rut, password: "unab2026" } });
  assert.equal(r.estado, 200, JSON.stringify(r.datos));
  return r.datos.token;
}

// Fecha futura en formato AAAA-MM-DD (entre 20 y 50 días, para no chocar con los datos de prueba)
const dias = 20 + Math.floor(Math.random() * 30);
const fecha = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
const creadas = [];

let admin, docente, estudiante, sala;

before(async () => {
  [admin, docente, estudiante] = await Promise.all([
    login("11.111.111-1"),
    login("21.668.839-2"),
    login("21.993.115-8")
  ]);
  const espacios = await llamar("GET", "/espacios?sedeId=santiago&q=R2-301", { token: docente });
  sala = espacios.datos[0];
});

after(async () => {
  for (const id of creadas) await llamar("PATCH", `/reservas/${id}/cancelar`, { token: admin, cuerpo: {} });
});

describe("Autenticación", () => {
  it("rechaza credenciales incorrectas con 401", async () => {
    const r = await llamar("POST", "/auth/login", { cuerpo: { rut: "21.668.839-2", password: "mala" } });
    assert.equal(r.estado, 401);
    assert.equal(r.datos.error.codigo, "NO_AUTENTICADO");
  });
  it("rechaza un RUT con dígito verificador inválido con 400", async () => {
    const r = await llamar("POST", "/auth/login", { cuerpo: { rut: "21.668.839-0", password: "x" } });
    assert.equal(r.estado, 400);
  });
  it("exige token en rutas protegidas", async () => {
    assert.equal((await llamar("GET", "/espacios")).estado, 401);
  });
  it("un estudiante no puede usar rutas de administración (403)", async () => {
    assert.equal((await llamar("GET", "/indicadores", { token: estudiante })).estado, 403);
  });
});

describe("Flujo de reserva", () => {
  let reservaDocente, reservaEstudiante;

  it("un docente reserva y queda aprobada automáticamente (PostgreSQL)", async () => {
    const r = await llamar("POST", "/reservas", {
      token: docente,
      cuerpo: { espacioId: sala.id, fecha, horaInicio: 10, duracion: 2, personas: 8, motivo: "Prueba e2e docente" }
    });
    assert.equal(r.estado, 201, JSON.stringify(r.datos));
    assert.equal(r.datos.estado, "aprobada");
    reservaDocente = r.datos;
    creadas.push(r.datos.id);
  });

  it("la reserva se puede consultar después", async () => {
    const r = await llamar("GET", `/reservas/${reservaDocente.id}`, { token: docente });
    assert.equal(r.estado, 200);
    assert.equal(r.datos.motivo, "Prueba e2e docente");
  });

  it("evita la doble reserva: un horario traslapado responde 409", async () => {
    const r = await llamar("POST", "/reservas", {
      token: estudiante,
      cuerpo: { espacioId: sala.id, fecha, horaInicio: 11, duracion: 1, personas: 4, motivo: "Intento traslapado" }
    });
    assert.equal(r.estado, 409);
    assert.match(r.datos.error.mensaje, /ya está reservad/);
  });

  it("controla la duración máxima del rol (422)", async () => {
    const r = await llamar("POST", "/reservas", {
      token: estudiante,
      cuerpo: { espacioId: sala.id, fecha, horaInicio: 14, duracion: 3, personas: 4, motivo: "Muy largo" }
    });
    assert.equal(r.estado, 422);
    assert.equal(r.datos.error.codigo, "DURACION_EXCEDIDA");
  });

  it("controla la capacidad del espacio (422)", async () => {
    const r = await llamar("POST", "/reservas", {
      token: estudiante,
      cuerpo: { espacioId: sala.id, fecha, horaInicio: 14, duracion: 1, personas: 500, motivo: "Demasiadas personas" }
    });
    assert.equal(r.estado, 422);
    assert.equal(r.datos.error.codigo, "CAPACIDAD_EXCEDIDA");
  });

  it("un estudiante solicita un bloque libre y queda pendiente", async () => {
    const r = await llamar("POST", "/reservas", {
      token: estudiante,
      cuerpo: { espacioId: sala.id, fecha, horaInicio: 12, duracion: 2, personas: 4, motivo: "Prueba e2e estudiante" }
    });
    assert.equal(r.estado, 201, JSON.stringify(r.datos));
    assert.equal(r.datos.estado, "pendiente");
    reservaEstudiante = r.datos;
    creadas.push(r.datos.id);
  });

  it("aparece en la bandeja de solicitudes pendientes de la administración", async () => {
    const r = await llamar("GET", `/reservas?estado=pendiente&fecha=${fecha}`, { token: admin });
    assert.ok(r.datos.some((x) => x.id === reservaEstudiante.id));
  });

  it("la administración la aprueba", async () => {
    const r = await llamar("PATCH", `/reservas/${reservaEstudiante.id}/aprobar`, { token: admin });
    assert.equal(r.estado, 200);
    assert.equal(r.datos.estado, "aprobada");
  });

  it("no se puede aprobar dos veces (422)", async () => {
    const r = await llamar("PATCH", `/reservas/${reservaEstudiante.id}/aprobar`, { token: admin });
    assert.equal(r.estado, 422);
  });

  it("otro usuario no puede cancelar una reserva ajena (403)", async () => {
    const r = await llamar("PATCH", `/reservas/${reservaDocente.id}/cancelar`, { token: estudiante, cuerpo: {} });
    assert.equal(r.estado, 403);
  });

  it("el estudiante cancela su reserva", async () => {
    const r = await llamar("PATCH", `/reservas/${reservaEstudiante.id}/cancelar`, {
      token: estudiante,
      cuerpo: { motivo: "Ya no la necesito" }
    });
    assert.equal(r.estado, 200);
    assert.equal(r.datos.estado, "cancelada");
  });

  it("el historial de la reserva se lee desde MongoDB con todos sus eventos", async () => {
    const r = await llamar("GET", `/reservas/${reservaEstudiante.id}/historial`, { token: estudiante });
    assert.equal(r.estado, 200);
    assert.deepEqual(
      r.datos.map((e) => e.tipo),
      ["RESERVA_SOLICITADA", "RESERVA_APROBADA", "RESERVA_CANCELADA"]
    );
  });

  it("el intento rechazado por conflicto quedó registrado en MongoDB", async () => {
    const r = await llamar("GET", "/actividad?tipo=RESERVA_CONFLICTO&limite=5", { token: admin });
    assert.ok(r.datos.some((e) => e.detalle.fecha === fecha && e.detalle.espacio.id === sala.id));
  });
});

describe("Administración de espacios", () => {
  let espacioId;

  it("crea un espacio con equipamiento", async () => {
    const edificios = await llamar("GET", "/edificios?sedeId=santiago", { token: admin });
    const equipos = await llamar("GET", "/equipamiento", { token: admin });
    const codigo = `T-${Date.now().toString().slice(-6)}`;
    const r = await llamar("POST", "/espacios", {
      token: admin,
      cuerpo: {
        codigo,
        nombre: "Sala de prueba e2e",
        tipoId: 1,
        edificioId: edificios.datos[0].id,
        piso: 1,
        capacidad: 10,
        equipamiento: [{ equipamientoId: equipos.datos[0].id, cantidad: 2 }]
      }
    });
    assert.equal(r.estado, 201, JSON.stringify(r.datos));
    assert.equal(r.datos.equipamiento[0].cantidad, 2);
    espacioId = r.datos.id;
  });

  it("valida los datos del espacio (400 con detalle por campo)", async () => {
    const r = await llamar("POST", "/espacios", { token: admin, cuerpo: { codigo: "!", capacidad: 0 } });
    assert.equal(r.estado, 400);
    assert.ok(r.datos.error.detalles.some((d) => d.campo === "capacidad"));
  });

  it("un espacio en mantención no se puede reservar", async () => {
    const actual = await llamar("GET", `/espacios/${espacioId}`, { token: admin });
    const e = actual.datos;
    await llamar("PUT", `/espacios/${espacioId}`, {
      token: admin,
      cuerpo: {
        codigo: e.codigo, nombre: e.nombre, tipoId: e.tipo.id, edificioId: e.edificio.id, piso: e.piso,
        capacidad: e.capacidad, exterior: e.exterior, estado: "mantencion", equipamiento: []
      }
    });
    const r = await llamar("POST", "/reservas", {
      token: docente,
      cuerpo: { espacioId, fecha, horaInicio: 9, duracion: 1, personas: 2, motivo: "No debería pasar" }
    });
    assert.equal(r.estado, 422);
    assert.equal(r.datos.error.codigo, "ESPACIO_EN_MANTENCION");
  });

  it("elimina el espacio sin reservas", async () => {
    assert.equal((await llamar("DELETE", `/espacios/${espacioId}`, { token: admin })).estado, 204);
    assert.equal((await llamar("GET", `/espacios/${espacioId}`, { token: admin })).estado, 404);
  });
});

describe("Indicadores", () => {
  it("devuelve el panel con datos de PostgreSQL y MongoDB", async () => {
    const r = await llamar("GET", "/indicadores", { token: admin });
    assert.equal(r.estado, 200);
    assert.ok(r.datos.resumen.totalSolicitudes > 0);
    assert.equal(r.datos.porHora.length, 13);
    assert.ok(Array.isArray(r.datos.actividad.eventosPorTipo));
  });
});
