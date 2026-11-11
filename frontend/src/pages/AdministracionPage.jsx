import { useState } from "react";
import BadgeEstado from "../components/BadgeEstado.jsx";
import Cargando from "../components/Cargando.jsx";
import Confirmacion from "../components/Confirmacion.jsx";
import ErrorCarga from "../components/ErrorCarga.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import FormularioEdificio from "../components/admin/FormularioEdificio.jsx";
import FormularioEquipamiento from "../components/admin/FormularioEquipamiento.jsx";
import FormularioEspacio from "../components/admin/FormularioEspacio.jsx";
import { useNotificar } from "../context/NotificacionesContext.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import * as api from "../services/infraestructuraApi.js";

const SECCIONES = [
  { id: "espacios", texto: "Salas y laboratorios", corto: "Espacios", icono: "bi-door-open" },
  { id: "edificios", texto: "Edificios", corto: "Edificios", icono: "bi-building" },
  { id: "equipamiento", texto: "Equipamiento", corto: "Equipos", icono: "bi-box-seam" }
];

// Configuración de cada tipo de recurso: cómo se crea, actualiza, elimina y se nombra
const RECURSOS = {
  espacios: { crear: api.crearEspacio, actualizar: api.actualizarEspacio, eliminar: api.eliminarEspacio, nombre: (x) => `${x.codigo} · ${x.nombre}` },
  edificios: { crear: api.crearEdificio, actualizar: api.actualizarEdificio, eliminar: api.eliminarEdificio, nombre: (x) => x.nombre },
  equipamiento: { crear: api.crearEquipamiento, actualizar: api.actualizarEquipamiento, eliminar: api.eliminarEquipamiento, nombre: (x) => x.nombre }
};

export default function AdministracionPage() {
  const notificar = useNotificar();
  const [seccion, setSeccion] = useState("espacios");
  const [filtroSede, setFiltroSede] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [formulario, setFormulario] = useState(null); // { seccion, item | null }
  const [aEliminar, setAEliminar] = useState(null); // { seccion, item }

  const datos = useConsulta(
    () =>
      Promise.all([
        api.listarEspacios({ incluirInactivos: true }),
        api.listarEdificios(),
        api.listarEquipamiento(),
        api.listarTiposEspacio(),
        api.listarSedes()
      ]).then(([espacios, edificios, equipamiento, tipos, sedes]) => ({ espacios, edificios, equipamiento, tipos, sedes })),
    []
  );

  async function guardar(valores) {
    const recurso = RECURSOS[formulario.seccion];
    const resultado = formulario.item
      ? await recurso.actualizar(formulario.item.id, valores)
      : await recurso.crear(valores);
    notificar("exito", formulario.item ? "Cambios guardados" : "Registro creado", recurso.nombre(resultado));
    setFormulario(null);
    datos.recargar();
  }

  async function eliminar() {
    const recurso = RECURSOS[aEliminar.seccion];
    await recurso.eliminar(aEliminar.item.id);
    notificar("exito", "Registro eliminado", recurso.nombre(aEliminar.item));
    setAEliminar(null);
    datos.recargar();
  }

  if (datos.estado === "cargando" && !datos.datos) return <Cargando />;
  if (datos.estado === "error") return <ErrorCarga error={datos.error} onReintentar={datos.recargar} />;

  const { espacios, edificios, equipamiento, tipos, sedes } = datos.datos;
  const texto = busqueda.trim().toLowerCase();
  const espaciosFiltrados = espacios.filter(
    (e) =>
      (!filtroSede || e.sede.id === filtroSede) &&
      (!texto || `${e.codigo} ${e.nombre} ${e.edificio.nombre}`.toLowerCase().includes(texto))
  );
  const edificiosFiltrados = edificios.filter((e) => !filtroSede || e.sede.id === filtroSede);

  const botonNuevo = {
    espacios: "Nuevo espacio",
    edificios: "Nuevo edificio",
    equipamiento: "Nuevo equipamiento"
  }[seccion];

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Administración</span>
          <h1 className="page-title">Infraestructura</h1>
          <p className="page-lead">Administra edificios, salas, laboratorios, su capacidad, equipamiento y disponibilidad.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setFormulario({ seccion, item: null })}>
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>{botonNuevo}
        </button>
      </div>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Sección">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={seccion === s.id}
              className={`segmented-btn ${seccion === s.id ? "active" : ""}`}
              onClick={() => setSeccion(s.id)}
            >
              <i className={`bi ${s.icono}`} aria-hidden="true"></i>{" "}
              <span className="d-none d-md-inline">{s.texto}</span>
              <span className="d-md-none">{s.corto}</span>
            </button>
          ))}
        </div>
        {seccion !== "equipamiento" && (
          <div className="toolbar-filter">
            {seccion === "espacios" && (
              <input
                type="search"
                className="form-control form-control-sm"
                placeholder="Buscar código o nombre"
                aria-label="Buscar espacio"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            )}
            <select className="form-select form-select-sm" aria-label="Filtrar por sede" value={filtroSede} onChange={(e) => setFiltroSede(e.target.value)}>
              <option value="">Todas las sedes</option>
              {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
        )}
      </div>

      {seccion === "espacios" && (
        espaciosFiltrados.length === 0 ? (
          <EstadoVacio icono="bi-door-closed" titulo="No hay espacios con esos filtros">Crea uno con el botón “Nuevo espacio”.</EstadoVacio>
        ) : (
          <>
          {/* Celular: una tarjeta por espacio (la tabla no cabe) */}
          <ul className="admin-list d-md-none">
            {espaciosFiltrados.map((e) => (
              <li key={e.id} className={`admin-card ${e.estado === "inactivo" ? "row-muted" : ""}`}>
                <div className="d-flex align-items-start gap-3">
                  <span className={`space-icon tone-${e.tipo.color}`}>
                    <i className={`bi ${e.tipo.icono}`} aria-hidden="true"></i>
                  </span>
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold">{e.nombre}</div>
                    <div className="small text-muted">{e.codigo} · {e.tipo.nombre}</div>
                    <div className="small mt-1">
                      <i className="bi bi-geo-alt me-1" aria-hidden="true"></i>
                      {e.edificio.nombre}{e.piso > 0 && `, piso ${e.piso}`} · {e.sede.nombre}
                    </div>
                    <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                      <BadgeEstado estado={e.estado} tipo="espacio" />
                      <span className="small"><i className="bi bi-person-fill me-1" aria-hidden="true"></i>{e.capacidad}</span>
                    </div>
                  </div>
                </div>
                <div className="admin-card-actions">
                  <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setFormulario({ seccion: "espacios", item: e })}>
                    <i className="bi bi-pencil me-1" aria-hidden="true"></i>Editar
                  </button>
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setAEliminar({ seccion: "espacios", item: e })}>
                    <i className="bi bi-trash me-1" aria-hidden="true"></i>Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="table-card d-none d-md-block">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Espacio</th>
                    <th className="d-none d-md-table-cell">Ubicación</th>
                    <th className="text-center">Capacidad</th>
                    <th className="d-none d-lg-table-cell">Equipamiento</th>
                    <th>Estado</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {espaciosFiltrados.map((e) => (
                    <tr key={e.id} className={e.estado === "inactivo" ? "row-muted" : ""}>
                      <td>
                        <div className="fw-semibold">{e.nombre}</div>
                        <div className="small text-muted">
                          <i className={`bi ${e.tipo.icono} me-1`} aria-hidden="true"></i>{e.codigo} · {e.tipo.nombre}
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell small">
                        {e.edificio.nombre}{e.piso > 0 && `, piso ${e.piso}`}
                        <div className="text-muted">{e.sede.nombre}</div>
                      </td>
                      <td className="text-center">{e.capacidad}</td>
                      <td className="d-none d-lg-table-cell small">
                        {e.equipamiento.map((q) => `${q.nombre}${q.cantidad > 1 ? ` ×${q.cantidad}` : ""}`).join(", ") || "—"}
                      </td>
                      <td><BadgeEstado estado={e.estado} tipo="espacio" /></td>
                      <td className="text-end text-nowrap">
                        <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => setFormulario({ seccion: "espacios", item: e })} aria-label={`Editar ${e.nombre}`}>
                          <i className="bi bi-pencil" aria-hidden="true"></i>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setAEliminar({ seccion: "espacios", item: e })} aria-label={`Eliminar ${e.nombre}`}>
                          <i className="bi bi-trash" aria-hidden="true"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </>
        )
      )}

      {seccion === "edificios" && (
        <div className="admin-grid">
          {edificiosFiltrados.map((ed) => (
            <article key={ed.id} className="admin-card">
              <div className="d-flex align-items-start gap-3">
                <span className="space-icon tone-azul"><i className="bi bi-building" aria-hidden="true"></i></span>
                <div className="flex-grow-1 min-w-0">
                  <h3 className="space-title">{ed.nombre}</h3>
                  <div className="space-meta">{ed.sede.nombre}{ed.direccion && ` · ${ed.direccion}`}</div>
                  <div className="small mt-1">
                    {ed.pisos} {ed.pisos === 1 ? "piso" : "pisos"} · {ed.totalEspacios} {ed.totalEspacios === 1 ? "espacio" : "espacios"}
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setFormulario({ seccion: "edificios", item: ed })}>
                  <i className="bi bi-pencil me-1" aria-hidden="true"></i>Editar
                </button>
                <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setAEliminar({ seccion: "edificios", item: ed })}>
                  <i className="bi bi-trash me-1" aria-hidden="true"></i>Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {seccion === "equipamiento" && (
        <div className="admin-grid admin-grid-sm">
          {equipamiento.map((q) => (
            <article key={q.id} className="admin-card admin-card-row">
              <span className="space-icon tone-violeta"><i className={`bi ${q.icono}`} aria-hidden="true"></i></span>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-semibold">{q.nombre}</div>
                <div className="small text-muted">{q.totalEspacios} {q.totalEspacios === 1 ? "espacio" : "espacios"}</div>
              </div>
              <button type="button" className="btn btn-sm btn-link" onClick={() => setFormulario({ seccion: "equipamiento", item: q })} aria-label={`Editar ${q.nombre}`}>
                <i className="bi bi-pencil" aria-hidden="true"></i>
              </button>
              <button type="button" className="btn btn-sm btn-link text-danger" onClick={() => setAEliminar({ seccion: "equipamiento", item: q })} aria-label={`Eliminar ${q.nombre}`}>
                <i className="bi bi-trash" aria-hidden="true"></i>
              </button>
            </article>
          ))}
        </div>
      )}

      {formulario?.seccion === "espacios" && (
        <FormularioEspacio espacio={formulario.item} tipos={tipos} edificios={edificios} equipamiento={equipamiento} onGuardar={guardar} onCerrar={() => setFormulario(null)} />
      )}
      {formulario?.seccion === "edificios" && (
        <FormularioEdificio edificio={formulario.item} sedes={sedes} onGuardar={guardar} onCerrar={() => setFormulario(null)} />
      )}
      {formulario?.seccion === "equipamiento" && (
        <FormularioEquipamiento item={formulario.item} onGuardar={guardar} onCerrar={() => setFormulario(null)} />
      )}

      {aEliminar && (
        <Confirmacion
          titulo="Eliminar registro"
          mensaje={
            <>
              ¿Eliminar <strong>{RECURSOS[aEliminar.seccion].nombre(aEliminar.item)}</strong>? Esta acción no se puede deshacer.
              {aEliminar.seccion === "espacios" && (
                <div className="small text-muted mt-2">Si el espacio tiene reservas no se podrá eliminar; en ese caso cámbialo a “Inactivo”.</div>
              )}
            </>
          }
          textoConfirmar="Eliminar"
          onConfirmar={eliminar}
          onCerrar={() => setAEliminar(null)}
        />
      )}
    </>
  );
}
