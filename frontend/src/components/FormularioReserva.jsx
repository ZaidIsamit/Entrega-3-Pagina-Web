import { useEffect, useRef, useState } from "react";
import IconoClima from "./IconoClima.jsx";
import { hayRiesgoLluvia } from "../utils/clima.js";
import { rangoHorario } from "../utils/fechas.js";

const LARGO_MINIMO_MOTIVO = 5;
const LARGO_MAXIMO_MOTIVO = 200;

export default function FormularioReserva({
  espacio,
  hora,
  duracion,
  maxDuracion,
  rol,
  onCambiarDuracion,
  climaPorHora,
  personasSugeridas,
  enviando,
  errorServidor,
  onConfirmar,
  onCancelar
}) {
  const [personas, setPersonas] = useState(String(Math.min(personasSugeridas, espacio.capacidad)));
  const [motivo, setMotivo] = useState("");
  const [aceptaClima, setAceptaClima] = useState(false);
  const [errores, setErrores] = useState({});
  const refFormulario = useRef(null);

  useEffect(() => {
    refFormulario.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [hora]);

  // Errores de validación que devuelve la API (400) se muestran junto a cada campo
  useEffect(() => {
    if (errorServidor?.estado === 400) setErrores(errorServidor.erroresPorCampo());
  }, [errorServidor]);

  const horasDelRango = Array.from({ length: duracion }, (_, i) => hora + i);
  const climaDelRango = climaPorHora ? horasDelRango.map((h) => climaPorHora[h]).filter(Boolean) : [];
  const riesgoLluvia = espacio.exterior && climaDelRango.some(hayRiesgoLluvia);

  function validar() {
    const nuevos = {};
    const cantidad = Number(personas);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > espacio.capacidad) {
      nuevos.personas = `Ingresa un número entre 1 y ${espacio.capacidad} (capacidad del espacio).`;
    }
    const texto = motivo.trim();
    if (texto.length < LARGO_MINIMO_MOTIVO) {
      nuevos.motivo = `Describe el motivo (mínimo ${LARGO_MINIMO_MOTIVO} caracteres).`;
    }
    if (riesgoLluvia && !aceptaClima) {
      nuevos.clima = "Confirma que revisaste el pronóstico de lluvia.";
    }
    return nuevos;
  }

  function alEnviar(e) {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    onConfirmar({ personas: Number(personas), motivo: motivo.trim() });
  }

  const opcionesDuracion = Array.from({ length: maxDuracion }, (_, i) => i + 1);
  const errorGeneral = errorServidor && errorServidor.estado !== 400 ? errorServidor : null;

  return (
    <form ref={refFormulario} className="reserve-form" onSubmit={alEnviar} noValidate>
      <div className="reserve-form-head">
        <div>
          <span className="eyebrow">Tu solicitud</span>
          <div className="reserve-range">{rangoHorario(hora, duracion)}</div>
        </div>
        {climaDelRango.length > 0 && (
          <div className="reserve-weather">
            {climaDelRango.map((c, i) => (
              <span key={horasDelRango[i]} title={`${c.probLluvia}% prob. de lluvia`}>
                <IconoClima codigo={c.codigo} /> {c.temperatura}°
              </span>
            ))}
          </div>
        )}
      </div>

      {errorGeneral && (
        <div className="alert alert-danger d-flex gap-2 py-2" role="alert">
          <i className="bi bi-exclamation-octagon" aria-hidden="true"></i>
          <div>
            <strong>No se pudo reservar.</strong> {errorGeneral.message}
            {errorGeneral.estado === 409 && <div className="small">Actualizamos los horarios para que elijas otro bloque.</div>}
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-6">
          <label htmlFor="reserva-duracion" className="form-label">Duración</label>
          <select
            id="reserva-duracion"
            className={`form-select ${errores.duracion ? "is-invalid" : ""}`}
            value={duracion}
            onChange={(e) => onCambiarDuracion(Number(e.target.value))}
          >
            {opcionesDuracion.map((h) => (
              <option key={h} value={h}>{h} {h === 1 ? "hora" : "horas"}</option>
            ))}
          </select>
          <div className="invalid-feedback">{errores.duracion}</div>
          <div className="form-text">Máximo {rol.maxHorasReserva} h para tu rol.</div>
        </div>
        <div className="col-6">
          <label htmlFor="reserva-personas" className="form-label">Personas</label>
          <input
            id="reserva-personas"
            type="number"
            min="1"
            max={espacio.capacidad}
            className={`form-control ${errores.personas ? "is-invalid" : ""}`}
            value={personas}
            onChange={(e) => setPersonas(e.target.value)}
          />
          <div className="invalid-feedback">{errores.personas}</div>
        </div>
        <div className="col-12">
          <label htmlFor="reserva-motivo" className="form-label">Motivo de la reserva</label>
          <textarea
            id="reserva-motivo"
            rows="2"
            maxLength={LARGO_MAXIMO_MOTIVO}
            className={`form-control ${errores.motivo ? "is-invalid" : ""}`}
            placeholder="Ej: Reunión de proyecto, ayudantía, ensayo..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          ></textarea>
          <div className="d-flex justify-content-between">
            <div className="invalid-feedback d-block">{errores.motivo}</div>
            <div className="form-text ms-auto">{motivo.length}/{LARGO_MAXIMO_MOTIVO}</div>
          </div>
        </div>
      </div>

      {riesgoLluvia && (
        <div className="alert alert-rain mt-3 mb-0" role="alert">
          <div className="d-flex gap-2">
            <i className="bi bi-cloud-rain-heavy fs-5" aria-hidden="true"></i>
            <div>
              <strong>Se pronostica lluvia en este horario.</strong> {espacio.nombre} es un espacio al aire libre.
              <div className="form-check mt-2">
                <input
                  id="reserva-acepta-clima"
                  type="checkbox"
                  className={`form-check-input ${errores.clima ? "is-invalid" : ""}`}
                  checked={aceptaClima}
                  onChange={(e) => setAceptaClima(e.target.checked)}
                />
                <label htmlFor="reserva-acepta-clima" className="form-check-label">
                  Entiendo el riesgo y quiero reservar igual
                </label>
                <div className="invalid-feedback">{errores.clima}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <p className="approval-note">
        <i className={`bi ${rol.requiereAprobacion ? "bi-hourglass-split" : "bi-lightning-charge"} me-1`} aria-hidden="true"></i>
        {rol.requiereAprobacion
          ? "Tu solicitud quedará pendiente hasta que la administración la apruebe."
          : "Tu reserva se confirmará de inmediato."}
      </p>

      <div className="reserve-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancelar} disabled={enviando}>
          Cambiar horario
        </button>
        <button type="submit" className="btn btn-primary" disabled={enviando}>
          {enviando ? (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          ) : (
            <i className="bi bi-check2-circle me-1" aria-hidden="true"></i>
          )}
          {rol.requiereAprobacion ? "Enviar solicitud" : "Confirmar reserva"}
        </button>
      </div>
    </form>
  );
}
