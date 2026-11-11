export function limpiarRut(valor) {
  return String(valor || "").replace(/[^0-9kK]/g, "").toUpperCase();
}

// Calcula el dígito verificador con el algoritmo módulo 11.
export function digitoVerificador(cuerpo) {
  let suma = 0;
  let multiplicador = 2;
  for (const digito of String(cuerpo).split("").reverse()) {
    suma += Number(digito) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

export function rutEsValido(valor) {
  const limpio = limpiarRut(valor);
  if (!/^[0-9]{7,8}[0-9K]$/.test(limpio)) return false;
  return digitoVerificador(limpio.slice(0, -1)) === limpio.slice(-1);
}
