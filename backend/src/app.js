import { readFileSync } from "node:fs";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import YAML from "yaml";
import { env } from "./config/env.js";
import { manejarErrores, rutaNoEncontrada } from "./middlewares/manejoErrores.js";
import { rutas } from "./routes/index.js";

const especificacion = YAML.parse(
  readFileSync(new URL("./docs/openapi.yaml", import.meta.url), "utf8")
);

export function crearApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1); // detrás de nginx en Docker
  app.use(helmet({ contentSecurityPolicy: false })); // CSP desactivada para que cargue Swagger UI
  app.use(cors({ origin: env.origenesCors }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/", (_req, res) => res.redirect("/api/docs"));
  app.get("/api/docs.json", (_req, res) => res.json(especificacion));
  app.use(
    "/api/docs",
    swaggerUi.serve,
    swaggerUi.setup(especificacion, {
      customSiteTitle: "Reservas UNAB · API",
      swaggerOptions: { persistAuthorization: true }
    })
  );

  app.use("/api", rutas);

  app.use(rutaNoEncontrada);
  app.use(manejarErrores);
  return app;
}
