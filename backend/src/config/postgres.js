import pg from "pg";
import { env } from "./env.js";

// Las columnas DATE se devuelven como texto "YYYY-MM-DD".
// Si no, pg las convierte a Date en la zona horaria del servidor y la fecha puede correrse un día.
pg.types.setTypeParser(1082, (valor) => valor);
// NUMERIC (latitud/longitud) como número
pg.types.setTypeParser(1700, (valor) => Number(valor));
// BIGINT (resultados de COUNT y SUM) como número
pg.types.setTypeParser(20, (valor) => Number(valor));

export const pool = new pg.Pool({
  connectionString: env.postgresUrl,
  max: 10
});

export function consultar(texto, parametros) {
  return pool.query(texto, parametros);
}

// Ejecuta varias consultas dentro de una transacción.
// Si la función lanza un error se hace ROLLBACK de todo.
export async function enTransaccion(trabajo) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await trabajo(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}

export async function verificarPostgres() {
  await pool.query("SELECT 1");
}
