import { z } from "zod";
import { limpiarRut, rutEsValido } from "../utils/rut.js";

export const loginSchema = z.object({
  rut: z
    .string({ required_error: "El RUT es obligatorio." })
    .transform(limpiarRut)
    .refine(rutEsValido, "El RUT no es válido (revisa el dígito verificador)."),
  password: z
    .string({ required_error: "La contraseña es obligatoria." })
    .min(1, "La contraseña es obligatoria.")
    .max(100)
});
