// Lee y valida las variables de entorno una sola vez al iniciar.
// Si falta una variable obligatoria el servidor no arranca (falla temprano y claro).

function requerida(nombre) {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revisa el archivo .env (ver .env.example).`);
  }
  return valor;
}

export const env = {
  entorno: process.env.NODE_ENV || "development",
  puerto: Number(process.env.PORT) || 3000,
  postgresUrl: requerida("DATABASE_URL"),
  mongoUrl: requerida("MONGO_URL"),
  mongoDb: process.env.MONGO_DB || "reservas_unab",
  jwtSecreto: requerida("JWT_SECRET"),
  jwtExpiracion: process.env.JWT_EXPIRES_IN || "8h",
  origenesCors: (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:8080")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  zonaHoraria: process.env.APP_TIMEZONE || "America/Santiago"
};
