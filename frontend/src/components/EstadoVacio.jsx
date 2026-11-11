export default function EstadoVacio({ icono, titulo, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <i className={`bi ${icono}`} aria-hidden="true"></i>
      </div>
      <h3 className="h6 mb-1">{titulo}</h3>
      <div className="text-muted small">{children}</div>
    </div>
  );
}
