import { useNavigate } from "react-router-dom"
import {
  Activity, Bug, Syringe, Heart, Baby,
  Pill, Clock, TrendingUp, Users, Waves,
  DollarSign, Target, AlertTriangle, ShieldCheck, Anchor
} from "lucide-react"

const BRAND = "#dbeafe"

const MODULOS = [
  {
    label: "Atenção Primária",
    sub: "ESF · SISAB · eMulti · Novo Financiamento APS",
    path: "/atencao-primaria-apui",
    Icon: Activity,
    cor: "#1d4ed8",
    desc: "Base do sistema. ESF cobre populações ribeirinhas e indígenas via USF fluvial."
  },
  {
    label: "Malária",
    sub: "IPA · PNCM · Garimpo · Ribeirinho",
    path: "/malaria-apui",
    Icon: Bug,
    cor: "#dc2626",
    desc: "1ª causa de adoecimento no interior do AM. IPA > 50 em vários municípios. Garimpo amplifica transmissão."
  },
  {
    label: "Tuberculose & Hanseníase",
    sub: "DOTS · TB-HIV · Hiperendemia",
    path: "/tuberculose-apui",
    Icon: ShieldCheck,
    cor: "#b45309",
    desc: "AM = 3× a taxa nacional de TB. Hanseníase hiperendêmica. Abandono de tratamento alto em áreas remotas."
  },
  {
    label: "Saúde da Mulher",
    sub: "Pré-natal · Mortalidade Materna · Sífilis",
    path: "/saude-mulher-apui",
    Icon: Heart,
    cor: "#db2777",
    desc: "Mortalidade materna no AM é 2× a média nacional. Pré-natal tardio e parto sem assistência no interior."
  },
  {
    label: "Saúde da Criança",
    sub: "Puericultura · Desnutrição · Mortalidade Infantil",
    path: "/saude-crianca-apui",
    Icon: Baby,
    cor: "#0891b2",
    desc: "Mortalidade infantil acima da média nacional. Desnutrição e diarreia endêmicas, especialmente ribeirinha/indígena."
  },
  {
    label: "Vigilância Epidemiológica",
    sub: "SINAN · Surtos · Zoonoses · Notificações",
    path: "/vigilancia-epidemiologica-apui",
    Icon: AlertTriangle,
    cor: "#dc2626",
    desc: "Dengue, leptospirose, leishmaniose, hepatite A e surtos sazonais. Subnotificação estrutural no interior."
  },
  {
    label: "Imunização",
    sub: "PNI · Febre Amarela · Hepatite A · Coberturas",
    path: "/imunizacao-apui",
    Icon: Syringe,
    cor: "#7c3aed",
    desc: "Coberturas caem em zonas rurais e ribeirinhas. Febre amarela e hepatite A são prioritárias na Amazônia."
  },
  {
    label: "Saúde Indígena",
    sub: "SESAI · DSEI · Aldeias · Etnoterritório",
    path: "/saude-indigena-apui",
    Icon: Users,
    cor: "#92400e",
    desc: "Maioria dos 62 municípios tem populações indígenas. DSEI/SESAI opera paralelo ao SUS municipal — articulação é crítica."
  },
  {
    label: "Saúde Ribeirinha",
    sub: "Barco · Comunidades · Acesso Fluvial",
    path: "/saude-ribeirinha-apui",
    Icon: Waves,
    cor: "#0369a1",
    desc: "Comunidades acessadas somente por barco. USF fluvial e equipes volantes são a única ponte assistencial."
  },
  {
    label: "Regulação / TFD",
    sub: "Encam. Manaus · SISREG · Custo TFD",
    path: "/regulacao-acesso-apui",
    Icon: Anchor,
    cor: "#ea580c",
    desc: "Quase toda especialidade é regulada para Manaus. TFD consome 10–25% do orçamento da saúde nos municípios menores."
  },
  {
    label: "Controle Vetorial",
    sub: "Dengue · Malária · Leishmaniose · LIRAa",
    path: "/controle-vetorial-apui",
    Icon: Bug,
    cor: "#15803d",
    desc: "Três doenças vetoriais simultâneas. Nebulização, LIRAa e armadilhas de ovitrampa são rotina no interior."
  },
  {
    label: "Farmácia Básica",
    sub: "REMUME · Estoque · Cadeia Frio · FNS",
    path: "/farmacia-basica-apui",
    Icon: Pill,
    cor: "#16a34a",
    desc: "Desabastecimento frequente por logística fluvial. Medicamentos essenciais para malária, TB e crônicos têm prioridade."
  },
  {
    label: "Hiperdia / DCNT",
    sub: "HAS · DM · Sobrepeso · Crônicos",
    path: "/hiperdia-apui",
    Icon: TrendingUp,
    cor: "#d97706",
    desc: "DCNT em expansão mesmo no interior. HAS e DM são principais causas de TFD e internação evitável."
  },
  {
    label: "Urgência e Emergência",
    sub: "SAMU Fluvial · Ofídico · Trauma · Remoção",
    path: "/urgencia-emergencia-apui",
    Icon: Clock,
    cor: "#dc2626",
    desc: "Acidente ofídico e trauma são frequentes. SAMU fluvial com tempo de resposta de horas. Remoção aérea cara e rara."
  },
  {
    label: "Financeiro / FNS",
    sub: "PAB · MAC · Repasses · Execução",
    path: "/saude-financeira-apui",
    Icon: DollarSign,
    cor: "#dbeafe",
    desc: "Municípios pequenos dependem 70–90% de repasses federais (FNS). Gestão do PAB fixo/variável é essencial."
  },
]

const CONTEXTO = [
  { emoji: "🛶", texto: "Acesso majoritariamente fluvial — tempo médio para Manaus: 6 a 36 horas" },
  { emoji: "🌿", texto: "Floresta amazônica como contexto ecológico e epidemiológico determinante" },
  { emoji: "🪶", texto: "Populações indígenas em 58 dos 62 municípios — DSEI/SESAI atuando em paralelo" },
  { emoji: "⛏️", texto: "Garimpo legal e ilegal amplifica malária, mercurismo e ISTs em vários municípios" },
  { emoji: "🏥", texto: "Zero CT/PET/RNM no interior — toda média-alta complexidade vai para Manaus" },
  { emoji: "💊", texto: "Desabastecimento crônico por logística fluvial — estoque de segurança é regra" },
]

export default function EssenciaisApui() {
  const nav = useNavigate()
  return (
    <div style={{ padding: "32px", fontFamily: "Inter,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, color: "#6b7280", textTransform: "uppercase", marginBottom: 6 }}>
          Priorização
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color: BRAND, lineHeight: 1.2 }}>
          Módulos Essenciais
        </div>
        <div style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>
          62 municípios do Amazonas (exceto Manaus) · Interior · Ribeirinho · Indígena · Garimpo
        </div>
      </div>

      {/* Contexto amazônico */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
        {CONTEXTO.map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#374151" }}>
            <span>{c.emoji}</span>
            <span>{c.texto}</span>
          </div>
        ))}
      </div>

      {/* Grid de módulos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 40 }}>
        {MODULOS.map(({ label, sub, path, Icon, cor, desc }) => (
          <button
            key={path}
            onClick={() => nav(path)}
            style={{
              background: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: "20px 18px",
              textAlign: "left",
              cursor: "pointer",
              borderTop: `4px solid ${cor}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              transition: "box-shadow .15s",
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 18px rgba(0,0,0,.10)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            <Icon size={24} color={cor} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{sub}</div>
            </div>
            <div style={{ fontSize: 11, color: "#6b7280", lineHeight: 1.5 }}>{desc}</div>
          </button>
        ))}
      </div>

      <div style={{ padding: "16px 20px", background: "#eff6ff", borderRadius: 10, fontSize: 12, color: "#1e40af" }}>
        <b>Demais módulos disponíveis no menu lateral</b> — vigilância sanitária, saúde mental, gestão hospitalar, saúde bucal, auditoria e outros quando aplicável ao município.
      </div>
    </div>
  )
}
