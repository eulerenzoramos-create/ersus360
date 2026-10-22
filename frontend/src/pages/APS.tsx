import { Link } from "react-router-dom"
import { Activity } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Até 21/10/2026 esta tela lia campos que o backend não devolve (UBS, cobertura ESF, produção/mês) e quebrava
// ao abrir ("ubs.map is not a function"). O resultado oficial da APS está no Monitoramento SIAPS.
export default function APS() {
  return (
    <div>
      <PainelFonteAberta
        titulo="Atenção Primária à Saúde"
        subtitulo="Visão geral"
        Icon={Activity}
        endpoint="/api/aps/dashboard"
      />
      <div style={{ padding: "0 32px 24px", fontSize: 13 }}>
        Resultado oficial por equipe e competência:{" "}
        <Link to="/siaps" style={{ color: "#1d4ed8", fontWeight: 600 }}>Monitoramento SIAPS (e-Gestor)</Link>
      </div>
    </div>
  )
}
