// Gráficos simples hechos con HTML y CSS (sin librerías).
// Un solo color (azul primario) porque muestran magnitudes de una misma serie;
// cada barra tiene su valor escrito y una tabla equivalente para accesibilidad.

export function Indicador({ icono, titulo, valor, detalle, tono = "azul" }) {
  return (
    <div className="kpi-card">
      <span className={`kpi-icon tone-${tono}`}>
        <i className={`bi ${icono}`} aria-hidden="true"></i>
      </span>
      <div className="min-w-0">
        <div className="kpi-title">{titulo}</div>
        <div className="kpi-value">{valor}</div>
        {detalle && <div className="kpi-detail">{detalle}</div>}
      </div>
    </div>
  );
}

function TablaDatos({ filas, columnas }) {
  return (
    <details className="chart-table">
      <summary>Ver como tabla</summary>
      {/* En celular cada fila se muestra como ficha (ver .tabla-apilable en responsive.css) */}
      <table className="table table-sm mb-0 tabla-apilable">
        <thead>
          <tr>{columnas.map((c) => <th key={c.titulo}>{c.titulo}</th>)}</tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i}>
              {columnas.map((c) => (
                <td key={c.titulo} data-label={c.titulo}>{c.valor(f)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

// Barras horizontales: una fila por elemento, con etiqueta a la izquierda y valor a la derecha
export function BarrasHorizontales({ filas, etiqueta, valor, formato = (v) => v, maximo, columnasTabla }) {
  const tope = maximo ?? Math.max(1, ...filas.map(valor));
  return (
    <>
      <ul className="hbar-list">
        {filas.map((f, i) => {
          const v = valor(f);
          return (
            <li key={i} className="hbar-row" title={`${etiqueta(f)}: ${formato(v)}`}>
              <span className="hbar-label">{etiqueta(f)}</span>
              <span className="hbar-track">
                <span className="hbar-fill" style={{ width: `${Math.max(v > 0 ? 2 : 0, (v / tope) * 100)}%` }}></span>
              </span>
              <span className="hbar-value">{formato(v)}</span>
            </li>
          );
        })}
      </ul>
      {columnasTabla && <TablaDatos filas={filas} columnas={columnasTabla} />}
    </>
  );
}

// Columnas verticales (por ejemplo, reservas por hora del día)
export function Columnas({ filas, etiqueta, valor, descripcion, columnasTabla }) {
  const tope = Math.max(1, ...filas.map(valor));
  const pico = filas.reduce((max, f) => (valor(f) > valor(max) ? f : max), filas[0]);
  return (
    <>
      <div className="vbar-chart" role="img" aria-label={descripcion}>
        <div className="vbar-grid" aria-hidden="true">
          <span>{tope}</span>
          <span>{Math.round(tope / 2)}</span>
          <span>0</span>
        </div>
        <div className="vbar-plot">
          {filas.map((f, i) => {
            const v = valor(f);
            return (
              <div key={i} className="vbar-col" tabIndex={0} aria-label={`${etiqueta(f)}: ${v}`}>
                <span className="vbar-tip" role="tooltip">{etiqueta(f)} · {v}</span>
                <span className="vbar-fill" style={{ height: `${(v / tope) * 100}%` }}>
                  {f === pico && v > 0 && <span className="vbar-peak">{v}</span>}
                </span>
                <span className={`vbar-label ${i % 2 ? "vbar-label-impar" : ""}`}>{etiqueta(f)}</span>
              </div>
            );
          })}
        </div>
      </div>
      {columnasTabla && <TablaDatos filas={filas} columnas={columnasTabla} />}
    </>
  );
}
