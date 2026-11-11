import { useState } from "react";
import Modal from "../Modal.jsx";

export default function FormularioEdificio({ edificio, sedes, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState({
    sedeId: edificio?.sede.id ?? sedes[0]?.id ?? "",
    nombre: edificio?.nombre ?? "",
    direccion: edificio?.direccion ?? "",
    pisos: String(edificio?.pisos ?? 1)
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cambiar(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  async function alEnviar(ev) {
    ev.preventDefault();
    const nuevos = {};
    if (!datos.sedeId) nuevos.sedeId = "Selecciona una sede.";
    if (datos.nombre.trim().length < 3) nuevos.nombre = "Mínimo 3 caracteres.";
    const pisos = Number(datos.pisos);
    if (!Number.isInteger(pisos) || pisos < 1 || pisos > 50) nuevos.pisos = "Entre 1 y 50.";
    setErrores(nuevos);
    setErrorGeneral("");
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      await onGuardar({ sedeId: datos.sedeId, nombre: datos.nombre.trim(), direccion: datos.direccion.trim() || null, pisos });
    } catch (error) {
      setErrores(error.erroresPorCampo?.() ?? {});
      setErrorGeneral(error.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={edificio ? `Editar ${edificio.nombre}` : "Nuevo edificio"} onCerrar={enviando ? () => {} : onCerrar}>
      <form onSubmit={alEnviar} noValidate>
        {errorGeneral && <div className="alert alert-danger py-2" role="alert">{errorGeneral}</div>}
        <div className="row g-3">
          <div className="col-12">
            <label htmlFor="edi-sede" className="form-label">Sede</label>
            <select id="edi-sede" className={`form-select ${errores.sedeId ? "is-invalid" : ""}`} value={datos.sedeId} onChange={(e) => cambiar("sedeId", e.target.value)}>
              {sedes.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
            <div className="invalid-feedback">{errores.sedeId}</div>
          </div>
          <div className="col-8">
            <label htmlFor="edi-nombre" className="form-label">Nombre</label>
            <input id="edi-nombre" className={`form-control ${errores.nombre ? "is-invalid" : ""}`} value={datos.nombre} onChange={(e) => cambiar("nombre", e.target.value)} />
            <div className="invalid-feedback">{errores.nombre}</div>
          </div>
          <div className="col-4">
            <label htmlFor="edi-pisos" className="form-label">Pisos</label>
            <input id="edi-pisos" type="number" min="1" max="50" className={`form-control ${errores.pisos ? "is-invalid" : ""}`} value={datos.pisos} onChange={(e) => cambiar("pisos", e.target.value)} />
            <div className="invalid-feedback">{errores.pisos}</div>
          </div>
          <div className="col-12">
            <label htmlFor="edi-direccion" className="form-label">Dirección (opcional)</label>
            <input id="edi-direccion" className="form-control" maxLength={150} value={datos.direccion} onChange={(e) => cambiar("direccion", e.target.value)} />
          </div>
        </div>
        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {edificio ? "Guardar cambios" : "Crear edificio"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
