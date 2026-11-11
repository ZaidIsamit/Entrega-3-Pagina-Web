// Cliente HTTP de la API propia. Todas las llamadas del frontend pasan por aquí:
// agrega el token, convierte la respuesta a JSON y transforma los errores en ApiError.

const URL_BASE = import.meta.env.VITE_API_URL || "/api";
const CLAVE_TOKEN = "unab_token_v3";

export class ApiError extends Error {
  constructor(estado, codigo, mensaje, detalles) {
    super(mensaje);
    this.estado = estado;
    this.codigo = codigo;
    this.detalles = detalles;
  }

  // Convierte [{ campo, mensaje }] en { campo: mensaje } para mostrarlo en los formularios
  erroresPorCampo() {
    if (!Array.isArray(this.detalles)) return {};
    return Object.fromEntries(this.detalles.map((d) => [d.campo, d.mensaje]));
  }
}

let alExpirarSesion = () => {};
export function configurarExpiracionSesion(callback) {
  alExpirarSesion = callback;
}

export function guardarToken(token) {
  try {
    if (token) localStorage.setItem(CLAVE_TOKEN, token);
    else localStorage.removeItem(CLAVE_TOKEN);
  } catch {}
}

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

function construirQuery(parametros) {
  if (!parametros) return "";
  const limpios = Object.entries(parametros).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return limpios.length ? `?${new URLSearchParams(limpios)}` : "";
}

export async function solicitar(metodo, ruta, { cuerpo, query, signal } = {}) {
  const token = leerToken();
  let respuesta;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}${construirQuery(query)}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(0, "SIN_CONEXION", "No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
  }

  if (respuesta.status === 204) return null;
  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const error = datos?.error;
    if (respuesta.status === 401 && token) alExpirarSesion();
    throw new ApiError(
      respuesta.status,
      error?.codigo ?? "ERROR",
      error?.mensaje ?? `El servidor respondió con estado ${respuesta.status}.`,
      error?.detalles
    );
  }
  return datos;
}

export const http = {
  get: (ruta, opciones) => solicitar("GET", ruta, opciones),
  post: (ruta, cuerpo) => solicitar("POST", ruta, { cuerpo }),
  put: (ruta, cuerpo) => solicitar("PUT", ruta, { cuerpo }),
  patch: (ruta, cuerpo = {}) => solicitar("PATCH", ruta, { cuerpo }),
  delete: (ruta) => solicitar("DELETE", ruta)
};
