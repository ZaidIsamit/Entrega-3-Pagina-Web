import { ESTADOS_ESPACIO, ESTADOS_RESERVA } from "../utils/formato.js";

// Etiqueta de estado de una reserva o de un espacio (siempre con texto e ícono, no solo color)
export default function BadgeEstado({ estado, tipo = "reserva" }) {
  const config = (tipo === "espacio" ? ESTADOS_ESPACIO : ESTADOS_RESERVA)[estado];
  if (!config) return null;
  return (
    <span className={`status-badge status-${estado}`}>
      <i className={`bi ${config.icono}`} aria-hidden="true"></i> {config.texto}
    </span>
  );
}
