import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loginSchema } from "../src/schemas/auth.schema.js";
import { espacioSchema } from "../src/schemas/infraestructura.schema.js";
import { crearReservaSchema } from "../src/schemas/reservas.schema.js";
import { rutEsValido } from "../src/utils/rut.js";

describe("RUT", () => {
  it("valida el dígito verificador", () => {
    assert.equal(rutEsValido("21.668.839-2"), true);
    assert.equal(rutEsValido("11.111.111-1"), true);
    assert.equal(rutEsValido("21.668.839-3"), false);
  });
  it("el login limpia el formato del RUT", () => {
    const r = loginSchema.parse({ rut: "21.668.839-2", password: "x" });
    assert.equal(r.rut, "216688392");
  });
});

describe("crearReservaSchema", () => {
  const valida = { espacioId: 1, fecha: "2026-11-10", horaInicio: 10, duracion: 2, personas: 5, motivo: "Estudio" };

  it("acepta una solicitud válida", () => {
    assert.equal(crearReservaSchema.safeParse(valida).success, true);
  });
  it("rechaza un motivo muy corto", () => {
    assert.equal(crearReservaSchema.safeParse({ ...valida, motivo: "ab" }).success, false);
  });
  it("rechaza reservas que terminan después de las 21:00", () => {
    const r = crearReservaSchema.safeParse({ ...valida, horaInicio: 20, duracion: 2 });
    assert.equal(r.success, false);
    assert.equal(r.error.issues[0].path[0], "duracion");
  });
  it("rechaza fechas con formato inválido", () => {
    assert.equal(crearReservaSchema.safeParse({ ...valida, fecha: "10-11-2026" }).success, false);
  });
});

describe("espacioSchema", () => {
  const valido = { codigo: "r1-305", nombre: "Sala R1-305", tipoId: 1, edificioId: 1, piso: 3, capacidad: 30 };

  it("normaliza el código a mayúsculas y aplica valores por defecto", () => {
    const r = espacioSchema.parse(valido);
    assert.equal(r.codigo, "R1-305");
    assert.equal(r.estado, "disponible");
    assert.deepEqual(r.equipamiento, []);
  });
  it("rechaza capacidad 0 y equipamiento repetido", () => {
    assert.equal(espacioSchema.safeParse({ ...valido, capacidad: 0 }).success, false);
    const repetido = { ...valido, equipamiento: [{ equipamientoId: 1 }, { equipamientoId: 1 }] };
    assert.equal(espacioSchema.safeParse(repetido).success, false);
  });
});
