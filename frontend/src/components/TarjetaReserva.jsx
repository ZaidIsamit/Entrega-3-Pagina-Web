import BadgeEstado from "./BadgeEstado.jsx";
import { formatearFechaCorta, formatearFechaHora } from "../utils/formato.js";
import { rangoHorario } from "../utils/fechas.js";

export default function TarjetaReserva({ reserva, mostrarSolicitante = false, children }) {
  const { espacio } = reserva;
  return (
    <article className={`booking-card booking-${reserva.estado}`}>
      <div className="booking-date" aria-hidden="true">
        <span className="booking-day">{reserva.fecha.slice(8, 10)}</span>
        <span className="booking-month">{formatearFechaCorta(reserva.fecha).split(" ").slice(-1)[0]}</span>
      </div>

      <div className="booking-body">
        <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
          <BadgeEstado estado={reserva.estado} />
          <span className="booking-id">#{reserva.id}</span>
        </div>
        <h3 className="booking-title">
          <i className={`bi ${espacio.tipo.icono} me-1 tone-text-${espacio.tipo.color}`} aria-hidden="true"></i>
          {espacio.nombre}
        </h3>
        <div className="booking-meta">
          <span><i className="bi bi-calendar3" aria-hidden="true"></i> {formatearFechaCorta(reserva.fecha)}</span>
          <span><i className="bi bi-clock" aria-hidden="true"></i> {rangoHorario(reserva.horaInicio, reserva.duracion)}</span>
          <span><i className="bi bi-geo-alt" aria-hidden="true"></i> {espacio.edificio} · {espacio.sede.nombre}</span>
          <span><i className="bi bi-people" aria-hidden="true"></i> {reserva.personas}/{espacio.capacidad}</span>
        </div>
        {mostrarSolicitante && (
          <div className="booking-requester">
            <i className="bi bi-person" aria-hidden="true"></i> {reserva.solicitante.nombre}
            <span className="text-muted"> · {reserva.solicitante.rol}</span>
          </div>
        )}
        <p className="booking-reason">“{reserva.motivo}”</p>
        {reserva.estado === "rechazada" && reserva.motivoRechazo && (
          <p className="booking-rejection">
            <i className="bi bi-chat-left-text me-1" aria-hidden="true"></i>
            <strong>Motivo del rechazo:</strong> {reserva.motivoRechazo}
          </p>
        )}
        <div className="booking-created">Solicitada el {formatearFechaHora(reserva.creadaEn)}</div>
      </div>

      {children && <div className="booking-actions">{children}</div>}
    </article>
  );
}
