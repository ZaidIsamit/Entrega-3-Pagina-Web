import { useState } from "react";
import { Link } from "react-router-dom";
import Cargando from "../components/Cargando.jsx";
import Confirmacion from "../components/Confirmacion.jsx";
import ErrorCarga from "../components/ErrorCarga.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import HistorialReserva from "../components/HistorialReserva.jsx";
import TarjetaReserva from "../components/TarjetaReserva.jsx";
import { useNotificar } from "../context/NotificacionesContext.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { cancelarReserva, misReservas } from "../services/reservasApi.js";
import { esHoraPasada, rangoHorario } from "../utils/fechas.js";

const PESTANAS = [
  { id: "proximas", texto: "Próximas", icono: "bi-calendar-event" },
  { id: "historial", texto: "Historial", icono: "bi-archive" }
];

const FILTROS_ESTADO = ["", "pendiente", "aprobada", "rechazada", "cancelada"];

export default function MisReservasPage() {
  const notificar = useNotificar();
  const [alcance, setAlcance] = useState("proximas");
  const [estado, setEstado] = useState("");
  const [aCancelar, setACancelar] = useState(null);
  const [verHistorial, setVerHistorial] = useState(null);

  const reservas = useConsulta(() => misReservas(alcance), [alcance]);
  const lista = (reservas.datos ?? []).filter((r) => !estado || r.estado === estado);

  async function confirmarCancelacion(motivo) {
    const actualizada = await cancelarReserva(aCancelar.id, motivo);
    setACancelar(null);
    reservas.recargar();
    notificar(
      "exito",
      "Reserva cancelada",
      `${actualizada.espacio.nombre} · ${rangoHorario(actualizada.horaInicio, actualizada.duracion)}. El bloque quedó libre.`
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Reservas personales</span>
          <h1 className="page-title">Mis reservas</h1>
          <p className="page-lead">Revisa el estado de tus solicitudes, cancela las que ya no necesites y consulta su historial.</p>
        </div>
        <Link to="/espacios" className="btn btn-primary">
          <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>Nueva reserva
        </Link>
      </div>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Período">
          {PESTANAS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={alcance === p.id}
              className={`segmented-btn ${alcance === p.id ? "active" : ""}`}
              onClick={() => setAlcance(p.id)}
            >
              <i className={`bi ${p.icono}`} aria-hidden="true"></i> {p.texto}
            </button>
          ))}
        </div>
        <div className="toolbar-filter">
          <label htmlFor="mis-estado" className="form-label mb-0">Estado</label>
          <select id="mis-estado" className="form-select form-select-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {FILTROS_ESTADO.map((e) => (
              <option key={e} value={e}>{e ? e.charAt(0).toUpperCase() + e.slice(1) : "Todos"}</option>
            ))}
          </select>
        </div>
      </div>

      {reservas.estado === "cargando" && <Cargando texto="Cargando tus reservas…" />}
      {reservas.estado === "error" && <ErrorCarga error={reservas.error} onReintentar={reservas.recargar} />}

      {reservas.estado === "ok" && lista.length === 0 && (
        <EstadoVacio icono="bi-calendar-x" titulo={alcance === "proximas" ? "No tienes reservas próximas" : "Aún no tienes historial"}>
          {alcance === "proximas" ? (
            <>
              Busca un espacio en <Link to="/espacios">el catálogo</Link> y reserva tu primer bloque.
            </>
          ) : (
            "Aquí aparecerán tus reservas pasadas."
          )}
        </EstadoVacio>
      )}

      {reservas.estado === "ok" && lista.length > 0 && (
        <div className="booking-list">
          {lista.map((reserva) => {
            const cancelable =
              ["pendiente", "aprobada"].includes(reserva.estado) && !esHoraPasada(reserva.fecha, reserva.horaInicio);
            return (
              <TarjetaReserva key={reserva.id} reserva={reserva}>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setVerHistorial(reserva)}>
                  <i className="bi bi-clock-history me-1" aria-hidden="true"></i>Historial
                </button>
                {cancelable && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setACancelar(reserva)}>
                    <i className="bi bi-x-lg me-1" aria-hidden="true"></i>Cancelar
                  </button>
                )}
              </TarjetaReserva>
            );
          })}
        </div>
      )}

      {aCancelar && (
        <Confirmacion
          titulo="Cancelar reserva"
          mensaje={
            <>
              ¿Seguro que quieres cancelar <strong>{aCancelar.espacio.nombre}</strong> el {aCancelar.fecha},{" "}
              {rangoHorario(aCancelar.horaInicio, aCancelar.duracion)}? El bloque quedará libre para otras personas.
            </>
          }
          textoConfirmar="Sí, cancelar"
          pedirMotivo
          onConfirmar={confirmarCancelacion}
          onCerrar={() => setACancelar(null)}
        />
      )}

      {verHistorial && <HistorialReserva reserva={verHistorial} onCerrar={() => setVerHistorial(null)} />}
    </>
  );
}
