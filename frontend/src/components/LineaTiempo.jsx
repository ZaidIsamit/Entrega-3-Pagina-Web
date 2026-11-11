import { describirEvento, formatearFechaHora, plural } from "../utils/formato.js";
import { etiquetaHora } from "../utils/fechas.js";

// Texto adicional según el tipo de evento (el "detalle" de cada documento es distinto)
function resumenDetalle(evento) {
  const d = evento.detalle ?? {};
  switch (evento.tipo) {
    case "RESERVA_SOLICITADA":
      return `${plural(d.personas, "persona")} · "${d.motivo}"`;
    case "RESERVA_APROBADA":
      return d.automatica ? d.razon : null;
    case "RESERVA_RECHAZADA":
      return d.motivo ? `Motivo: ${d.motivo}` : null;
    case "RESERVA_CANCELADA":
      return [d.canceladaPorAdministracion && "Cancelada por la administración", d.motivo && `Motivo: ${d.motivo}`]
        .filter(Boolean)
        .join(" · ") || null;
    case "RESERVA_CONFLICTO":
      return `${d.espacio?.nombre} · ${d.fecha} ${etiquetaHora(d.horaInicio)}–${etiquetaHora(d.horaFin)}`;
    case "ESPACIO_ACTUALIZADO":
    case "ESPACIO_ESTADO_CAMBIADO":
    case "EDIFICIO_ACTUALIZADO":
    case "EQUIPAMIENTO_ACTUALIZADO":
      return d.cambios && Object.keys(d.cambios).length
        ? Object.entries(d.cambios)
            .map(([campo, c]) => `${campo}: ${formatearValor(c.antes)} → ${formatearValor(c.despues)}`)
            .join(" · ")
        : "Sin cambios en los datos";
    case "SESION_FALLIDA":
      return evento.entidad.etiqueta;
    default:
      return null;
  }
}

function formatearValor(valor) {
  if (Array.isArray(valor)) return valor.length ? valor.join(", ") : "ninguno";
  if (valor === null || valor === undefined || valor === "") return "—";
  return String(valor);
}

export default function LineaTiempo({ eventos, mostrarEntidad = false }) {
  return (
    <ol className="timeline">
      {eventos.map((evento) => {
        const config = describirEvento(evento.tipo);
        const detalle = resumenDetalle(evento);
        return (
          <li key={evento.id} className={`timeline-item tono-${config.tono}`}>
            <span className="timeline-icon">
              <i className={`bi ${config.icono}`} aria-hidden="true"></i>
            </span>
            <div className="timeline-body">
              <div className="timeline-title">
                {config.texto}
                {mostrarEntidad && evento.entidad?.etiqueta && evento.tipo !== "SESION_FALLIDA" && (
                  <span className="timeline-entity"> · {evento.entidad.etiqueta}</span>
                )}
              </div>
              {detalle && <div className="timeline-detail">{detalle}</div>}
              <div className="timeline-meta">
                <time dateTime={evento.fecha}>{formatearFechaHora(evento.fecha)}</time>
                {evento.actor && <> · {evento.actor.nombre} ({evento.actor.rol})</>}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
