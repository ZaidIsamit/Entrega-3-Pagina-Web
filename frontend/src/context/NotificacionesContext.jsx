import { createContext, useCallback, useContext, useMemo, useState } from "react";
import Notificaciones from "../components/Notificaciones.jsx";

const NotificacionesContext = createContext(() => {});

export function NotificacionesProvider({ children }) {
  const [notificaciones, setNotificaciones] = useState([]);

  // tipo: "exito" | "error" | "info"
  const notificar = useCallback((tipo, titulo, detalle) => {
    const id = `${Date.now()}-${Math.random()}`;
    setNotificaciones((actuales) => [...actuales, { id, tipo, titulo, detalle }]);
  }, []);

  const cerrar = useCallback((id) => {
    setNotificaciones((actuales) => actuales.filter((n) => n.id !== id));
  }, []);

  const valor = useMemo(() => notificar, [notificar]);

  return (
    <NotificacionesContext.Provider value={valor}>
      {children}
      <Notificaciones notificaciones={notificaciones} onCerrar={cerrar} />
    </NotificacionesContext.Provider>
  );
}

export function useNotificar() {
  return useContext(NotificacionesContext);
}
