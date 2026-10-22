// src/pages/MapaDesempenho.tsx — Mapa de Desempenho em Saúde ERSUS 360
//
// Até 21/10/2026 esta tela gerava uma "nota" para cada município do Brasil por hash do código IBGE
// (scoreSintetico) a partir de médias por UF escritas no código, além de nota, cobertura, população,
// equipes e histórico fixos para Apuí e a região. Nada disso tinha fonte oficial e foi removido.
// Comparação entre municípios só volta quando houver indicador oficial publicado por município.
import { Link } from "react-router-dom";
import { Map } from "lucide-react";
import NaoDisponivelBanner from "../components/NaoDisponivelBanner";

export default function MapaDesempenho() {
  return (
    <div style={{ padding: "24px 32px", fontFamily: "Inter,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Map size={28} color="#1d4ed8" />
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0d2137" }}>Mapa de Desempenho</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>Comparação entre municípios</div>
        </div>
      </div>

      <NaoDisponivelBanner
        titulo="Comparação entre municípios não disponível"
        nota={
          "Não há fonte oficial integrada com um indicador comparável publicado para cada município. " +
          "As notas que apareciam aqui eram geradas pelo sistema (por cálculo sobre o código IBGE e médias " +
          "estaduais sem fonte) e foram removidas. Nenhum valor é estimado."
        }
        rodape="Nenhum valor foi inventado ou estimado."
      />

      <div style={{ marginTop: 16, fontSize: 13, color: "#374151" }}>
        Resultado oficial do município por equipe e competência:{" "}
        <Link to="/siaps" style={{ color: "#1d4ed8", fontWeight: 600 }}>Monitoramento SIAPS (e-Gestor)</Link>.
      </div>
    </div>
  );
}
