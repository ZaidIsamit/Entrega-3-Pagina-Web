import { useState } from "react";
import Cargando from "../components/Cargando.jsx";
import Confirmacion from "../components/Confirmacion.jsx";
import ErrorCarga from "../components/ErrorCarga.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import HistorialReserva from "../components/HistorialReserva.jsx";
import TarjetaReserva from "../components/TarjetaReserva.jsx";
import { useNotificar } from "../context/NotificacionesContext.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { listarSedes } from "../services/infraestructuraApi.js";
import { aprobarReserva, cancelarReserva, listarReservas, rechazarReserva } from "../services/reservasApi.js";
import { esHoraPasada, fechaISO, rangoHorario } from "../utils/fechas.js";
import { ESTADOS_RESERVA } from "../utils/formato.js";

// Bandeja de la administración: revisar solicitudes pendientes y gestionar todas las reservas.
export default function SolicitudesPage() {
  const notificar = useNotificar();
  const [filtros, setFiltros] = useState({ estado: "pendiente", sedeId: "", desde: fechaISO(), hasta: "" });
  const [procesando, setProcesando] = useState(null);
  const [dialogo, setDialogo] = useState(null); // { tipo: "rechazar" | "cancelar", reserva }
  const [verHistorial, setVerHistorial] = useState(null);

  const sedes = useConsulta(() => listarSedes(), []);
  const reservas = useConsulta(() => listarReservas(filtros), [filtros.estado, filtros.sedeId, filtros.desde, filtros.hasta]);

  function cambiar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }));
  }

  async function aprobar(reserva) {
    setProcesando(reserva.id);
    try {
      await aprobarReserva(reserva.id);
      notificar("exito", "Solicitud aprobada", `${reserva.solicitante.nombre} · ${reserva.espacio.nombre}`);
      reservas.recargar();
    } catch (error) {
      notificar("error", "No se pudo aprobar", error.message);
    } finally {
      setProcesando(null);
    }
  }

  async function confirmarDialogo(motivo) {
    const { tipo, reserva } = dialogo;
    if (tipo === "rechazar") await rechazarReserva(reserva.id, motivo);
    else await cancelarReserva(reserva.id, motivo);
    setDialogo(null);
    reservas.recargar();
    notificar(
      "exito",
      tipo === "rechazar" ? "Solicitud rechazada" : "Reserva cancelada",
      `${reserva.solicitante.nombre} · ${reserva.espacio.nombre}`
    );
  }

  const lista = reservas.datos ?? [];

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Administración</span>
          <h1 className="page-title">Solicitudes de reserva</h1>
          <p className="page-lead">
            Aprueba o rechaza las solicitudes de estudiantes y organizaciones. Las de docentes se aprueban solas.
          </p>
        </div>
      </div>

      <section className="filters-card mb-4" aria-label="Filtros">
        <div className="row g-3">
          <div className="col-6 col-md-3">
            <label htmlFor="sol-estado" className="form-label">Estado</label>
            <select id="sol-estado" className="form-select" value={filtros.estado} onChange={(e) => cambiar("estado", e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(ESTADOS_RESERVA).map(([valor, c]) => (
                <option key={valor} value={valor}>{c.texto}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="sol-sede" className="form-label">Sede</label>
            <select id="sol-sede" className="form-select" value={filtros.sedeId} onChange={(e) => cambiar("sedeId", e.target.value)}>
              <option value="">Todas</option>
              {(sedes.datos ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <label htmlFor="sol-desde" className="form-label">Desde</label>
            <input id="sol-desde" type="date" className="form-control" value={filtros.desde} onChange={(e) => cambiar("desde", e.target.value)} />
          </div>
          <div className="col-12 col-sm-6 col-md-3">
            <label htmlFor="sol-hasta" className="form-label">Hasta</label>
            <input id="sol-hasta" type="date" className="form-control" value={filtros.hasta} onChange={(e) => cambiar("hasta", e.target.value)} />
          </div>
        </div>
      </section>

      <div className="results-head">
        <h2 className="h5 mb-0">Resultados</h2>
        {reservas.estado === "ok" && <span className="results-count">{lista.length}</span>}
      </div>

      {reservas.estado === "cargando" && <Cargando />}
      {reservas.estado === "error" && <ErrorCarga error={reservas.error} onReintentar={reservas.recargar} />}
      {reservas.estado === "ok" && lista.length === 0 && (
        <EstadoVacio icono="bi-inbox" titulo={filtros.estado === "pendiente" ? "No hay solicitudes pendientes" : "No hay reservas con esos filtros"}>
          {filtros.estado === "pendiente" ? "¡Todo al día!" : "Prueba cambiando las fechas o el estado."}
        </EstadoVacio>
      )}

      {reservas.estado === "ok" && lista.length > 0 && (
        <div className="booking-list">
          {lista.map((reserva) => {
            const futura = !esHoraPasada(reserva.fecha, reserva.horaInicio);
            const ocupado = procesando === reserva.id;
            return (
              <TarjetaReserva key={reserva.id} reserva={reserva} mostrarSolicitante>
                {reserva.estado === "pendiente" && futura && (
                  <button type="button" className="btn btn-sm btn-success" disabled={ocupado} onClick={() => aprobar(reserva)}>
                    {ocupado ? <span className="spinner-border spinner-border-sm me-1" aria-hidden="true"></span> : <i className="bi bi-check-lg me-1" aria-hidden="true"></i>}
                    Aprobar
                  </button>
                )}
                {reserva.estado === "pendiente" && (
                  <button type="button" className="btn btn-sm btn-outline-danger" disabled={ocupado} onClick={() => setDialogo({ tipo: "rechazar", reserva })}>
                    <i className="bi bi-x-lg me-1" aria-hidden="true"></i>Rechazar
                  </button>
                )}
                {reserva.estado === "aprobada" && futura && (
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDialogo({ tipo: "cancelar", reserva })}>
                    <i className="bi bi-slash-circle me-1" aria-hidden="true"></i>Cancelar
                  </button>
                )}
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setVerHistorial(reserva)}>
                  <i className="bi bi-clock-history me-1" aria-hidden="true"></i>Historial
                </button>
              </TarjetaReserva>
            );
          })}
        </div>
      )}

      {dialogo && (
        <Confirmacion
          titulo={dialogo.tipo === "rechazar" ? "Rechazar solicitud" : "Cancelar reserva"}
          mensaje={
            <>
              {dialogo.tipo === "rechazar" ? "Rechazarás" : "Cancelarás"} la reserva de{" "}
              <strong>{dialogo.reserva.solicitante.nombre}</strong> en {dialogo.reserva.espacio.nombre} el {dialogo.reserva.fecha},{" "}
              {rangoHorario(dialogo.reserva.horaInicio, dialogo.reserva.duracion)}.
            </>
          }
          textoConfirmar={dialogo.tipo === "rechazar" ? "Rechazar" : "Cancelar reserva"}
          pedirMotivo
          motivoObligatorio={dialogo.tipo === "rechazar"}
          etiquetaMotivo={dialogo.tipo === "rechazar" ? "Motivo del rechazo (lo verá el solicitante)" : "Motivo"}
          onConfirmar={confirmarDialogo}
          onCerrar={() => setDialogo(null)}
        />
      )}

      {verHistorial && <HistorialReserva reserva={verHistorial} onCerrar={() => setVerHistorial(null)} />}
    </>
  );
}
