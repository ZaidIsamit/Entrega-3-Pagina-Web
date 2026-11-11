import { useState } from "react";
import Modal from "./Modal.jsx";
import SelectorHorario from "./SelectorHorario.jsx";
import FormularioReserva from "./FormularioReserva.jsx";
import BadgeEstado from "./BadgeEstado.jsx";
import { fechaISO, formatearFechaLarga } from "../utils/fechas.js";
import { estadosDelDia, horasLibresConsecutivas } from "../utils/reservas.js";

export default function DetalleEspacio({
  espacio,
  fecha,
  onCambiarFecha,
  ocupacion,
  cargandoOcupacion,
  usuario,
  clima,
  personasSugeridas,
  onReservar,
  onCerrar
}) {
  const [seleccion, setSeleccion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  const reservable = espacio.estado === "disponible";
  const estados = estadosDelDia(ocupacion, espacio.id, fecha);
  const maxPorRol = usuario.rol.maxHorasReserva;
  const climaPorHora = clima.estado === "ok" ? clima.datos.porHora : null;

  const maxDuracion = seleccion
    ? Math.max(1, Math.min(maxPorRol, horasLibresConsecutivas(ocupacion, espacio.id, fecha, seleccion.hora)))
    : 1;

  function seleccionar(nueva) {
    setSeleccion(nueva);
    setErrorServidor(null);
  }

  function alCambiarFecha(nuevaFecha) {
    seleccionar(null);
    onCambiarFecha(nuevaFecha);
  }

  async function alConfirmar({ personas, motivo }) {
    setEnviando(true);
    setErrorServidor(null);
    try {
      await onReservar({
        espacioId: espacio.id,
        fecha,
        horaInicio: seleccion.hora,
        duracion: seleccion.duracion,
        personas,
        motivo
      });
    } catch (error) {
      setErrorServidor(error);
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo={espacio.nombre}
      subtitulo={`${espacio.tipo.nombre} · ${espacio.edificio.nombre}${espacio.piso > 0 ? `, piso ${espacio.piso}` : ""} · Capacidad ${espacio.capacidad}`}
      onCerrar={enviando ? () => {} : onCerrar}
      tamano="modal-lg"
    >
      {espacio.descripcion && <p className="text-muted small mb-3">{espacio.descripcion}</p>}

      {!reservable && (
        <div className="alert alert-warning d-flex align-items-center gap-2" role="status">
          <BadgeEstado estado={espacio.estado} tipo="espacio" />
          <span>Este espacio no se puede reservar por ahora.</span>
        </div>
      )}

      <div className="detail-toolbar">
        <div>
          <label htmlFor="detalle-fecha" className="form-label mb-1">Fecha</label>
          <input
            id="detalle-fecha"
            type="date"
            className="form-control"
            min={fechaISO()}
            value={fecha}
            onChange={(e) => e.target.value && alCambiarFecha(e.target.value)}
            disabled={enviando}
          />
        </div>
        <div className="legend">
          <span><i className="legend-dot dot-libre"></i>Libre</span>
          <span><i className="legend-dot dot-ocupado"></i>Ocupado</span>
          <span><i className="legend-dot dot-pendiente"></i>En revisión</span>
          <span><i className="legend-dot dot-mio"></i>Tuya</span>
          <span><i className="legend-dot dot-pasado"></i>Pasada</span>
        </div>
      </div>

      <p className="detail-hint">
        <i className="bi bi-hand-index me-1" aria-hidden="true"></i>
        {formatearFechaLarga(fecha)} · Elige un bloque libre para comenzar tu reserva.
        {(cargandoOcupacion || clima.estado === "cargando") && (
          <span className="ms-1 text-muted">
            <span className="spinner-border spinner-border-sm ms-1" aria-hidden="true"></span> actualizando…
          </span>
        )}
      </p>

      <SelectorHorario
        estados={estados}
        climaPorHora={climaPorHora}
        seleccion={seleccion}
        deshabilitado={!reservable || enviando || cargandoOcupacion}
        onSeleccionarHora={(hora) => seleccionar({ hora, duracion: 1 })}
      />

      {seleccion && (
        <FormularioReserva
          key={`${seleccion.hora}-${fecha}`}
          espacio={espacio}
          hora={seleccion.hora}
          duracion={seleccion.duracion}
          maxDuracion={maxDuracion}
          rol={usuario.rol}
          onCambiarDuracion={(duracion) => setSeleccion({ ...seleccion, duracion })}
          climaPorHora={climaPorHora}
          personasSugeridas={personasSugeridas}
          enviando={enviando}
          errorServidor={errorServidor}
          onConfirmar={alConfirmar}
          onCancelar={() => seleccionar(null)}
        />
      )}
    </Modal>
  );
}
