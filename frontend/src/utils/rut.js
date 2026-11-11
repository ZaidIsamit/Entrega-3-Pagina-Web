export function limpiarRut(valor) {
  return (valor || "").replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);
}

export function formatearRut(valor) {
  const limpio = limpiarRut(valor);
  if (limpio.length < 2) return limpio;
  const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${cuerpo}-${limpio.slice(-1)}`;
}

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
