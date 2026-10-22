import { Link } from "react-router-dom"
import { Target } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Até 21/10/2026 esta tela lia campos que o backend não devolve (metas PMS, "nota 0–10" do modelo extinto)
// e quebrava ao abrir. Agora só mostra o SIOPS devolvido pelo backend; metas do PMS não têm fonte integrada.
export default function MonitoramentoMetasApui() {
  return (
    <PainelFonteAberta
      titulo="Monitoramento de Metas"
      subtitulo="Aplicação mínima em saúde (SIOPS)"
      Icon={Target}
      endpoint="/api/monitoramento-metas-apui/dashboard"
      campos={[
        { chave: "financeiro.minimo_constitucional_pct_aplicado", label: "Aplicado em ASPS", sub: "% da receita de impostos (SIOPS)", formato: "pct" },
        { chave: "financeiro.minimo_constitucional_pct_obrigatorio", label: "Mínimo constitucional", sub: "LC 141/2012", formato: "pct" },
        { chave: "financeiro.gasto_proprio_saude", label: "Despesa com recursos próprios", formato: "brl" },
      ]}>
      {() => (
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 10, padding: 12, fontSize: 12, color: "#374151" }}>
          Metas do Plano Municipal de Saúde: sem fonte integrada (o PMS/PAS não é publicado em base aberta).
          Resultado oficial dos indicadores de qualidade por equipe:{" "}
          <Link to="/siaps" style={{ color: "#1d4ed8", fontWeight: 600 }}>Monitoramento SIAPS (e-Gestor)</Link>.
        </div>
      )}
    </PainelFonteAberta>
  )
}
