import { useState } from "react";
import Modal from "../Modal.jsx";

const ICONOS_SUGERIDOS = ["bi-box", "bi-projector", "bi-wifi", "bi-tv", "bi-mic", "bi-pc-display", "bi-easel", "bi-plug", "bi-speaker", "bi-camera-video", "bi-lightbulb", "bi-table"];

export default function FormularioEquipamiento({ item, onGuardar, onCerrar }) {
  const [nombre, setNombre] = useState(item?.nombre ?? "");
  const [icono, setIcono] = useState(item?.icono ?? "bi-box");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function alEnviar(ev) {
    ev.preventDefault();
    if (nombre.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await onGuardar({ nombre: nombre.trim(), icono });
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={item ? `Editar ${item.nombre}` : "Nuevo equipamiento"} onCerrar={enviando ? () => {} : onCerrar}>
      <form onSubmit={alEnviar} noValidate>
        <label htmlFor="equ-nombre" className="form-label">Nombre</label>
        <input
          id="equ-nombre"
          className={`form-control ${error ? "is-invalid" : ""}`}
          maxLength={50}
          value={nombre}
          onChange={(e) => {
            setNombre(e.target.value);
            setError("");
          }}
          autoFocus
        />
        <div className="invalid-feedback">{error}</div>

        <span className="form-label d-block mt-3">Ícono</span>
        <div className="icon-picker" role="radiogroup" aria-label="Ícono">
          {ICONOS_SUGERIDOS.map((i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={icono === i}
              aria-label={i}
              className={`icon-option ${icono === i ? "active" : ""}`}
              onClick={() => setIcono(i)}
            >
              <i className={`bi ${i}`} aria-hidden="true"></i>
            </button>
          ))}
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4">
          <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={enviando}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={enviando}>
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
