import { useEffect, useState } from "react";
import Cargando from "../components/Cargando.jsx";
import ErrorCarga from "../components/ErrorCarga.jsx";
import EstadoVacio from "../components/EstadoVacio.jsx";
import LineaTiempo from "../components/LineaTiempo.jsx";
import { listarActividad } from "../services/reportesApi.js";

const CATEGORIAS = [
  { id: "", texto: "Todo" },
  { id: "reserva", texto: "Reservas" },
  { id: "infraestructura", texto: "Infraestructura" },
  { id: "sesion", texto: "Sesiones" }
];
const POR_PAGINA = 25;

// Bitácora de auditoría: lee la colección "eventos" de MongoDB a través de la API.
export default function ActividadPage() {
  const [categoria, setCategoria] = useState("");
  const [eventos, setEventos] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [error, setError] = useState(null);
  const [hayMas, setHayMas] = useState(false);
  const [intento, setIntento] = useState(0);

  async function cargar({ reiniciar }) {
    setEstado(reiniciar ? "cargando" : "cargando-mas");
    try {
      const antesDe = reiniciar ? undefined : eventos[eventos.length - 1]?.id;
      const pagina = await listarActividad({ categoria, limite: POR_PAGINA, antesDe });
      setEventos((actuales) => (reiniciar ? pagina : [...actuales, ...pagina]));
      setHayMas(pagina.length === POR_PAGINA);
      setEstado("ok");
    } catch (err) {
      setError(err);
      setEstado("error");
    }
  }

  useEffect(() => {
    cargar({ reiniciar: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, intento]);

  return (
    <>
      <div className="page-head">
        <div>
          <span className="eyebrow">Administración</span>
          <h1 className="page-title">Actividad y auditoría</h1>
          <p className="page-lead">
            Registro de lo que ocurre en el sistema: solicitudes, aprobaciones, cancelaciones, cambios en los espacios e
            inicios de sesión. <span className="source-tag">MongoDB</span>
          </p>
        </div>
        <button type="button" className="btn btn-outline-primary" onClick={() => setIntento((n) => n + 1)}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true"></i>Actualizar
        </button>
      </div>

      <div className="toolbar">
        <div className="segmented" role="tablist" aria-label="Categoría">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={categoria === c.id}
              className={`segmented-btn ${categoria === c.id ? "active" : ""}`}
              onClick={() => setCategoria(c.id)}
            >
              {c.texto}
            </button>
          ))}
        </div>
      </div>

      {estado === "cargando" && <Cargando />}
      {estado === "error" && <ErrorCarga error={error} onReintentar={() => setIntento((n) => n + 1)} />}
      {estado !== "cargando" && estado !== "error" && eventos.length === 0 && (
        <EstadoVacio icono="bi-clock-history" titulo="Aún no hay actividad registrada">
          Los eventos aparecerán aquí a medida que se usen las funciones del sistema.
        </EstadoVacio>
      )}
      {eventos.length > 0 && estado !== "cargando" && estado !== "error" && (
        <section className="chart-card">
          <LineaTiempo eventos={eventos} mostrarEntidad />
          {hayMas && (
            <div className="text-center mt-3">
              <button type="button" className="btn btn-outline-secondary btn-sm" disabled={estado === "cargando-mas"} onClick={() => cargar({ reiniciar: false })}>
                {estado === "cargando-mas" && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>}
                Cargar más
              </button>
            </div>
          )}
        </section>
      )}
    </>
  );
}
