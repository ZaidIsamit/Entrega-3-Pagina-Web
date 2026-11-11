import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { iniciarSesion, obtenerPerfil } from "../services/authApi.js";
import { configurarExpiracionSesion, guardarToken, leerToken } from "../services/http.js";
import { formatearRut } from "../utils/rut.js";

const SesionContext = createContext(null);

function conRutFormateado(usuario) {
  return usuario ? { ...usuario, rutFormateado: formatearRut(usuario.rut) } : null;
}

export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // "verificando" mientras se valida el token guardado contra la API
  const [estado, setEstado] = useState(() => (leerToken() ? "verificando" : "listo"));
  const [expirada, setExpirada] = useState(false);

  const cerrarSesion = useCallback(() => {
    guardarToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    configurarExpiracionSesion(() => {
      setExpirada(true);
      cerrarSesion();
    });
  }, [cerrarSesion]);

  // Al abrir la app, si hay un token guardado se recupera el usuario desde la API
  useEffect(() => {
    if (!leerToken()) return;
    obtenerPerfil()
      .then((perfil) => setUsuario(conRutFormateado(perfil)))
      .catch(() => guardarToken(null))
      .finally(() => setEstado("listo"));
  }, []);

  const entrar = useCallback(async (rut, password) => {
    const { token, usuario: datos } = await iniciarSesion(rut, password);
    guardarToken(token);
    setExpirada(false);
    setUsuario(conRutFormateado(datos));
  }, []);

  const valor = { usuario, estado, expirada, entrar, cerrarSesion };
  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion() {
  return useContext(SesionContext);
}
