import { HORAS, etiquetaHora } from "../utils/fechas.js";

const TEXTO_ESTADO = {
  libre: "Libre",
  ocupado: "Ocupado",
  pendiente: "Solicitud en revisión",
  mio: "Tu reserva",
  pasado: "Hora pasada"
};

export default function BarraOcupacion({ estados }) {
  return (
    <div className="occupancy">
      <div className="occupancy-bar" role="img" aria-label="Ocupación del día">
        {HORAS.map((hora) => (
          <span
            key={hora}
            className={`occupancy-seg seg-${estados[hora]}`}
            title={`${etiquetaHora(hora)} · ${TEXTO_ESTADO[estados[hora]]}`}
          ></span>
        ))}
      </div>
      <div className="occupancy-scale" aria-hidden="true">
        {HORAS.map((hora) => (
          <span key={hora}>{(hora - HORAS[0]) % 3 === 0 ? String(hora).padStart(2, "0") : ""}</span>
        ))}
      </div>
    </div>
  );
}
