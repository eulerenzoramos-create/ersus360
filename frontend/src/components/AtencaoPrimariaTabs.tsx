/**
 * AtencaoPrimariaTabs — barra de subabas do módulo Atenção Primária
 * Piloto do padrão "módulo → subabas": permite alternar entre as páginas do
 * módulo sem voltar ao menu lateral. Não altera rotas nem páginas existentes —
 * lê o catálogo único de navegação (navItems.ts) e apenas renderiza links.
 */
import { Link, useLocation } from "react-router-dom";
import { NAV_ITEMS } from "../lib/navItems";
import { getIcon } from "./Sidebar";

const CATEGORIA = "Atenção Primária à Saúde";

const ITENS = NAV_ITEMS.filter(i => i.category === CATEGORIA);

const SUBCATEGORIAS = Array.from(new Set(ITENS.map(i => i.subcategory ?? "")));

export default function AtencaoPrimariaTabs() {
  const { pathname } = useLocation();

  const subAtiva =
    SUBCATEGORIAS.find(sc => ITENS.some(i => i.subcategory === sc && i.route === pathname)) ??
    SUBCATEGORIAS[0];

  const itensDaSub = ITENS.filter(i => (i.subcategory ?? "") === subAtiva);

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Nível 1 — grupos do módulo */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
        {SUBCATEGORIAS.map(sc => {
          const itensSc = ITENS.filter(i => (i.subcategory ?? "") === sc);
          const ativo = sc === subAtiva;
          return (
            <Link
              key={sc}
              to={itensSc[0].route}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: "none",
                color: ativo ? "#fff" : "#1e3a5f",
                background: ativo ? "#1d4ed8" : "#e8eef7",
                border: `1px solid ${ativo ? "#1d4ed8" : "#d6e0ee"}`,
                whiteSpace: "nowrap",
              }}
            >
              {sc || CATEGORIA}
            </Link>
          );
        })}
      </div>

      {/* Nível 2 — páginas do grupo ativo */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {itensDaSub.map(item => {
          const Icon = getIcon(item.iconName);
          const ativo = item.route === pathname;
          return (
            <Link
              key={item.id}
              to={item.route}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: ativo ? 700 : 500,
                textDecoration: "none",
                color: ativo ? "#1d4ed8" : "#475569",
                background: ativo ? "#dbeafe" : "#f8fafc",
                border: `1px solid ${ativo ? "#93c5fd" : "#e2e8f0"}`,
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={13} />
              {item.title}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
