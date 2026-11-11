import { z } from "zod";
import { booleanoQuery, enteroQuery, texto, textoOpcional } from "./comunes.schema.js";

export const ESTADOS_ESPACIO = ["disponible", "mantencion", "inactivo"];

// ---------- Edificios ----------
export const edificioSchema = z.object({
  sedeId: texto("La sede", 1, 30),
  nombre: texto("El nombre", 3, 80),
  direccion: textoOpcional("La dirección", 150),
  pisos: z.coerce
    .number({ invalid_type_error: "Los pisos deben ser un número." })
    .int("Los pisos deben ser un número entero.")
    .min(1, "El edificio debe tener al menos 1 piso.")
    .max(50, "Máximo 50 pisos.")
});

export const filtroEdificiosSchema = z.object({
  sedeId: z.string().trim().min(1).optional()
});

// ---------- Equipamiento ----------
export const equipamientoSchema = z.object({
  nombre: texto("El nombre", 2, 50),
  icono: z
    .string()
    .trim()
    .regex(/^bi-[a-z0-9-]+$/, "El ícono debe ser un nombre de Bootstrap Icons, por ejemplo bi-wifi.")
    .optional()
    .default("bi-box")
});

// ---------- Espacios ----------
export const espacioSchema = z
  .object({
    codigo: z
      .string({ required_error: "El código es obligatorio." })
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{2,20}$/, "El código solo admite letras, números y guiones (2 a 20 caracteres)."),
    nombre: texto("El nombre", 3, 80),
    tipoId: z.coerce.number({ invalid_type_error: "Selecciona un tipo de espacio." }).int().positive("Selecciona un tipo de espacio."),
    edificioId: z.coerce.number({ invalid_type_error: "Selecciona un edificio." }).int().positive("Selecciona un edificio."),
    piso: z.coerce.number().int("El piso debe ser un número entero.").min(0, "El piso no puede ser negativo.").max(50),
    capacidad: z.coerce
      .number({ invalid_type_error: "La capacidad debe ser un número." })
      .int("La capacidad debe ser un número entero.")
      .min(1, "La capacidad mínima es 1 persona.")
      .max(500, "La capacidad máxima es 500 personas."),
    exterior: z.boolean().default(false),
    estado: z.enum(ESTADOS_ESPACIO, { errorMap: () => ({ message: "Estado inválido." }) }).default("disponible"),
    descripcion: textoOpcional("La descripción", 300),
    equipamiento: z
      .array(
        z.object({
          equipamientoId: z.coerce.number().int().positive(),
          cantidad: z.coerce.number().int().min(1, "La cantidad mínima es 1.").max(500).default(1)
        })
      )
      .default([])
  })
  .refine(
    (d) => new Set(d.equipamiento.map((e) => e.equipamientoId)).size === d.equipamiento.length,
    { message: "Hay equipamiento repetido.", path: ["equipamiento"] }
  );

export const filtroEspaciosSchema = z.object({
  sedeId: z.string().trim().min(1).optional(),
  tipoId: enteroQuery,
  edificioId: enteroQuery,
  capacidadMin: enteroQuery,
  q: z.string().trim().max(60).optional(),
  estado: z.enum(ESTADOS_ESPACIO).optional(),
  incluirInactivos: booleanoQuery
});
