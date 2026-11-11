import { describirClima } from "../utils/clima.js";

export default function IconoClima({ codigo, className = "" }) {
  const { icono, texto } = describirClima(codigo);
  return <i className={`bi ${icono} ${className}`} title={texto} aria-label={texto} role="img"></i>;
}
