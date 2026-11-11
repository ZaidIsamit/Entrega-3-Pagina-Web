import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FiltrosEspacios from "../components/FiltrosEspacios.jsx";
import PanelClima from "../components/PanelClima.jsx";
import TarjetaEspacio from "../components/TarjetaEspacio.jsx";
import DetalleEspacio from "../components/DetalleEspacio.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import Cargando from "../components/Cargando.jsx";
import ErrorCarga from "../components/ErrorCarga.jsx";
import { useNotificar } from "../context/NotificacionesContext.jsx";
import { useClima } from "../hooks/useClima.js";
import { useConsulta } from "../hooks/useConsulta.js";
import { listarEspacios, listarSedes, listarTiposEspacio } from "../services/infraestructuraApi.js";
import { crearReserva, ocupacionSede } from "../services/reservasApi.js";
import { hayRiesgoLluvia } from "../utils/clima.js";
import { fechaISO, formatearFechaLarga, rangoHorario } from "../utils/fechas.js";
import { estadosDelDia } from "../utils/reservas.js";

const filtrosIniciales = (sedeId = "") => ({
  sedeId,
  tipoId: "",
  personas: "1",
  fecha: fechaISO(),
  busqueda: ""
});

// Evita llamar a la API en cada tecla de la búsqueda
function useValorRetrasado(valor, ms = 350) {
  const [retrasado, setRetrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return retrasado;
}

export default function EspaciosPage({ usuario }) {
  const notificar = useNotificar();
  const [filtros, setFiltros] = useState(filtrosIniciales);
  const [espacioAbierto, setEspacioAbierto] = useState(null);

  // Catálogos (cambian poco): sedes y tipos de espacio
  const catalogos = useConsulta(() => Promise.all([listarSedes(), listarTiposEspacio()]), []);
  const [sedes, tipos] = catalogos.datos ?? [[], []];

  useEffect(() => {
    if (sedes.length && !filtros.sedeId) setFiltros((f) => ({ ...f, sedeId: sedes[0].id }));
  }, [sedes, filtros.sedeId]);

  const busqueda = useValorRetrasado(filtros.busqueda.trim());
  const personas = Math.max(1, Number(filtros.personas) || 1);
  const listo = Boolean(filtros.sedeId);

  // Espacios filtrados por la API (PostgreSQL)
  const espacios = useConsulta(
    (signal) =>
      listo
        ? listarEspacios({ sedeId: filtros.sedeId, tipoId: filtros.tipoId, capacidadMin: personas, q: busqueda }, signal)
        : new Promise(() => {}),
    [filtros.sedeId, filtros.tipoId, personas, busqueda]
  );

  // Bloques ocupados de la sede en la fecha elegida
  const ocupacion = useConsulta(
    (signal) => (listo ? ocupacionSede(filtros.sedeId, filtros.fecha, signal) : new Promise(() => {})),
    [filtros.sedeId, filtros.fecha]
  );

  const sede = sedes.find((s) => s.id === filtros.sedeId);
  const clima = useClima(sede, filtros.fecha);

  const lluviaEnElDia =
    clima.estado === "ok" && Object.values(clima.datos.porHora).some(hayRiesgoLluvia);
  const bloquesOcupados = useMemo(() => ocupacion.datos ?? [], [ocupacion.datos]);

  function cambiarFiltro(campo, valor) {
    setFiltros((actuales) => ({ ...actuales, [campo]: valor }));
  }

  async function reservar(datos) {
    try {
      const reserva = await crearReserva(datos);
      setEspacioAbierto(null);
      ocupacion.recargar();
      const rango = `${reserva.espacio.nombre} · ${formatearFechaLarga(reserva.fecha)}, ${rangoHorario(reserva.horaInicio, reserva.duracion)}`;
      if (reserva.estado === "pendiente") {
        notificar("info", "Solicitud enviada", `${rango}. Te avisaremos en "Mis reservas" cuando sea revisada.`);
      } else {
        notificar("exito", "Reserva confirmada", rango);
      }
    } catch (error) {
      // Si alguien tomó el bloque antes, se recargan los horarios
      if (error.estado === 409) ocupacion.recargar();
      throw error;
    }
  }

  if (catalogos.estado === "error") {
    return <ErrorCarga error={catalogos.error} onReintentar={catalogos.recargar} />;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Hola, {usuario.nombre.split(" ")[0]}</span>
          <h1 className="page-title">¿Qué espacio necesitas?</h1>
          <p className="page-lead">Filtra por sede, tipo y capacidad, y reserva el bloque que te acomode.</p>
        </div>
        <Link to="/mis-reservas" className="btn btn-outline-primary">
          <i className="bi bi-calendar-check me-1" aria-hidden="true"></i>Mis reservas
        </Link>
      </div>

      <div className="row g-3 g-lg-4 align-items-stretch mb-4">
        <div className="col-12 col-xl-8">
          <FiltrosEspacios
            filtros={filtros}
            sedes={sedes}
            tipos={tipos}
            onCambiar={cambiarFiltro}
            onLimpiar={() => setFiltros(filtrosIniciales(sedes[0]?.id))}
          />
        </div>
        <div className="col-12 col-xl-4">
          {sede && <PanelClima clima={clima} sede={sede} fecha={filtros.fecha} />}
        </div>
      </div>

      <div className="results-head">
        <h2 className="h5 mb-0">Espacios</h2>
        {espacios.estado === "ok" && (
          <span className="results-count">
            {espacios.datos.length} {espacios.datos.length === 1 ? "resultado" : "resultados"}
          </span>
        )}
      </div>

      {ocupacion.estado === "error" && (
        <div className="alert alert-warning d-flex align-items-center gap-2" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true"></i>
          <span className="flex-grow-1">No pudimos cargar la ocupación del día. {ocupacion.error.message}</span>
          <button type="button" className="btn btn-sm btn-outline-dark" onClick={ocupacion.recargar}>Reintentar</button>
        </div>
      )}

      {espacios.estado === "cargando" && !espacios.datos && <Cargando texto="Cargando espacios…" />}
      {espacios.estado === "error" && <ErrorCarga error={espacios.error} onReintentar={espacios.recargar} />}

      {espacios.datos && espacios.datos.length === 0 && (
        <EstadoVacio icono="bi-search" titulo="No encontramos espacios con esos filtros">
          Prueba con menos personas, otro tipo de espacio u otra sede.
        </EstadoVacio>
      )}

      {espacios.datos && espacios.datos.length > 0 && (
        <div className={`space-grid ${espacios.estado === "cargando" ? "is-refreshing" : ""}`}>
          {espacios.datos.map((espacio) => (
            <TarjetaEspacio
              key={espacio.id}
              espacio={espacio}
              estados={estadosDelDia(bloquesOcupados, espacio.id, filtros.fecha)}
              riesgoLluvia={espacio.exterior && lluviaEnElDia}
              onVerHorarios={setEspacioAbierto}
            />
          ))}
        </div>
      )}

      {espacioAbierto && (
        <DetalleEspacio
          espacio={espacioAbierto}
          fecha={filtros.fecha}
          onCambiarFecha={(fecha) => cambiarFiltro("fecha", fecha)}
          ocupacion={bloquesOcupados}
          cargandoOcupacion={ocupacion.estado === "cargando"}
          usuario={usuario}
          clima={clima}
          personasSugeridas={personas}
          onReservar={reservar}
          onCerrar={() => setEspacioAbierto(null)}
        />
      )}
    </>
  );
}
