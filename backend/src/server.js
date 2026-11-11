import { crearApp } from "./app.js";
import { env } from "./config/env.js";
import { cerrarMongo, conectarMongo } from "./config/mongo.js";
import { pool, verificarPostgres } from "./config/postgres.js";

// Reintenta la conexión: en Docker la base puede tardar unos segundos más que la API en estar lista.
async function conReintentos(nombre, conectar, intentos = 10) {
  for (let i = 1; i <= intentos; i++) {
    try {
      await conectar();
      console.log(`✔ Conectado a ${nombre}`);
      return;
    } catch (error) {
      console.warn(`✖ ${nombre} no disponible (intento ${i}/${intentos}): ${error.message}`);
      if (i === intentos) throw error;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

async function iniciar() {
  await conReintentos("PostgreSQL", verificarPostgres);
  await conReintentos("MongoDB", conectarMongo);

  const servidor = crearApp().listen(env.puerto, () => {
    console.log(`API escuchando en http://localhost:${env.puerto}`);
    console.log(`Swagger:           http://localhost:${env.puerto}/api/docs`);
  });

  const apagar = async () => {
    servidor.close();
    await Promise.allSettled([pool.end(), cerrarMongo()]);
    process.exit(0);
  };
  process.on("SIGTERM", apagar);
  process.on("SIGINT", apagar);
}

iniciar().catch((error) => {
  console.error("No se pudo iniciar la API:", error.message);
  process.exit(1);
});
