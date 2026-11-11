import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "@fontsource-variable/archivo/wdth.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles/styles.css";

import App from "./App.jsx";
import { NotificacionesProvider } from "./context/NotificacionesContext.jsx";
import { SesionProvider } from "./context/SesionContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SesionProvider>
        <NotificacionesProvider>
          <App />
        </NotificacionesProvider>
      </SesionProvider>
    </BrowserRouter>
  </StrictMode>
);
