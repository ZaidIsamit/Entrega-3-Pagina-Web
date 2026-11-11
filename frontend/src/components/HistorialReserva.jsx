import Modal from "./Modal.jsx";
import Cargando from "./Cargando.jsx";
import ErrorCarga from "./ErrorCarga.jsx";
import EstadoVacio from "./EstadoVacio.jsx";
import LineaTiempo from "./LineaTiempo.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { historialReserva } from "../services/reservasApi.js";

// Línea de tiempo de una reserva. Los eventos vienen de MongoDB (colección "eventos").
export default function HistorialReserva({ reserva, onCerrar }) {
  const historial = useConsulta(() => historialReserva(reserva.id), [reserva.id]);

  return (
    <Modal titulo="Historial de la reserva" subtitulo={`#${reserva.id} · ${reserva.espacio.nombre}`} onCerrar={onCerrar}>
      {historial.estado === "cargando" && <Cargando filas={2} />}
      {historial.estado === "error" && <ErrorCarga error={historial.error} onReintentar={historial.recargar} />}
      {historial.estado === "ok" && historial.datos.length === 0 && (
        <EstadoVacio icono="bi-clock-history" titulo="Sin eventos registrados">
          Esta reserva se cargó con los datos de prueba, antes de que existiera el registro de actividad.
        </EstadoVacio>
      )}
      {historial.estado === "ok" && historial.datos.length > 0 && <LineaTiempo eventos={historial.datos} />}
    </Modal>
  );
}
