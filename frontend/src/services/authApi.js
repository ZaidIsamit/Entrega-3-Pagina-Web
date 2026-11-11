import { http } from "./http.js";

export const iniciarSesion = (rut, password) => http.post("/auth/login", { rut, password });
export const obtenerPerfil = () => http.get("/auth/perfil");
