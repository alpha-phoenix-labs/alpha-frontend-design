import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/index.css";
import App from "@/App.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root-Element #root wurde in index.html nicht gefunden.");
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
