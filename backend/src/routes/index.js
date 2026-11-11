import { Router } from "express";
import * as auth from "../controllers/auth.controller.js";
import * as infra from "../controllers/infraestructura.controller.js";
import * as reportes from "../controllers/reportes.controller.js";
import * as reservas from "../controllers/reservas.controller.js";
import { autenticar, soloAdmin } from "../middlewares/autenticacion.js";
import { validar } from "../middlewares/validar.js";
import { loginSchema } from "../schemas/auth.schema.js";
import { idParam } from "../schemas/comunes.schema.js";
import {
  edificioSchema,
  equipamientoSchema,
  espacioSchema,
  filtroEdificiosSchema,
  filtroEspaciosSchema
} from "../schemas/infraestructura.schema.js";
import { actividadSchema, indicadoresSchema } from "../schemas/reportes.schema.js";
import {
  cancelarReservaSchema,
  crearReservaSchema,
  disponibilidadSchema,
  filtroReservasSchema,
  misReservasSchema,
  ocupacionSchema,
  rechazarReservaSchema
} from "../schemas/reservas.schema.js";

const conId = validar(idParam, "params");

export const rutas = Router();

// ---------- Públicas ----------
rutas.get("/salud", reportes.salud);
rutas.post("/auth/login", validar(loginSchema), auth.login);

// ---------- Desde aquí todas requieren sesión ----------
rutas.use(autenticar);

rutas.get("/auth/perfil", auth.perfil);

// Catálogos
rutas.get("/sedes", infra.listarSedes);
rutas.get("/tipos-espacio", infra.listarTiposEspacio);

// Edificios
rutas.get("/edificios", validar(filtroEdificiosSchema, "query"), infra.listarEdificios);
rutas.post("/edificios", soloAdmin, validar(edificioSchema), infra.crearEdificio);
rutas.put("/edificios/:id", soloAdmin, conId, validar(edificioSchema), infra.actualizarEdificio);
rutas.delete("/edificios/:id", soloAdmin, conId, infra.eliminarEdificio);

// Equipamiento
rutas.get("/equipamiento", infra.listarEquipamiento);
rutas.post("/equipamiento", soloAdmin, validar(equipamientoSchema), infra.crearEquipamiento);
rutas.put("/equipamiento/:id", soloAdmin, conId, validar(equipamientoSchema), infra.actualizarEquipamiento);
rutas.delete("/equipamiento/:id", soloAdmin, conId, infra.eliminarEquipamiento);

// Espacios
rutas.get("/espacios", validar(filtroEspaciosSchema, "query"), infra.listarEspacios);
rutas.get("/espacios/:id", conId, infra.obtenerEspacio);
rutas.get(
  "/espacios/:id/disponibilidad",
  conId,
  validar(disponibilidadSchema, "query"),
  reservas.disponibilidad
);
rutas.post("/espacios", soloAdmin, validar(espacioSchema), infra.crearEspacio);
rutas.put("/espacios/:id", soloAdmin, conId, validar(espacioSchema), infra.actualizarEspacio);
rutas.delete("/espacios/:id", soloAdmin, conId, infra.eliminarEspacio);

// Reservas (las rutas fijas van antes de "/reservas/:id")
rutas.get("/reservas/ocupacion", validar(ocupacionSchema, "query"), reservas.ocupacion);
rutas.get("/reservas/mias", validar(misReservasSchema, "query"), reservas.misReservas);
rutas.get("/reservas", soloAdmin, validar(filtroReservasSchema, "query"), reservas.listar);
rutas.post("/reservas", validar(crearReservaSchema), reservas.crear);
rutas.get("/reservas/:id", conId, reservas.obtener);
rutas.get("/reservas/:id/historial", conId, reservas.historial);
rutas.patch("/reservas/:id/aprobar", soloAdmin, conId, reservas.aprobar);
rutas.patch("/reservas/:id/rechazar", soloAdmin, conId, validar(rechazarReservaSchema), reservas.rechazar);
rutas.patch("/reservas/:id/cancelar", conId, validar(cancelarReservaSchema), reservas.cancelar);

// Indicadores y actividad
rutas.get("/indicadores", soloAdmin, validar(indicadoresSchema, "query"), reportes.panelIndicadores);
rutas.get("/actividad", soloAdmin, validar(actividadSchema, "query"), reportes.listarActividad);
rutas.get("/actividad/mia", validar(actividadSchema, "query"), reportes.miActividad);
