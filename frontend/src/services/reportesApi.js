import { http } from "./http.js";

export const obtenerIndicadores = (filtros) => http.get("/indicadores", { query: filtros });
export const listarActividad = (filtros) => http.get("/actividad", { query: filtros });
export const miActividad = (filtros) => http.get("/actividad/mia", { query: filtros });
