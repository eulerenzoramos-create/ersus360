import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/tokens.css";
import App from "./App";
import { instalarFetchAutenticado } from "./lib/sessao";

// Token em todas as chamadas fetch() diretas à API (além do cliente axios)
instalarFetchAutenticado();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
