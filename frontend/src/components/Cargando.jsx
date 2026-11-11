export default function Cargando({ texto = "Cargando…", filas = 3 }) {
  return (
    <div className="loading-block" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">{texto}</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="loading-row">
          <div className="skeleton-chip skeleton"></div>
          <div className="flex-grow-1">
            <div className="skeleton skeleton-line skeleton-dark w-50"></div>
            <div className="skeleton skeleton-line skeleton-dark w-75"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
