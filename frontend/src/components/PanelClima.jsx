import IconoClima from "./IconoClima.jsx";
import { describirClima, UMBRAL_LLUVIA } from "../utils/clima.js";
import { formatearFechaLarga } from "../utils/fechas.js";

export default function PanelClima({ clima, sede, fecha }) {
  return (
    <section className="weather-panel" aria-label="Pronóstico del clima">
      <div className="weather-head">
        <span className="eyebrow">
          <i className="bi bi-geo-alt" aria-hidden="true"></i> {sede.nombre}
        </span>
        <span className="weather-date">{formatearFechaLarga(fecha)}</span>
      </div>

      {clima.estado === "cargando" && (
        <div className="weather-body" aria-busy="true">
          <div className="skeleton skeleton-icon"></div>
          <div className="flex-grow-1">
            <div className="skeleton skeleton-line w-50"></div>
            <div className="skeleton skeleton-line w-75"></div>
          </div>
        </div>
      )}

      {clima.estado === "error" && (
        <div className="weather-body weather-message">
          <i className="bi bi-wifi-off fs-3" aria-hidden="true"></i>
          <div>
            <div className="fw-semibold">No pudimos obtener el clima</div>
            <div className="small opacity-75">Puedes reservar igual; el pronóstico es solo informativo.</div>
            <button type="button" className="btn btn-sm btn-light mt-2" onClick={clima.reintentar}>
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Reintentar
            </button>
          </div>
        </div>
      )}

      {clima.estado === "fuera-de-rango" && (
        <div className="weather-body weather-message">
          <i className="bi bi-calendar-x fs-3" aria-hidden="true"></i>
          <div>
            <div className="fw-semibold">Pronóstico aún no disponible</div>
            <div className="small opacity-75">Open-Meteo entrega el clima hasta 16 días hacia adelante.</div>
          </div>
        </div>
      )}

      {clima.estado === "ok" && (
        <div className="weather-body">
          <IconoClima codigo={clima.datos.resumen.codigo} className="weather-big-icon" />
          <div>
            <div className="weather-temp">
              {clima.datos.resumen.maxima}°<span className="weather-min"> / {clima.datos.resumen.minima}°</span>
            </div>
            <div className="small">{describirClima(clima.datos.resumen.codigo).texto}</div>
            <div className={`weather-rain ${clima.datos.resumen.probLluviaMax >= UMBRAL_LLUVIA ? "is-risk" : ""}`}>
              <i className="bi bi-droplet-half" aria-hidden="true"></i> Hasta {clima.datos.resumen.probLluviaMax}% prob. de lluvia
            </div>
          </div>
        </div>
      )}

      <div className="weather-credit">
        Datos: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo.com</a> (CC BY 4.0)
      </div>
    </section>
  );
}
