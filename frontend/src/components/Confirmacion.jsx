import { useState } from "react";
import Modal from "./Modal.jsx";

// Diálogo para confirmar acciones importantes (cancelar, rechazar, eliminar).
// Si se pide motivo, se valida antes de confirmar.
export default function Confirmacion({
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  variante = "danger",
  pedirMotivo = false,
  motivoObligatorio = false,
  etiquetaMotivo = "Motivo",
  onConfirmar,
  onCerrar
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function confirmar(e) {
    e.preventDefault();
    const texto = motivo.trim();
    if (motivoObligatorio && texto.length < 5) {
      setError("Escribe un motivo de al menos 5 caracteres.");
      return;
    }
    setEnviando(true);
    try {
      await onConfirmar(texto || null);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={enviando ? () => {} : onCerrar}>
      <form onSubmit={confirmar} noValidate>
        <div className="mb-3">{mensaje}</div>
        {pedirMotivo && (
          <div className="mb-3">
            <label htmlFor="confirmacion-motivo" className="form-label">
              {etiquetaMotivo} {motivoObligatorio ? "" : "(opcional)"}
            </label>
            <textarea
              id="confirmacion-motivo"
              rows="2"
              maxLength={200}
              className={`form-control ${error ? "is-invalid" : ""}`}
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError("");
              }}
              autoFocus
            ></textarea>
          </div>
        )}
        {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
        <div className="d-flex justify-content-end gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={onCerrar} disabled={enviando}>
            Volver
          </button>
          <button type="submit" className={`btn btn-${variante}`} disabled={enviando}>
            {enviando && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
            {textoConfirmar}
          </button>
        </div>
      </form>
    </Modal>
  );
}
