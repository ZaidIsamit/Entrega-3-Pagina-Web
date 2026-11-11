import { useEffect } from "react";

const ICONOS = {
  exito: "bi-check-circle-fill",
  error: "bi-exclamation-octagon-fill",
  info: "bi-info-circle-fill"
};

function Notificacion({ notificacion, onCerrar }) {
  useEffect(() => {
    const duracion = notificacion.tipo === "error" ? 7000 : 4500;
    const temporizador = setTimeout(() => onCerrar(notificacion.id), duracion);
    return () => clearTimeout(temporizador);
  }, [notificacion.id, notificacion.tipo, onCerrar]);

  return (
    <div className={`app-toast toast-${notificacion.tipo}`} role={notificacion.tipo === "error" ? "alert" : "status"}>
      <i className={`bi ${ICONOS[notificacion.tipo] ?? ICONOS.info}`} aria-hidden="true"></i>
      <div className="flex-grow-1">
        <div className="fw-semibold">{notificacion.titulo}</div>
        {notificacion.detalle && <div className="small opacity-75">{notificacion.detalle}</div>}
      </div>
      <button
        type="button"
        className="btn-close btn-close-white btn-sm"
        aria-label="Cerrar"
        onClick={() => onCerrar(notificacion.id)}
      ></button>
    </div>
  );
}

export default function Notificaciones({ notificaciones, onCerrar }) {
  return (
    <div className="toast-area" aria-live="polite">
      {notificaciones.map((n) => (
        <Notificacion key={n.id} notificacion={n} onCerrar={onCerrar} />
      ))}
    </div>
  );
}
