import { Stethoscope } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function CeacAmbulatorialApui() {
  return (
    <PainelFonteAberta
      titulo="CEAC — Atenção Ambulatorial"
      subtitulo="Especialidades · Exames · Filas"
      Icon={Stethoscope}
      endpoint="/api/ceac-ambulatorial-apui/dashboard"
    />
  )
}
