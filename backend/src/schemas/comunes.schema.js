import { z } from "zod";

export const idParam = z.object({
  id: z.coerce.number({ invalid_type_error: "El id debe ser un número." }).int().positive("El id debe ser positivo.")
});

export const fechaISO = z
  .string({ required_error: "La fecha es obligatoria." })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha debe tener el formato AAAA-MM-DD.")
  .refine((valor) => !Number.isNaN(new Date(`${valor}T12:00:00Z`).getTime()), "La fecha no es válida.");

// Texto obligatorio, sin espacios sobrantes
export const texto = (campo, min, max) =>
  z
    .string({ required_error: `${campo} es obligatorio.`, invalid_type_error: `${campo} debe ser texto.` })
    .trim()
    .min(min, `${campo} debe tener al menos ${min} caracteres.`)
    .max(max, `${campo} puede tener como máximo ${max} caracteres.`);

// Texto opcional: "" o null se guardan como null
export const textoOpcional = (campo, max) =>
  z
    .string()
    .trim()
    .max(max, `${campo} puede tener como máximo ${max} caracteres.`)
    .nullish()
    .transform((v) => (v ? v : null));

export const enteroQuery = z.coerce.number().int().positive().optional();

// En la query string los booleanos llegan como texto
export const booleanoQuery = z
  .enum(["true", "false"])
  .optional()
  .transform((v) => v === "true");
