import { useState } from "react";
import Modal from "../Modal.jsx";
import { ESTADOS_ESPACIO } from "../../utils/formato.js";

function datosIniciales(espacio, edificios) {
  if (!espacio) {
    return {
      codigo: "",
      nombre: "",
      tipoId: "",
      edificioId: edificios[0] ? String(edificios[0].id) : "",
      piso: "1",
      capacidad: "",
      exterior: false,
      estado: "disponible",
      descripcion: "",
      equipamiento: {}
    };
  }
  return {
    codigo: espacio.codigo,
    nombre: espacio.nombre,
    tipoId: String(espacio.tipo.id),
    edificioId: String(espacio.edificio.id),
    piso: String(espacio.piso),
    capacidad: String(espacio.capacidad),
    exterior: espacio.exterior,
    estado: espacio.estado,
    descripcion: espacio.descripcion ?? "",
    // { equipamientoId: cantidad }
    equipamiento: Object.fromEntries(espacio.equipamiento.map((q) => [q.id, String(q.cantidad)]))
  };
}

export default function FormularioEspacio({ espacio, tipos, edificios, equipamiento, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState(() => datosIniciales(espacio, edificios));
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

  const edificio = edificios.find((e) => String(e.id) === datos.edificioId);

  function cambiar(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  function alternarEquipo(id) {
    setDatos((d) => {
      const nuevo = { ...d.equipamiento };
      if (nuevo[id]) delete nuevo[id];
      else nuevo[id] = "1";
      return { ...d, equipamiento: nuevo };
    });
  }

  function validar() {
    const e = {};
    if (!/^[A-Za-z0-9-]{2,20}$/.test(datos.codigo.trim())) e.codigo = "Usa 2 a 20 letras, números o guiones.";
    if (datos.nombre.trim().length < 3) e.nombre = "Mínimo 3 caracteres.";
    if (!datos.tipoId) e.tipoId = "Selecciona un tipo.";
    if (!datos.edificioId) e.edificioId = "Selecciona un edificio.";
    const capacidad = Number(datos.capacidad);
    if (!Number.isInteger(capacidad) || capacidad < 1 || capacidad > 500) e.capacidad = "Entre 1 y 500 personas.";
    const piso = Number(datos.piso);
    if (!Number.isInteger(piso) || piso < 0) e.piso = "Piso inválido.";
    else if (edificio && piso > edificio.pisos) e.piso = `${edificio.nombre} tiene ${edificio.pisos} piso(s).`;
    for (const cantidad of Object.values(datos.equipamiento)) {
      if (!(Number(cantidad) >= 1)) e.equipamiento = "Cada equipo debe tener cantidad 1 o más.";
    }
    return e;
  }

  async function alEnviar(ev) {
    ev.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    setErrorGeneral("");
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await onGuardar({
        codigo: datos.codigo.trim().toUpperCase(),
        nombre: datos.nombre.trim(),
        tipoId: Number(datos.tipoId),
        edificioId: Number(datos.edificioId),
        piso: Number(datos.piso),
        capacidad: Number(datos.capacidad),
        exterior: datos.exterior,
        estado: datos.estado,
        descripcion: datos.descripcion.trim() || null,
        equipamiento: Object.entries(datos.equipamiento).map(([id, cantidad]) => ({
          equipamientoId: Number(id),
          cantidad: Number(cantidad)
        }))
      });
    } catch (error) {
      setErrores(error.erroresPorCampo?.() ?? {});
      setErrorGeneral(error.message);
      setEnviando(false);
    }
  }

  const campo = (nombre) => `form-control ${errores[nombre] ? "is-invalid" : ""}`;
  const selector = (nombre) => `form-select ${errores[nombre] ? "is-invalid" : ""}`;

  return (
    <Modal titulo={espacio ? `Editar ${espacio.codigo}` : "Nuevo espacio"} onCerrar={enviando ? () => {} : onCerrar} tamano="modal-lg">
      <form onSubmit={alEnviar} noValidate>
        {errorGeneral && <div className="alert alert-danger py-2" role="alert">{errorGeneral}</div>}
        <div className="row g-3">
          <div className="col-5 col-md-3">
            <label htmlFor="esp-codigo" className="form-label">Código</label>
            <input id="esp-codigo" className={campo("codigo")} value={datos.codigo} onChange={(e) => cambiar("codigo", e.target.value)} placeholder="R1-305" />
            <div className="invalid-feedback">{errores.codigo}</div>
          </div>
          <div className="col-7 col-md-5">
            <label htmlFor="esp-nombre" className="form-label">Nombre</label>
            <input id="esp-nombre" className={campo("nombre")} value={datos.nombre} onChange={(e) => cambiar("nombre", e.target.value)} />
            <div className="invalid-feedback">{errores.nombre}</div>
          </div>
          <div className="col-12 col-md-4">
            <label htmlFor="esp-tipo" className="form-label">Tipo</label>
            <select id="esp-tipo" className={selector("tipoId")} value={datos.tipoId} onChange={(e) => cambiar("tipoId", e.target.value)}>
              <option value="">Selecciona…</option>
              {tipos.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
            </select>
            <div className="invalid-feedback">{errores.tipoId}</div>
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="esp-edificio" className="form-label">Edificio (ubicación)</label>
            <select id="esp-edificio" className={selector("edificioId")} value={datos.edificioId} onChange={(e) => cambiar("edificioId", e.target.value)}>
              <option value="">Selecciona…</option>
              {edificios.map((e) => <option key={e.id} value={e.id}>{e.nombre} · {e.sede.nombre}</option>)}
            </select>
            <div className="invalid-feedback">{errores.edificioId}</div>
          </div>
          <div className="col-4 col-md-2">
            <label htmlFor="esp-piso" className="form-label">Piso</label>
            <input id="esp-piso" type="number" min="0" className={campo("piso")} value={datos.piso} onChange={(e) => cambiar("piso", e.target.value)} />
            <div className="invalid-feedback">{errores.piso}</div>
          </div>
          <div className="col-8 col-md-4">
            <label htmlFor="esp-capacidad" className="form-label">Capacidad (personas)</label>
            <input id="esp-capacidad" type="number" min="1" max="500" className={campo("capacidad")} value={datos.capacidad} onChange={(e) => cambiar("capacidad", e.target.value)} />
            <div className="invalid-feedback">{errores.capacidad}</div>
          </div>
          <div className="col-12 col-md-6">
            <label htmlFor="esp-estado" className="form-label">Disponibilidad</label>
            <select id="esp-estado" className={selector("estado")} value={datos.estado} onChange={(e) => cambiar("estado", e.target.value)}>
              {Object.entries(ESTADOS_ESPACIO).map(([valor, c]) => <option key={valor} value={valor}>{c.texto}</option>)}
            </select>
            <div className="form-text">"En mantención" se ve en el catálogo pero no se puede reservar.</div>
          </div>
          <div className="col-12 col-md-6 d-flex align-items-center">
            <div className="form-check form-switch mt-md-3">
              <input id="esp-exterior" type="checkbox" className="form-check-input" checked={datos.exterior} onChange={(e) => cambiar("exterior", e.target.checked)} />
              <label htmlFor="esp-exterior" className="form-check-label">Espacio al aire libre (muestra avisos de lluvia)</label>
            </div>
          </div>
          <div className="col-12">
            <label htmlFor="esp-descripcion" className="form-label">Descripción (opcional)</label>
            <textarea id="esp-descripcion" rows="2" maxLength={300} className={campo("descripcion")} value={datos.descripcion} onChange={(e) => cambiar("descripcion", e.target.value)}></textarea>
          </div>
          <div className="col-12">
            <span className="form-label d-block">Equipamiento</span>
            <div className="equipment-picker">
              {equipamiento.map((q) => {
                const activo = datos.equipamiento[q.id] !== undefined;
                return (
                  <div key={q.id} className={`equipment-option ${activo ? "active" : ""}`}>
                    <label className="d-flex align-items-center gap-2 flex-grow-1 mb-0">
                      <input type="checkbox" className="form-check-input mt-0" checked={activo} onChange={() => alternarEquipo(q.id)} />
                      <i className={`bi ${q.icono}`} aria-hidden="true"></i> {q.nombre}
                    </label>
                    {activo && (
                      <input
                        type="number"
                        min="1"
                        aria-label={`Cantidad de ${q.nombre}`}
                        className="form-control form-control-sm equipment-qty"
                        value={datos.equipamiento[q.id]}
                        onChange={(e) => setDatos((d) => ({ ...d, equipamiento: { ...d.equipamiento, [q.id]: e.target.value } }))}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {errores.equipamiento && <div className="invalid-feedback d-block">{errores.equipamiento}</div>}
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {espacio ? "Guardar cambios" : "Crear espacio"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
