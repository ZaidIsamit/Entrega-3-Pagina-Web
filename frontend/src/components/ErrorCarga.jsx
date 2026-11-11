export default function ErrorCarga({ error, onReintentar, titulo = "No pudimos cargar la información" }) {
  return (
    <div className="error-state" role="alert">
      <div className="empty-icon error-icon">
        <i className={`bi ${error?.codigo === "SIN_CONEXION" ? "bi-wifi-off" : "bi-exclamation-triangle"}`} aria-hidden="true"></i>
      </div>
      <h3 className="h6 mb-1">{titulo}</h3>
      <p className="text-muted small mb-3">{error?.message}</p>
      {onReintentar && (
        <button type="button" className="btn btn-outline-primary btn-sm" onClick={onReintentar}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Reintentar
        </button>
      )}
    </div>
  );
}
