// Error de la aplicación con código HTTP y un código corto que el frontend puede interpretar.
// Todo lo que se lanza con ErrorApp se considera "esperado" y su mensaje se muestra al usuario.
export class ErrorApp extends Error {
  constructor(estadoHttp, codigo, mensaje, detalles) {
    super(mensaje);
    this.estadoHttp = estadoHttp;
    this.codigo = codigo;
    this.detalles = detalles;
  }
}

export const errores = {
  solicitudInvalida: (mensaje, detalles) => new ErrorApp(400, "SOLICITUD_INVALIDA", mensaje, detalles),
  noAutenticado: (mensaje = "Debes iniciar sesión.") => new ErrorApp(401, "NO_AUTENTICADO", mensaje),
  sinPermiso: (mensaje = "No tienes permiso para realizar esta acción.") =>
    new ErrorApp(403, "SIN_PERMISO", mensaje),
  noEncontrado: (recurso) => new ErrorApp(404, "NO_ENCONTRADO", `${recurso} no existe.`),
  conflicto: (mensaje, detalles) => new ErrorApp(409, "CONFLICTO", mensaje, detalles),
  reglaNegocio: (codigo, mensaje, detalles) => new ErrorApp(422, codigo, mensaje, detalles)
};
