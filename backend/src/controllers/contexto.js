// Datos de la petición que necesitan los servicios para la auditoría,
// sin pasarles el objeto req completo (los servicios no dependen de Express).
export function contexto(req) {
  return {
    usuario: req.usuario,
    ip: req.ip,
    userAgent: req.get("user-agent") ?? null
  };
}
