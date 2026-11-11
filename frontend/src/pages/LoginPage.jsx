import { useState } from "react";
import logo from "../assets/images/logo-unab.jpg";
import { useSesion } from "../context/SesionContext.jsx";
import { formatearRut, limpiarRut, rutEsValido } from "../utils/rut.js";

const USUARIOS_PRUEBA = [
  { rut: "21.668.839-2", rol: "Docente" },
  { rut: "21.993.115-8", rol: "Estudiante" },
  { rut: "21.834.824-6", rol: "Organización" },
  { rut: "11.111.111-1", rol: "Administrador" }
];

export default function LoginPage() {
  const { entrar, expirada } = useSesion();
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  function alEscribirRut(e) {
    const limpio = limpiarRut(e.target.value);
    setRut(limpio ? formatearRut(limpio) : "");
    setErrores({});
  }

  function validar() {
    const nuevos = {};
    if (limpiarRut(rut).length < 8) nuevos.rut = "Ingresa tu RUT completo, con dígito verificador.";
    else if (!rutEsValido(rut)) nuevos.rut = "El dígito verificador no corresponde a este RUT.";
    if (!password) nuevos.password = "Ingresa tu contraseña.";
    return nuevos;
  }

  async function alEnviar(e) {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      await entrar(rut, password);
    } catch (error) {
      setErrores({ general: error.message });
      setEnviando(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-hero" aria-labelledby="login-hero-titulo">
        <div className="login-brand">
          <img src={logo} alt="Universidad Andrés Bello" className="login-logo" />
          <span>Reservas UNAB</span>
        </div>

        <h2 id="login-hero-titulo" className="login-hero-title">
          Salas, laboratorios y espacios del campus en un solo lugar.
        </h2>

        <ol className="login-steps">
          <li>Busca por sede, tipo de espacio y capacidad.</li>
          <li>Elige un bloque libre en la franja horaria del día.</li>
          <li>Si eres docente, se confirma al instante. Si no, la administración aprueba tu solicitud.</li>
        </ol>

        <div className="login-strip" aria-hidden="true">
          {[0, 0, 1, 1, 0, 2, 0, 0, 1, 0, 0, 0, 1].map((v, i) => (
            <span key={i} className={`login-strip-seg s${v}`}></span>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <form className="login-card" onSubmit={alEnviar} noValidate>
          <h1 className="login-title">Iniciar sesión</h1>
          <p className="text-muted mb-4">Ingresa con tu RUT institucional y tu contraseña.</p>

          {expirada && !errores.general && (
            <div className="alert alert-warning py-2 small text-start" role="status">
              <i className="bi bi-clock-history me-1" aria-hidden="true"></i>Tu sesión expiró. Vuelve a ingresar.
            </div>
          )}
          {errores.general && (
            <div className="alert alert-danger py-2 small text-start" role="alert">
              <i className="bi bi-exclamation-octagon me-1" aria-hidden="true"></i>{errores.general}
            </div>
          )}

          <div className="text-start">
            <label htmlFor="login-rut" className="form-label">RUT</label>
            <div className="input-icon mb-1">
              <i className="bi bi-person-vcard" aria-hidden="true"></i>
              <input
                id="login-rut"
                type="text"
                autoComplete="username"
                placeholder="12.345.678-9"
                className={`form-control form-control-lg ${errores.rut ? "is-invalid" : ""}`}
                value={rut}
                onChange={alEscribirRut}
                aria-describedby="login-rut-error"
                autoFocus
              />
            </div>
            <div id="login-rut-error" className="invalid-feedback d-block mb-2">{errores.rut}</div>

            <label htmlFor="login-password" className="form-label">Contraseña</label>
            <div className="input-icon input-with-action mb-1">
              <i className="bi bi-lock" aria-hidden="true"></i>
              <input
                id="login-password"
                type={verPassword ? "text" : "password"}
                autoComplete="current-password"
                className={`form-control form-control-lg ${errores.password ? "is-invalid" : ""}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrores({});
                }}
                aria-describedby="login-password-error"
              />
              <button
                type="button"
                className="input-action"
                onClick={() => setVerPassword((v) => !v)}
                aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                <i className={`bi ${verPassword ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true"></i>
              </button>
            </div>
            <div id="login-password-error" className="invalid-feedback d-block mb-3">{errores.password}</div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-100" disabled={enviando}>
            {enviando ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>Ingresando…
              </>
            ) : (
              "Ingresar"
            )}
          </button>

          <details className="demo-users">
            <summary>Usuarios de prueba</summary>
            <p className="mb-2">Contraseña para todos: <code>unab2026</code></p>
            <ul>
              {USUARIOS_PRUEBA.map((u) => (
                <li key={u.rut}>
                  <button type="button" className="btn btn-link btn-sm p-0" onClick={() => { setRut(u.rut); setErrores({}); }}>
                    {u.rut}
                  </button>{" "}
                  · {u.rol}
                </li>
              ))}
            </ul>
          </details>
        </form>
      </section>
    </div>
  );
}
