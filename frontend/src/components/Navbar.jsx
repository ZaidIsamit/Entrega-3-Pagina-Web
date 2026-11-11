import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import logo from "../assets/images/logo-unab.jpg";
import BadgeRol from "./BadgeRol.jsx";

const ENLACES = [
  { ruta: "/espacios", texto: "Espacios", icono: "bi-grid", soloAdmin: false },
  { ruta: "/mis-reservas", texto: "Mis reservas", icono: "bi-calendar-check", soloAdmin: false },
  { ruta: "/solicitudes", texto: "Solicitudes", icono: "bi-inbox", soloAdmin: true },
  { ruta: "/administracion", texto: "Administración", icono: "bi-building-gear", soloAdmin: true },
  { ruta: "/panel", texto: "Indicadores", icono: "bi-bar-chart-line", soloAdmin: true },
  { ruta: "/actividad", texto: "Actividad", icono: "bi-clock-history", soloAdmin: true }
];

export default function Navbar({ usuario, onCerrarSesion }) {
  const enlaces = ENLACES.filter((e) => !e.soloAdmin || usuario.rol.esAdmin);
  // Con pocas secciones caben siempre en una fila; con muchas, en pantallas
  // angostas se agrupan en un menú desplegable (sin desplazamiento horizontal).
  const plegable = enlaces.length > 2;
  const [abierto, setAbierto] = useState(false);
  const { pathname } = useLocation();
  const actual = enlaces.find((e) => pathname.startsWith(e.ruta));

  // El menú se cierra al elegir una sección
  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  return (
    <header className="app-navbar sticky-top">
      <div className="container">
        <div className="navbar-row">
          <NavLink to="/espacios" className="brand text-decoration-none text-white">
            <img src={logo} alt="" className="brand-logo" />
            <div className="lh-sm">
              <span className="brand-title">Reservas UNAB</span>
              <span className="brand-subtitle d-none d-sm-block">Espacios universitarios</span>
            </div>
          </NavLink>

          <div className="ms-auto d-flex align-items-center gap-2 gap-sm-3">
            <div className="text-end d-none d-lg-block lh-sm">
              <div className="user-name">{usuario.nombre}</div>
              <div className="user-rut">{usuario.rutFormateado}</div>
            </div>
            <BadgeRol rol={usuario.rol} />
            <button type="button" className="btn btn-logout" onClick={onCerrarSesion} title="Cerrar sesión" aria-label="Cerrar sesión">
              <i className="bi bi-box-arrow-right" aria-hidden="true"></i>
              <span className="d-none d-sm-inline ms-1">Salir</span>
            </button>
          </div>
        </div>

        {plegable && (
          <button
            type="button"
            className="nav-toggle d-lg-none"
            aria-expanded={abierto}
            aria-controls="menu-secciones"
            onClick={() => setAbierto((a) => !a)}
          >
            <i className={`bi ${abierto ? "bi-x-lg" : "bi-list"}`} aria-hidden="true"></i>
            <span className="flex-grow-1 text-start">
              {actual ? (
                <>
                  <i className={`bi ${actual.icono} me-1`} aria-hidden="true"></i>
                  {actual.texto}
                </>
              ) : (
                "Menú"
              )}
            </span>
            <span className="nav-toggle-hint">{abierto ? "Cerrar" : "Menú"}</span>
          </button>
        )}

        <nav
          id="menu-secciones"
          className={`app-nav ${plegable ? "is-plegable" : ""} ${abierto ? "is-open" : ""}`}
          aria-label="Secciones"
        >
          {enlaces.map((e) => (
            <NavLink key={e.ruta} to={e.ruta} className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}>
              <i className={`bi ${e.icono}`} aria-hidden="true"></i> {e.texto}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
