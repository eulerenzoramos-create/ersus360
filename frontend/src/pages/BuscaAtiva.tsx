import { Link } from "react-router-dom"
import { Search } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Até 21/10/2026 esta tela listava os 7 indicadores do Previne Brasil (extinto) com metas fixas, um aviso
// escrito à mão ("678 mulheres sem exame preventivo — 43% vs meta 60%") e "0/0 realizados" quando a rota
// (inexistente) não respondia. Lista nominal para busca ativa depende do e-SUS PEC do município.
export default function BuscaAtiva() {
  return (
    <div>
      <PainelFonteAberta
        titulo="Busca Ativa"
        subtitulo="Pessoas com cuidado pendente"
        Icon={Search}
        endpoint="/api/previne/busca-ativa"
      />
      <div style={{ padding: "0 32px 24px", fontSize: 13, color: "#374151" }}>
        A lista nominal (gestantes, rastreios, vacinação, crônicos) vem do e-SUS PEC pelo agente local, ainda não
        autorizado. Resultado oficial dos indicadores de qualidade por equipe:{" "}
        <Link to="/siaps" style={{ color: "#1d4ed8", fontWeight: 600 }}>Monitoramento SIAPS (e-Gestor)</Link>.
      </div>
    </div>
  )
}
