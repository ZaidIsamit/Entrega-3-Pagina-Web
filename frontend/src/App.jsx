import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import EstadoVacio from "./components/EstadoVacio.jsx";
import { useSesion } from "./context/SesionContext.jsx";
import ActividadPage from "./pages/ActividadPage.jsx";
import AdministracionPage from "./pages/AdministracionPage.jsx";
import EspaciosPage from "./pages/EspaciosPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MisReservasPage from "./pages/MisReservasPage.jsx";
import PanelPage from "./pages/PanelPage.jsx";
import SolicitudesPage from "./pages/SolicitudesPage.jsx";

// Envuelve las páginas que solo puede ver la administración
function SoloAdmin({ usuario, children }) {
  if (!usuario.rol.esAdmin) {
    return (
      <EstadoVacio icono="bi-shield-lock" titulo="No tienes acceso a esta sección">
        Esta página es solo para la administración de espacios.
      </EstadoVacio>
    );
  }
  return children;
}

export default function App() {
  const { usuario, estado, cerrarSesion } = useSesion();

  if (estado === "verificando") {
    return (
      <div className="splash" aria-busy="true">
        <span className="spinner-border text-primary" aria-hidden="true"></span>
        <span className="visually-hidden">Verificando sesión…</span>
      </div>
    );
  }

  if (!usuario) {
    return <LoginPage />;
  }

  return (
    <>
      <Navbar usuario={usuario} onCerrarSesion={cerrarSesion} />

      <main className="container app-main">
        <Routes>
          <Route path="/" element={<Navigate to="/espacios" replace />} />
          <Route path="/espacios" element={<EspaciosPage usuario={usuario} />} />
          <Route path="/mis-reservas" element={<MisReservasPage />} />
          <Route path="/solicitudes" element={<SoloAdmin usuario={usuario}><SolicitudesPage /></SoloAdmin>} />
          <Route path="/administracion" element={<SoloAdmin usuario={usuario}><AdministracionPage /></SoloAdmin>} />
          <Route path="/panel" element={<SoloAdmin usuario={usuario}><PanelPage /></SoloAdmin>} />
          <Route path="/actividad" element={<SoloAdmin usuario={usuario}><ActividadPage /></SoloAdmin>} />
          <Route
            path="*"
            element={
              <EstadoVacio icono="bi-signpost-split" titulo="Página no encontrada">
                Vuelve al <a href="/espacios">catálogo de espacios</a>.
              </EstadoVacio>
            }
          />
        </Routes>
      </main>
    </>
  );
}
