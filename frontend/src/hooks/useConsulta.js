import { useCallback, useEffect, useState } from "react";

// Ejecuta una consulta a la API y expone sus estados: cargando, ok o error.
// "consulta" recibe un AbortSignal para cancelar la petición si cambian las dependencias.
export function useConsulta(consulta, dependencias) {
  const [resultado, setResultado] = useState({ estado: "cargando", datos: null, error: null });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controlador = new AbortController();
    setResultado((anterior) => ({ ...anterior, estado: "cargando", error: null }));

    consulta(controlador.signal)
      .then((datos) => setResultado({ estado: "ok", datos, error: null }))
      .catch((error) => {
        if (error.name === "AbortError") return;
        setResultado({ estado: "error", datos: null, error });
      });

    return () => controlador.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencias, intento]);

  const recargar = useCallback(() => setIntento((n) => n + 1), []);

  return { ...resultado, recargar };
}
