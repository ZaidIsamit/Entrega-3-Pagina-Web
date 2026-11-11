import { ErrorApp, errores } from "../utils/errores.js";

// Traduce errores conocidos de PostgreSQL a respuestas HTTP comprensibles.
// Así una restricción de la base (por ejemplo, el EXCLUDE de traslape) también llega como 409.
function traducirErrorPostgres(error) {
  switch (error.code) {
    case "23P01": // exclusion_violation
      return errores.conflicto("El horario se traslapa con otra reserva activa de este espacio.");
    case "23505": // unique_violation
      return errores.conflicto("Ya existe un registro con esos datos (valor duplicado).", {
        restriccion: error.constraint
      });
    case "23503": // foreign_key_violation
      return errores.conflicto(
        "La operación no es posible porque el registro está relacionado con otros datos."
      );
    case "23514": // check_violation
      return errores.solicitudInvalida("Los datos no cumplen las restricciones del modelo.", {
        restriccion: error.constraint
      });
    case "22P02": // invalid_text_representation
      return errores.solicitudInvalida("Algún valor tiene un formato inválido.");
    default:
      return null;
  }
}

export function rutaNoEncontrada(req, _res, next) {
  next(new ErrorApp(404, "RUTA_NO_ENCONTRADA", `No existe ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function manejarErrores(error, req, res, _next) {
  let errorApp = error instanceof ErrorApp ? error : traducirErrorPostgres(error);

  if (!errorApp && error.type === "entity.parse.failed") {
    errorApp = errores.solicitudInvalida("El cuerpo de la solicitud no es un JSON válido.");
  }

  if (!errorApp) {
    // Error inesperado: se registra completo en el servidor, pero al cliente
    // solo se le envía un mensaje genérico (sin detalles internos ni credenciales).
    console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, error);
    errorApp = new ErrorApp(500, "ERROR_INTERNO", "Ocurrió un error inesperado. Intenta nuevamente.");
  }

  const cuerpo = { error: { codigo: errorApp.codigo, mensaje: errorApp.message } };
  if (errorApp.detalles) cuerpo.error.detalles = errorApp.detalles;
  res.status(errorApp.estadoHttp).json(cuerpo);
}
