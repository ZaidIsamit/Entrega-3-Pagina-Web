import { z } from "zod";
import { enteroQuery, fechaISO, texto, textoOpcional } from "./comunes.schema.js";
import { HORA_APERTURA, HORA_CIERRE } from "../utils/tiempo.js";

export const ESTADOS_RESERVA = ["pendiente", "aprobada", "rechazada", "cancelada"];

export const crearReservaSchema = z
  .object({
    espacioId: z.coerce.number({ invalid_type_error: "Selecciona un espacio." }).int().positive(),
    fecha: fechaISO,
    horaInicio: z.coerce
      .number({ invalid_type_error: "La hora de inicio debe ser un número." })
      .int("La hora de inicio debe ser una hora exacta.")
      .min(HORA_APERTURA, `Los espacios abren a las ${HORA_APERTURA}:00.`)
      .max(HORA_CIERRE - 1, `El último bloque comienza a las ${HORA_CIERRE - 1}:00.`),
    duracion: z.coerce
      .number({ invalid_type_error: "La duración debe ser un número." })
      .int("La duración debe ser un número entero de horas.")
      .min(1, "La duración mínima es 1 hora."),
    personas: z.coerce
      .number({ invalid_type_error: "La cantidad de personas debe ser un número." })
      .int("La cantidad de personas debe ser un número entero.")
      .min(1, "Debe asistir al menos 1 persona."),
    motivo: texto("El motivo", 5, 200)
  })
  .refine((d) => d.horaInicio + d.duracion <= HORA_CIERRE, {
    message: `La reserva no puede terminar después de las ${HORA_CIERRE}:00.`,
    path: ["duracion"]
  });

export const rechazarReservaSchema = z.object({
  motivo: texto("El motivo del rechazo", 5, 200)
});

export const cancelarReservaSchema = z.object({
  motivo: textoOpcional("El motivo", 200)
});

export const filtroReservasSchema = z.object({
  estado: z.enum(ESTADOS_RESERVA).optional(),
  fecha: fechaISO.optional(),
  desde: fechaISO.optional(),
  hasta: fechaISO.optional(),
  sedeId: z.string().trim().min(1).optional(),
  espacioId: enteroQuery
});

export const misReservasSchema = z.object({
  alcance: z.enum(["proximas", "historial", "todas"]).default("proximas"),
  estado: z.enum(ESTADOS_RESERVA).optional()
});

export const ocupacionSchema = z.object({
  sedeId: z.string({ required_error: "La sede es obligatoria." }).trim().min(1),
  fecha: fechaISO
});

export const disponibilidadSchema = z.object({
  fecha: fechaISO
});
