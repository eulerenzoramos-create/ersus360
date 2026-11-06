/**
 * ModuloSubabas — subabas internas de um painel principal
 * Ex.: Painel do ACS → Mapa de Visitas · Registrar Visita · Visitas Domiciliares;
 *      Painel de Vigilância (FVS-AM) → Arboviroses · CCIH · Vetores · Epidemiologia · IST/HIV · Malária.
 * As telas continuam com as próprias rotas; esta barra só liga o painel às telas-filhas
 * (definidas por `parent` em navItems.ts). Respeita perfil e telas liberadas ao município.
 */
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../App";
import { NAV_ITEMS, itemAllowed, subabasDe, type NavItem } from "../lib/navItems";
import { paginaDisponivel } from "../lib/municipio";
import { getIcon } from "./Sidebar";

function itemDaRota(pathname: string): NavItem | undefined {
  return NAV_ITEMS
    .filter(i => pathname === i.route || pathname.startsWith(i.route + "/"))
    .sort((a, b) => b.route.length - a.route.length)[0];
}

export default function ModuloSubabas() {
  const { pathname } = useLocation();
  const auth = useAuth();
  const atual = itemDaRota(pathname);
  if (!atual) return null;

  const paiId = atual.parent ?? atual.id;
  const pai = NAV_ITEMS.find(i => i.id === paiId);
  if (!pai) return null;

  const ibge = auth.municipio_ibge ?? "";
  const pode = (i: NavItem) => itemAllowed(i, auth.perfil) && paginaDisponivel(i.route, ibge);
  const filhas = subabasDe(paiId).filter(pode);
  if (filhas.length === 0 || !pode(pai)) return null;

  const abas = [pai, ...filhas];

  return (
    <nav aria-label={`Subabas — ${pai.shortTitle ?? pai.title}`} style={{
      display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center",
      padding: "8px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0",
    }}>
      {abas.map(item => {
        const Icon = getIcon(item.iconName);
        const ativo = item.id === atual.id;
        const rotulo = item.shortTitle ?? item.title;
        return (
          <Link
            key={item.id}
            to={item.route}
            aria-current={ativo ? "page" : undefined}
            title={item.description}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20, fontSize: 12.5,
              fontWeight: ativo ? 700 : 600, textDecoration: "none", whiteSpace: "nowrap",
              color: ativo ? "#fff" : "#1e3a5f",
              background: ativo ? "#1d4ed8" : "#e8eef7",
              border: `1px solid ${ativo ? "#1d4ed8" : "#d6e0ee"}`,
            }}
          >
            <Icon size={13} />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
