import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as reglas from "../src/services/reglasReserva.js";

const ahora = { fecha: "2026-11-04", hora: 11 };
const estudiante = { nombre: "Estudiante", maxHorasReserva: 2, requiereAprobacion: true, esAdmin: false };
const docente = { nombre: "Docente", maxHorasReserva: 4, requiereAprobacion: false, esAdmin: false };
const admin = { nombre: "Administrador", maxHorasReserva: 8, requiereAprobacion: false, esAdmin: true };

describe("hayTraslape", () => {
  it("detecta bloques que se cruzan", () => {
    assert.equal(reglas.hayTraslape({ horaInicio: 10, horaFin: 12 }, { horaInicio: 11, horaFin: 13 }), true);
    assert.equal(reglas.hayTraslape({ horaInicio: 10, horaFin: 14 }, { horaInicio: 11, horaFin: 12 }), true);
  });
  it("permite bloques contiguos (uno termina cuando empieza el otro)", () => {
    assert.equal(reglas.hayTraslape({ horaInicio: 10, horaFin: 12 }, { horaInicio: 12, horaFin: 13 }), false);
  });
});

describe("validarHorario", () => {
  it("acepta un bloque futuro dentro del horario", () => {
    assert.equal(reglas.validarHorario({ fecha: "2026-11-05", horaInicio: 10, horaFin: 12 }, ahora), null);
  });
  it("rechaza bloques que ya pasaron o comenzaron", () => {
    assert.equal(reglas.validarHorario({ fecha: "2026-11-03", horaInicio: 10, horaFin: 11 }, ahora).codigo, "HORARIO_PASADO");
    assert.equal(reglas.validarHorario({ fecha: "2026-11-04", horaInicio: 11, horaFin: 12 }, ahora).codigo, "HORARIO_PASADO");
  });
  it("acepta un bloque más tarde el mismo día", () => {
    assert.equal(reglas.validarHorario({ fecha: "2026-11-04", horaInicio: 12, horaFin: 13 }, ahora), null);
  });
  it("rechaza horarios fuera de 08:00 a 21:00", () => {
    assert.equal(reglas.validarHorario({ fecha: "2026-11-05", horaInicio: 20, horaFin: 22 }, ahora).codigo, "FUERA_DE_HORARIO");
    assert.equal(reglas.validarHorario({ fecha: "2026-11-05", horaInicio: 7, horaFin: 9 }, ahora).codigo, "FUERA_DE_HORARIO");
  });
  it("rechaza fechas a más de 60 días", () => {
    assert.equal(reglas.validarHorario({ fecha: "2027-01-10", horaInicio: 10, horaFin: 11 }, ahora).codigo, "FECHA_MUY_LEJANA");
  });
});

describe("validarDuracionPorRol", () => {
  it("un estudiante puede reservar hasta 2 horas", () => {
    assert.equal(reglas.validarDuracionPorRol(2, estudiante), null);
    assert.equal(reglas.validarDuracionPorRol(3, estudiante).codigo, "DURACION_EXCEDIDA");
  });
  it("un docente puede reservar hasta 4 horas", () => {
    assert.equal(reglas.validarDuracionPorRol(4, docente), null);
  });
});

describe("validarCapacidad y validarEspacioReservable", () => {
  const sala = { nombre: "Sala R2-101", capacidad: 6, estado: "disponible" };
  it("controla la capacidad", () => {
    assert.equal(reglas.validarCapacidad(6, sala), null);
    assert.equal(reglas.validarCapacidad(7, sala).codigo, "CAPACIDAD_EXCEDIDA");
  });
  it("no permite reservar espacios en mantención o inactivos", () => {
    assert.equal(reglas.validarEspacioReservable(sala), null);
    assert.equal(reglas.validarEspacioReservable({ ...sala, estado: "mantencion" }).codigo, "ESPACIO_EN_MANTENCION");
    assert.equal(reglas.validarEspacioReservable({ ...sala, estado: "inactivo" }).codigo, "ESPACIO_NO_DISPONIBLE");
  });
});

describe("estadoInicial", () => {
  it("estudiantes quedan pendientes y docentes aprobados", () => {
    assert.equal(reglas.estadoInicial(estudiante), "pendiente");
    assert.equal(reglas.estadoInicial(docente), "aprobada");
  });
});

describe("validarCancelacion", () => {
  const reserva = { solicitante: { id: 2 }, estado: "aprobada", fecha: "2026-11-06", horaInicio: 10 };

  it("el dueño puede cancelar una reserva futura", () => {
    assert.equal(reglas.validarCancelacion(reserva, { id: 2, rol: estudiante }, ahora), null);
  });
  it("otro usuario no puede cancelarla, pero la administración sí", () => {
    assert.equal(reglas.validarCancelacion(reserva, { id: 3, rol: docente }, ahora).codigo, "SIN_PERMISO");
    assert.equal(reglas.validarCancelacion(reserva, { id: 4, rol: admin }, ahora), null);
  });
  it("no se puede cancelar una reserva ya cancelada o que ya comenzó", () => {
    assert.equal(
      reglas.validarCancelacion({ ...reserva, estado: "cancelada" }, { id: 2, rol: estudiante }, ahora).codigo,
      "ESTADO_INVALIDO"
    );
    assert.equal(
      reglas.validarCancelacion({ ...reserva, fecha: "2026-11-04", horaInicio: 9 }, { id: 2, rol: estudiante }, ahora).codigo,
      "RESERVA_INICIADA"
    );
  });
});

describe("validarRevision", () => {
  const pendiente = { estado: "pendiente", fecha: "2026-11-06", horaInicio: 10 };
  it("solo se revisan solicitudes pendientes", () => {
    assert.equal(reglas.validarRevision(pendiente, ahora, "aprobar"), null);
    assert.equal(reglas.validarRevision({ ...pendiente, estado: "aprobada" }, ahora, "aprobar").codigo, "ESTADO_INVALIDO");
  });
  it("una solicitud vencida se puede rechazar pero no aprobar", () => {
    const vencida = { ...pendiente, fecha: "2026-11-01" };
    assert.equal(reglas.validarRevision(vencida, ahora, "aprobar").codigo, "RESERVA_INICIADA");
    assert.equal(reglas.validarRevision(vencida, ahora, "rechazar"), null);
  });
});
