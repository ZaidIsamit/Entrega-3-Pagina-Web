import { useCallback, useEffect, useState } from "react";
import { FueraDeRangoError, obtenerPronosticoPorHora } from "../services/climaApi.js";

export function useClima(sede, fecha) {
  const [resultado, setResultado] = useState({ estado: "cargando", datos: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!sede || !fecha) return;
    const controlador = new AbortController();
    setResultado({ estado: "cargando", datos: null });

    obtenerPronosticoPorHora(sede, fecha, controlador.signal)
      .then((datos) => setResultado({ estado: "ok", datos }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        const estado = error instanceof FueraDeRangoError ? "fuera-de-rango" : "error";
        setResultado({ estado, datos: null, mensaje: error.message });
      });

    return () => controlador.abort();
  }, [sede, fecha, intento]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);

  return { ...resultado, reintentar };
}
