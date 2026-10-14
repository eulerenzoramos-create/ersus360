/**
 * PageNavBar — barra padronizada de Voltar / Início / breadcrumb
 * Renderizada uma única vez no Layout (App.tsx), acima de toda página roteada.
 * Não duplica nada por página; lê o catálogo único de navegação (navItems.ts)
 * para montar o breadcrumb quando a rota atual (ou seu prefixo) está catalogada.
 */
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS, type NavItem } from "../lib/navItems";

function encontrarItem(pathname: string): NavItem | undefined {
  const exato = NAV_ITEMS.find(i => i.route === pathname);
  if (exato) return exato;
  const porPrefixo = NAV_ITEMS
    .filter(i => i.route !== "/" && pathname.startsWith(i.route))
    .sort((a, b) => b.route.length - a.route.length);
  return porPrefixo[0];
}

function primeiraRota(filtro: (i: NavItem) => boolean): string | undefined {
  return NAV_ITEMS.find(filtro)?.route;
}

const linkStyle = { color: "#64748b", textDecoration: "none" } as const;
const crumbSep = <ChevronRight size={12} color="#cbd5e1" />;

export default function PageNavBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  if (pathname === "/") return null;

  const item = encontrarItem(pathname);
  const rotaCategoria = item ? primeiraRota(i => i.category === item.category) : undefined;
  const rotaSubcategoria = item?.subcategory
    ? primeiraRota(i => i.category === item.category && i.subcategory === item.subcategory)
    : undefined;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
      padding: "8px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, minWidth: 0, overflow: "hidden" }}>
        <Link to="/" style={{ ...linkStyle, color: "#1d4ed8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
          <Home size={13} /> Início
        </Link>

        {item && (
          <>
            {crumbSep}
            {rotaCategoria ? (
              <Link to={rotaCategoria} style={linkStyle}>{item.category}</Link>
            ) : (
              <span style={{ color: "#94a3b8" }}>{item.category}</span>
            )}
          </>
        )}

        {item?.subcategory && (
          <>
            {crumbSep}
            {rotaSubcategoria ? (
              <Link to={rotaSubcategoria} style={linkStyle}>{item.subcategory}</Link>
            ) : (
              <span style={{ color: "#94a3b8" }}>{item.subcategory}</span>
            )}
          </>
        )}

        {item && (
          <>
            {crumbSep}
            <span style={{ color: "#1e293b", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {item.title}
            </span>
          </>
        )}
      </div>

      <button onClick={() => navigate(-1)} style={{
        display: "flex", alignItems: "center", gap: 5, background: "#f1f5f9", border: "1px solid #e2e8f0",
        borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer",
      }}>
        <ChevronLeft size={13} /> Voltar
      </button>
    </div>
  );
}
