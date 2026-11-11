import { fechaISO } from "../utils/fechas.js";

export default function FiltrosEspacios({ filtros, sedes, tipos, onCambiar, onLimpiar }) {
  return (
    <section className="filters-card" aria-label="Filtros de búsqueda">
      <div className="type-chips d-none d-md-flex" role="group" aria-label="Tipo de espacio">
        <button
          type="button"
          className={`type-chip ${filtros.tipoId === "" ? "active" : ""}`}
          onClick={() => onCambiar("tipoId", "")}
        >
          <i className="bi bi-grid" aria-hidden="true"></i> Todos
        </button>
        {tipos.map((tipo) => (
          <button
            key={tipo.id}
            type="button"
            className={`type-chip ${filtros.tipoId === String(tipo.id) ? "active" : ""}`}
            onClick={() => onCambiar("tipoId", String(tipo.id))}
          >
            <i className={`bi ${tipo.icono}`} aria-hidden="true"></i> {tipo.nombre}
          </button>
        ))}
      </div>

      <div className="row g-3">
        <div className="col-12 col-sm-6 d-md-none">
          <label htmlFor="filtro-tipo" className="form-label">Tipo de espacio</label>
          <select
            id="filtro-tipo"
            className="form-select"
            value={filtros.tipoId}
            onChange={(e) => onCambiar("tipoId", e.target.value)}
          >
            <option value="">Todos</option>
            {tipos.map((tipo) => (
              <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-12 col-sm-6 col-lg-3">
          <label htmlFor="filtro-sede" className="form-label">Sede</label>
          <select
            id="filtro-sede"
            className="form-select"
            value={filtros.sedeId}
            onChange={(e) => onCambiar("sedeId", e.target.value)}
          >
            {sedes.map((sede) => (
              <option key={sede.id} value={sede.id}>{sede.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-7 col-sm-6 col-lg-3">
          <label htmlFor="filtro-fecha" className="form-label">Fecha</label>
          <input
            id="filtro-fecha"
            type="date"
            className="form-control"
            min={fechaISO()}
            value={filtros.fecha}
            onChange={(e) => e.target.value && onCambiar("fecha", e.target.value)}
          />
        </div>
        <div className="col-5 col-sm-6 col-lg-2">
          <label htmlFor="filtro-personas" className="form-label">Personas</label>
          <input
            id="filtro-personas"
            type="number"
            className="form-control"
            min="1"
            max="500"
            value={filtros.personas}
            onChange={(e) => onCambiar("personas", e.target.value)}
          />
        </div>
        <div className="col-12 col-sm-6 col-lg-4">
          <label htmlFor="filtro-busqueda" className="form-label">Buscar</label>
          <div className="input-icon">
            <i className="bi bi-search" aria-hidden="true"></i>
            <input
              id="filtro-busqueda"
              type="search"
              className="form-control"
              placeholder="Nombre, código, edificio o equipamiento"
              value={filtros.busqueda}
              onChange={(e) => onCambiar("busqueda", e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end mt-2">
        <button type="button" className="btn btn-link btn-sm text-decoration-none px-0" onClick={onLimpiar}>
          <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true"></i>Limpiar filtros
        </button>
      </div>
    </section>
  );
}
