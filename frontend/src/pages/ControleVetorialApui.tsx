import { Bug } from "lucide-react"
import PainelFonteAberta from "../components/PainelFonteAberta"

// Só exibe o que o backend devolve de fonte oficial. Até 21/10/2026 esta tela lia campos que o backend
// não devolve e tinha textos com números escritos à mão — removidos.
export default function ControleVetorialApui() {
  return (
    <PainelFonteAberta
      titulo="Controle Vetorial"
      subtitulo="Malária · Dengue"
      Icon={Bug}
      endpoint="/api/controle-vetorial-apui/dashboard"
      campos={[
        {chave: "casos_malaria", label: "Casos de malária notificados", sub: "SIVEP-Malária"},
        {chave: "casos_dengue", label: "Casos de dengue notificados", sub: "SINAN"},
      ]}
    />
  )
}
