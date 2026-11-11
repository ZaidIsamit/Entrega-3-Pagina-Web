import { http } from "./http.js";

export const ocupacionSede = (sedeId, fecha, signal) =>
  http.get("/reservas/ocupacion", { query: { sedeId, fecha }, signal });

export const misReservas = (alcance) => http.get("/reservas/mias", { query: { alcance } });
export const listarReservas = (filtros) => http.get("/reservas", { query: filtros });
export const crearReserva = (datos) => http.post("/reservas", datos);
export const aprobarReserva = (id) => http.patch(`/reservas/${id}/aprobar`);
export const rechazarReserva = (id, motivo) => http.patch(`/reservas/${id}/rechazar`, { motivo });
export const cancelarReserva = (id, motivo) => http.patch(`/reservas/${id}/cancelar`, { motivo });
export const historialReserva = (id) => http.get(`/reservas/${id}/historial`);
