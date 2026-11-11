import IconoClima from "./IconoClima.jsx";
import { HORAS, etiquetaHora } from "../utils/fechas.js";

const TEXTO_ESTADO = { libre: "Libre", ocupado: "Ocupado", pendiente: "En revisión", mio: "Tuya", pasado: "—" };

export default function SelectorHorario({ estados, climaPorHora, seleccion, deshabilitado, onSeleccionarHora }) {
  function estaSeleccionada(hora) {
    return seleccion && hora >= seleccion.hora && hora < seleccion.hora + seleccion.duracion;
  }

  return (
    <div className="slot-grid" role="group" aria-label="Bloques horarios">
      {HORAS.map((hora) => {
        const estado = estados[hora];
        const clima = climaPorHora?.[hora];
        return (
          <button
            key={hora}
            type="button"
            className={`slot slot-${estado} ${estaSeleccionada(hora) ? "is-selected" : ""}`}
            disabled={deshabilitado || estado !== "libre"}
            aria-pressed={estaSeleccionada(hora)}
            onClick={() => onSeleccionarHora(hora)}
          >
            <span className="slot-hour">{etiquetaHora(hora)}</span>
            <span className="slot-state">{TEXTO_ESTADO[estado]}</span>
            {clima && estado !== "pasado" && (
              <span className="slot-weather">
                <IconoClima codigo={clima.codigo} /> {clima.temperatura}°
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
