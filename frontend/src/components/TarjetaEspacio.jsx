import BarraOcupacion from "./BarraOcupacion.jsx";
import BadgeEstado from "./BadgeEstado.jsx";

export default function TarjetaEspacio({ espacio, estados, riesgoLluvia, onVerHorarios }) {
  const libres = Object.values(estados).filter((e) => e === "libre").length;
  const noReservable = espacio.estado !== "disponible";

  let disponibilidad = `${libres} ${libres === 1 ? "bloque libre" : "bloques libres"}`;
  if (noReservable) disponibilidad = "No reservable";
  else if (libres === 0) disponibilidad = "Sin bloques libres";

  return (
    <article className={`space-card tone-band-${espacio.tipo.color} ${noReservable ? "is-disabled" : ""}`}>
      <div className="space-card-top">
        <span className={`space-type tone-text-${espacio.tipo.color}`}>
          <i className={`bi ${espacio.tipo.icono}`} aria-hidden="true"></i> {espacio.tipo.nombre}
        </span>
        <span className="capacity-pill" title="Capacidad máxima">
          <i className="bi bi-person-fill" aria-hidden="true"></i> {espacio.capacidad}
          <span className="visually-hidden"> personas</span>
        </span>
      </div>

      <div className="min-w-0">
        <h3 className="space-title">{espacio.nombre}</h3>
        <div className="space-meta">
          <span className="space-code">{espacio.codigo}</span>
          <span>
            {espacio.edificio.nombre}
            {espacio.piso > 0 && `, piso ${espacio.piso}`}
          </span>
        </div>
      </div>

      <div className="feature-list">
        {noReservable && <BadgeEstado estado={espacio.estado} tipo="espacio" />}
        {espacio.exterior && (
          <span className={`feature-chip chip-outdoor ${riesgoLluvia ? "is-risk" : ""}`}>
            <i className={`bi ${riesgoLluvia ? "bi-cloud-rain" : "bi-sun"}`} aria-hidden="true"></i>
            {riesgoLluvia ? "Exterior · riesgo de lluvia" : "Al aire libre"}
          </span>
        )}
        {espacio.equipamiento.map((item) => (
          <span key={item.id} className="feature-chip">
            <i className={`bi ${item.icono} me-1`} aria-hidden="true"></i>
            {item.nombre}
            {item.cantidad > 1 && <span className="opacity-75"> ×{item.cantidad}</span>}
          </span>
        ))}
      </div>

      <BarraOcupacion estados={estados} />

      <div className="space-card-footer">
        <span className={`availability ${libres === 0 || noReservable ? "is-full" : ""}`}>{disponibilidad}</span>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onVerHorarios(espacio)}>
          Ver horarios
        </button>
      </div>
    </article>
  );
}
