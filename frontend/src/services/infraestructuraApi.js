import { http } from "./http.js";

// Catálogos
export const listarSedes = () => http.get("/sedes");
export const listarTiposEspacio = () => http.get("/tipos-espacio");

// Espacios
export const listarEspacios = (filtros, signal) => http.get("/espacios", { query: filtros, signal });
export const obtenerEspacio = (id) => http.get(`/espacios/${id}`);
export const crearEspacio = (datos) => http.post("/espacios", datos);
export const actualizarEspacio = (id, datos) => http.put(`/espacios/${id}`, datos);
export const eliminarEspacio = (id) => http.delete(`/espacios/${id}`);

// Edificios
export const listarEdificios = (filtros) => http.get("/edificios", { query: filtros });
export const crearEdificio = (datos) => http.post("/edificios", datos);
export const actualizarEdificio = (id, datos) => http.put(`/edificios/${id}`, datos);
export const eliminarEdificio = (id) => http.delete(`/edificios/${id}`);

// Equipamiento
export const listarEquipamiento = () => http.get("/equipamiento");
export const crearEquipamiento = (datos) => http.post("/equipamiento", datos);
export const actualizarEquipamiento = (id, datos) => http.put(`/equipamiento/${id}`, datos);
export const eliminarEquipamiento = (id) => http.delete(`/equipamiento/${id}`);
