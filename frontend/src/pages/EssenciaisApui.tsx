import { useNavigate } from "react-router-dom"
import {
  Activity, Bug, Syringe, Heart, Baby,
  Pill, Clock, TrendingUp, Users, Waves,
  DollarSign, Target, AlertTriangle, ShieldCheck, Thermometer
} from "lucide-react"

const BRAND = "#1e3a5f", ACCENT = "#1d4ed8"

const MODULOS = [
  { label: "Atenção Primária",        sub: "ESF · SISAB · Previne",       path: "/atencao-primaria-apui",        Icon: Activity,      cor: "#1d4ed8" },
  { label: "Malária",                 sub: "IPA · PNCM · Garimpo",        path: "/malaria-apui",                 Icon: Bug,           cor: "#dc2626" },
  { label: "Dengue / Arboviroses",    sub: "IIP · Nebulização · LIRAa",   path: "/dengue-arboviroses-apui",      Icon: Bug,           cor: "#ea580c" },
  { label: "Imunização",              sub: "PNI · Coberturas · Cadeia",   path: "/imunizacao-apui",              Icon: Syringe,       cor: "#7c3aed" },
  { label: "Saúde da Mulher",         sub: "Pré-natal · Sífilis · CA",    path: "/saude-mulher-apui",            Icon: Heart,         cor: "#db2777" },
  { label: "Saúde da Criança",        sub: "Puericultura · Desnutrição",  path: "/saude-crianca-apui",           Icon: Baby,          cor: "#0891b2" },
  { label: "Hiperdia / DCNT",         sub: "HAS · DM · Consultas",        path: "/hiperdia-apui",                Icon: TrendingUp,    cor: "#d97706" },
  { label: "Urgência e Emergência",   sub: "UPA · Trauma · Ofídico",      path: "/urgencia-emergencia-apui",     Icon: Clock,         cor: "#dc2626" },
  { label: "Farmácia Básica",         sub: "Estoque · REMUME · FNS",      path: "/farmacia-basica-apui",         Icon: Pill,          cor: "#16a34a" },
  { label: "Monitoramento de Metas",  sub: "PMS · Previne Brasil · Quadrimestral", path: "/monitoramento-metas-apui", Icon: Target,   cor: "#1d4ed8" },
  { label: "Saúde Indígena",          sub: "SESAI · Aldeias · DSEI",      path: "/saude-indigena-apui",          Icon: Users,         cor: "#92400e" },
  { label: "Saúde Ribeirinha",        sub: "Comunidades · Barco · Rural", path: "/saude-ribeirinha-apui",        Icon: Waves,         cor: "#0369a1" },
  { label: "Tuberculose",             sub: "DOTS · Cura · Abandono",      path: "/tuberculose-apui",             Icon: ShieldCheck,   cor: "#b45309" },
  { label: "Vigilância Epidemiológica", sub: "SINAN · Surtos · SINAN",    path: "/vigilancia-epidemiologica-apui", Icon: AlertTriangle, cor: "#dc2626" },
  { label: "Financeiro / FNS",        sub: "Repasses · Execução · MAC",   path: "/saude-financeira-apui",        Icon: DollarSign,    cor: "#1e3a5f" },
]

export default function EssenciaisApui() {
  const nav = useNavigate()
  return (
    <div style={{ padding: "32px", fontFamily: "Inter,sans-serif", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 26, fontWeight: 800, color: BRAND }}>Módulos Essenciais — Apuí/AM</div>
        <div style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
          Seleção prioritária para município de pequeno porte — 24 mil habitantes · Amazônia · Garimpo · Ribeirinho
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
        {MODULOS.map(({ label, sub, path, Icon, cor }) => (
          <button
            key={path}
            onClick={() => nav(path)}
            style={{
              background: "#fff",
              border: `1px solid #e5e7eb`,
              borderRadius: 12,
              padding: "20px 18px",
              textAlign: "left",
              cursor: "pointer",
              transition: "box-shadow .15s",
              borderTop: `4px solid ${cor}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.10)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
          >
            <Icon size={26} color={cor} />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: BRAND }}>{label}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>{sub}</div>
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 40, padding: "16px 20px", background: "#eff6ff", borderRadius: 10, fontSize: 12, color: "#1e40af" }}>
        <b>Outros módulos disponíveis</b> — use o menu lateral para acessar vigilância sanitária, saúde mental, gestão hospitalar, saúde bucal e demais áreas quando necessário.
      </div>
    </div>
  )
}
