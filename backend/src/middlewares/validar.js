import { errores } from "../utils/errores.js";

// Valida req.body, req.query o req.params con un esquema de Zod.
// El resultado ya validado (y convertido) queda en req.datos[origen].
export function validar(esquema, origen = "body") {
  return (req, _res, next) => {
    const resultado = esquema.safeParse(req[origen] ?? {});
    if (!resultado.success) {
      const detalles = resultado.error.issues.map((i) => ({
        campo: i.path.join(".") || origen,
        mensaje: i.message
      }));
      throw errores.solicitudInvalida("Hay datos inválidos en la solicitud.", detalles);
    }
    req.datos = { ...req.datos, [origen]: resultado.data };
    next();
  };
}
