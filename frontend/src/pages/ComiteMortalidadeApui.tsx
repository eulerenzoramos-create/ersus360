import { HeartPulse } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function ComiteMortalidadeApui() {
  return (
    <PainelFonteAberta
      titulo="Comitê de Mortalidade"
      subtitulo="Óbitos maternos e infantis evitáveis"
      Icon={HeartPulse}
      endpoint="/api/comite-mortalidade-apui/dashboard"
      campos={[
        {chave: "obitos", label: "Óbitos registrados no SIM", sub: "Por local de ocorrência, todas as idades — não é só óbito infantil"},
        {chave: "nascidos_vivos", label: "Nascidos vivos (SINASC)"},
      ]}
    />
  )
}
