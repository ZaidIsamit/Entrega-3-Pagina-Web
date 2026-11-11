import { useState } from "react";
import Cargando from "../components/Cargando.jsx";
import ErrorCarga from "../components/ErrorCarga.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import { BarrasHorizontales, Columnas, Indicador } from "../components/graficos.jsx";
import { useConsulta } from "../hooks/useConsulta.js";
import { listarSedes } from "../services/infraestructuraApi.js";
import { obtenerIndicadores } from "../services/reportesApi.js";
import { etiquetaHora, fechaISO, sumarDias } from "../utils/fechas.js";
import { describirEvento } from "../utils/formato.js";

const PERIODOS = [
  { id: "30", texto: "Últimos 30 días", desde: -30, hasta: 0 },
  { id: "7", texto: "Últimos 7 días", desde: -7, hasta: 0 },
  { id: "prox", texto: "Próximos 14 días", desde: 0, hasta: 14 },
  { id: "todo", texto: "-30 a +14 días", desde: -30, hasta: 14 }
];

const pct = (v) => `${v.toLocaleString("es-CL")}%`;

export default function PanelPage() {
  const [periodo, setPeriodo] = useState("todo");
  const [sedeId, setSedeId] = useState("");

  const p = PERIODOS.find((x) => x.id === periodo);
  const hoy = fechaISO();
  const filtros = { desde: sumarDias(hoy, p.desde), hasta: sumarDias(hoy, p.hasta), sedeId };

  const sedes = useConsulta(() => listarSedes(), []);
  const panel = useConsulta(() => obtenerIndicadores(filtros), [filtros.desde, filtros.hasta, sedeId]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Administración</span>
          <h1 className="page-title">Indicadores de utilización</h1>
          <p className="page-lead">Cuánto se usan los espacios, en qué horarios y cómo se resuelven las solicitudes.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="segmented" role="group" aria-label="Período">
          {PERIODOS.map((x) => (
            <button key={x.id} type="button" className={`segmented-btn ${periodo === x.id ? "active" : ""}`} onClick={() => setPeriodo(x.id)} aria-pressed={periodo === x.id}>
              {x.texto}
            </button>
          ))}
        </div>
        <div className="toolbar-filter">
          <select className="form-select form-select-sm" aria-label="Sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)}>
            <option value="">Todas las sedes</option>
            {(sedes.datos ?? []).map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
      </div>

      {panel.estado === "cargando" && !panel.datos && <Cargando />}
      {panel.estado === "error" && <ErrorCarga error={panel.error} onReintentar={panel.recargar} />}
      {panel.datos && <ContenidoPanel datos={panel.datos} actualizando={panel.estado === "cargando"} />}
    </>
  );
}

function ContenidoPanel({ datos, actualizando }) {
  const { resumen, porEspacio, porTipo, porHora, actividad } = datos;
  const masUsados = porEspacio.slice(0, 8);

  return (
    <div className={actualizando ? "is-refreshing" : ""}>
      <div className="kpi-grid">
        <Indicador icono="bi-graph-up" titulo="Ocupación" valor={pct(resumen.tasaOcupacion)} detalle={`${resumen.horasAprobadas} de ${resumen.horasDisponibles.toLocaleString("es-CL")} h disponibles`} />
        <Indicador icono="bi-inbox" titulo="Solicitudes" valor={resumen.totalSolicitudes} detalle={`${resumen.porEstado.pendiente} pendientes`} tono="violeta" />
        <Indicador icono="bi-check2-circle" titulo="Tasa de aprobación" valor={pct(resumen.tasaAprobacion)} detalle={`${resumen.porEstado.aprobada} aprobadas · ${resumen.porEstado.rechazada} rechazadas`} tono="verde" />
        <Indicador icono="bi-slash-circle" titulo="Cancelaciones" valor={pct(resumen.tasaCancelacion)} detalle={resumen.porEstado.cancelada === 1 ? "1 reserva" : `${resumen.porEstado.cancelada} reservas`} tono="ambar" />
        <Indicador
          icono="bi-stopwatch"
          titulo="Tiempo de respuesta"
          valor={resumen.tiempoMedioRespuestaHoras != null ? `${resumen.tiempoMedioRespuestaHoras} h` : "—"}
          detalle="Promedio para aprobar o rechazar"
          tono="cielo"
        />
      </div>

      <div className="row g-3 g-lg-4 mt-1">
        <div className="col-12 col-lg-7">
          <section className="chart-card">
            <h2 className="chart-title">Espacios más utilizados</h2>
            <p className="chart-subtitle">% de las horas del período con reserva aprobada (08:00–21:00)</p>
            {masUsados.every((e) => e.horas === 0) ? (
              <EstadoVacio icono="bi-bar-chart" titulo="Sin reservas aprobadas en el período" />
            ) : (
              <BarrasHorizontales
                filas={masUsados}
                etiqueta={(e) => e.nombre}
                valor={(e) => e.ocupacion}
                formato={pct}
                columnasTabla={[
                  { titulo: "Espacio", valor: (e) => `${e.codigo} · ${e.nombre}` },
                  { titulo: "Reservas", valor: (e) => e.reservas },
                  { titulo: "Horas", valor: (e) => e.horas },
                  { titulo: "Ocupación", valor: (e) => pct(e.ocupacion) },
                  { titulo: "Cancelaciones", valor: (e) => e.cancelaciones }
                ]}
              />
            )}
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <section className="chart-card">
            <h2 className="chart-title">Horas reservadas por tipo</h2>
            <p className="chart-subtitle">Solo reservas aprobadas</p>
            {porTipo.length === 0 ? (
              <EstadoVacio icono="bi-pie-chart" titulo="Sin datos en el período" />
            ) : (
              <BarrasHorizontales
                filas={porTipo}
                etiqueta={(t) => t.tipo}
                valor={(t) => t.horas}
                formato={(v) => `${v} h`}
                columnasTabla={[
                  { titulo: "Tipo", valor: (t) => t.tipo },
                  { titulo: "Reservas", valor: (t) => t.reservas },
                  { titulo: "Horas", valor: (t) => t.horas }
                ]}
              />
            )}
          </section>
        </div>

        <div className="col-12 col-lg-7">
          <section className="chart-card">
            <h2 className="chart-title">Demanda por hora del día</h2>
            <p className="chart-subtitle">Reservas aprobadas que ocupan cada bloque</p>
            <Columnas
              filas={porHora}
              etiqueta={(h) => etiquetaHora(h.hora).slice(0, 2)}
              valor={(h) => h.reservas}
              descripcion="Cantidad de reservas por bloque horario"
              columnasTabla={[
                { titulo: "Bloque", valor: (h) => `${etiquetaHora(h.hora)}–${etiquetaHora(h.hora + 1)}` },
                { titulo: "Reservas", valor: (h) => h.reservas }
              ]}
            />
          </section>
        </div>

        <div className="col-12 col-lg-5">
          <section className="chart-card">
            <h2 className="chart-title">
              Demanda no atendida <span className="source-tag">MongoDB</span>
            </h2>
            <p className="chart-subtitle">Intentos de reserva rechazados por choque de horario</p>
            {actividad.demandaInsatisfecha.length === 0 ? (
              <EstadoVacio icono="bi-emoji-smile" titulo="Sin conflictos registrados">
                Nadie intentó reservar un bloque ya ocupado en este período.
              </EstadoVacio>
            ) : (
              <BarrasHorizontales
                filas={actividad.demandaInsatisfecha}
                etiqueta={(d) => d.espacio}
                valor={(d) => d.intentos}
                formato={(v) => `${v} ${v === 1 ? "intento" : "intentos"}`}
              />
            )}
            {actividad.eventosPorTipo.length > 0 && (
              <>
                <h3 className="chart-title mt-4 h6">Actividad registrada</h3>
                <ul className="event-counts">
                  {actividad.eventosPorTipo.map((e) => {
                    const c = describirEvento(e.tipo);
                    return (
                      <li key={e.tipo}>
                        <i className={`bi ${c.icono}`} aria-hidden="true"></i> {c.texto}
                        <span className="ms-auto fw-semibold">{e.cantidad}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
