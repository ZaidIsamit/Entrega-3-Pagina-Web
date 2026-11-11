import { z } from "zod";
import { fechaISO } from "./comunes.schema.js";

export const indicadoresSchema = z
  .object({
    desde: fechaISO.optional(),
    hasta: fechaISO.optional(),
    sedeId: z.string().trim().min(1).optional()
  })
  .refine((d) => !d.desde || !d.hasta || d.desde <= d.hasta, {
    message: "La fecha 'desde' debe ser anterior o igual a 'hasta'.",
    path: ["desde"]
  });

export const actividadSchema = z.object({
  categoria: z.enum(["reserva", "infraestructura", "sesion"]).optional(),
  tipo: z
    .string()
    .trim()
    .regex(/^[A-Z_]+$/, "Tipo de evento inválido.")
    .optional(),
  usuarioId: z.coerce.number().int().positive().optional(),
  antesDe: z
    .string()
    .regex(/^[a-f0-9]{24}$/, "Cursor inválido.")
    .optional(),
  limite: z.coerce.number().int().min(1).max(100).default(30)
});
