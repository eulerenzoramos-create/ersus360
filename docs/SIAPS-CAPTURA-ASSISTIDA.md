# Captura assistida — SIAPS área logada → ERSUS360 (eGestor)

Os resultados oficiais **por equipe** só existem na área logada do SIAPS (gov.br):
- **mensal** (monitoramento): Componente Qualidade → Visão por Competência — resultado, NM, DN e classificação;
- **quadrimestral** (avaliação para cofinanciamento): Avaliação do Quadrimestre — nota final, classificação,
  validade da equipe e, por indicador, peso, conceito, classificação, resultado, NM/DN e mês a mês
  (Componente II e III, todas as modalidades: eSF, eAP, eSB, eMulti, eSFR, eCR, eAPP).

O ERSUS360 **não** guarda nem usa o login/token do gestor: a leitura acontece no navegador onde o gestor já
está logado (navegador do app Claude) e só o resultado é entregue à tela **eGestor / SIAPS** (aba Componente
Qualidade abre sozinha com o resultado; a importação depende do clique em "Importar captura").

- Tarefa agendada no app Claude: "Captura SIAPS mensal" (dia 20, 08:00).
- Formato `ersus360-siaps-captura-v1` (+ bloco opcional `quadrimestral`) — `backend/services/siaps_captura.py`
  e `backend/services/siaps_quadrimestral.py`.
- Endpoints: `POST /api/siaps-publico/captura`; leitura em `/captura/indicadores`, `/captura/serie`,
  `/quadrimestral`, `/conferencia`, `/painel-geral`.
- Classificação gravada = oficial. Valor republicado pelo MS (ex.: correção B1/B4 da eSB diferenciada, SIAPS
  2.1.2) guarda o anterior em `historico`; avaliação quadrimestral revisada vira nova versão (anterior preservada).

## Passo a passo (o que a tarefa faz)

1. Abrir `https://siaps.saude.gov.br/componentes/qualidade/APS/110`. Se cair em `/publico`, o gestor não está
   logado: **parar** e pedir que ele entre com o gov.br (nunca digitar senha).
2. Rodar o **Script 1** (lê o mensal de janeiro até a última competência ativa do ano; faz os cliques sozinho, ~20 s).
3. Abrir `https://siaps.saude.gov.br/componentes/resultado-final`.
4. Rodar o **Script 2** com o endereço do ERSUS360 (lê o quadrimestral de todos os quadrimestres publicados
   + o seguinte, todas as modalidades — ~3 min — e abre a tela eGestor com o resultado).
5. Conferir "Recebido do SIAPS: N linhas" e clicar **Importar captura**.

### Script 1 — mensal (página Componente Qualidade do SIAPS)

```js
(async () => {
  const B = "https://apisiaps.saude.gov.br/api/public/";
  const ativas = (await fetch(B + "filtros/competencias/ativas").then(r => r.json()))
    .filter(c => !c.quadrimestre && c.nuCompetencia >= `${new Date().getFullYear()}01`).map(c => c.nuCompetencia).sort();
  const fila = [
    { sg: ["eAP", "eSF"], ind: [104, 105, 106, 107, 108, 109, 110] }, { sg: ["eSB"], ind: [111, 112, 113, 114, 115, 116] },
    { sg: ["eMulti"], ind: [117, 118] }, { sg: ["eSFR"], ind: [131, 132, 133, 134, 135, 136] },
    { sg: ["eCR"], ind: [121, 122, 123, 124] }, { sg: ["eAPP"], ind: [125, 126, 127, 128, 129, 130] },
  ];
  const res = [];
  const proto = XMLHttpRequest.prototype;
  proto.__oo = proto.__oo || proto.open;
  proto.open = function (m, u, ...r) {
    if (String(u).includes("/componente/qualidade/visao-competencia") && fila.length) {
      const a = fila.shift(), url = new URL(u);
      url.searchParams.set("size", "500"); url.searchParams.set("page", "0");
      ["competencias", "sgEquipes", "indicadores"].forEach(k => url.searchParams.delete(k));
      ativas.forEach(c => url.searchParams.append("competencias", c));
      a.sg.forEach(s => url.searchParams.append("sgEquipes", s));
      a.ind.forEach(i => url.searchParams.append("indicadores", String(i)));
      u = url.toString();
      this.addEventListener("load", () => res.push({ status: this.status, json: this.responseText }));
    }
    return proto.__oo.call(this, m, u, ...r);
  };
  const botao = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Aplicar filtro");
  while (fila.length) { botao.click(); await new Promise(r => setTimeout(r, 3500)); }
  await new Promise(r => setTimeout(r, 2000));
  const linhas = [];
  for (const r of res) {
    if (r.status !== 200) continue;
    for (const c of (JSON.parse(r.json).content || [])) for (const e of c.equipes) for (const i of e.indicadores)
      linhas.push([c.competencia, e.coCnes, e.noUnidade, e.coEquipe, e.noEquipe, e.sgEquipe, i.noIndicador,
                   i.score, i.numerador, i.denominador, i.scoreClassificacao]);
  }
  sessionStorage.setItem("ersus360_mensal", JSON.stringify(linhas));
  return `${linhas.length} linhas mensais (${ativas.join(",")}); ${res.length} consultas`;
})()
```

### Script 2 — quadrimestral + entrega (página Avaliação do Quadrimestre do SIAPS)

Trocar `ERSUS` pelo endereço do ERSUS360 (produção: `https://ersus360.vercel.app`).

```js
(async () => {
  const ERSUS = "https://ersus360.vercel.app";
  const B = "https://apisiaps.saude.gov.br/api/public/";
  const pub = (await fetch(B + "filtros/competencias").then(r => r.json())).filter(c => c.quadrimestre).map(c => c.nuCompetencia).sort();
  const ult = pub[pub.length - 1], [a, n] = ult.split("Q").map(Number);
  const quads = [...pub, n === 3 ? `${a + 1}Q1` : `${a}Q${n + 1}`];          // publicados + o seguinte (preliminar)
  const alvos = [];
  for (const q of quads) {
    for (const sg of ["eSF", "eAP"]) alvos.push([q, sg, 119]);
    for (const sg of ["eSF", "eAP", "eSB", "eMulti", "eSFR", "eCR", "eAPP"]) alvos.push([q, sg, 120]);
  }
  const fila = [...alvos], res = [];
  const proto = XMLHttpRequest.prototype;
  proto.__oo = proto.__oo || proto.open;
  proto.open = function (m, u, ...r) {
    if (/componente\/indicador-quadrimestre\?/.test(String(u)) && fila.length) {
      const [q, sg, ind] = fila.shift(), url = new URL(u);
      url.searchParams.set("nuQuadrimestre", q); url.searchParams.set("sgEquipe", sg);
      url.searchParams.set("coTipoIndicador", String(ind)); url.searchParams.set("size", "200"); url.searchParams.set("page", "0");
      u = url.toString();
      this.addEventListener("load", () => res.push({ status: this.status, json: this.responseText }));
    }
    return proto.__oo.call(this, m, u, ...r);
  };
  const botao = [...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Aplicar Filtros");
  while (fila.length) { botao.click(); await new Promise(r => setTimeout(r, 3500)); }
  await new Promise(r => setTimeout(r, 2500));
  const quadrimestral = [];
  for (const r of res) {
    if (r.status !== 200) continue;
    for (const e of (JSON.parse(r.json).content || []))
      quadrimestral.push({ quadrimestre: e.nuQuadrimestre, componente: e.coTipoIndicador, sg_equipe: e.sgEquipe,
        ine: e.coEquipe, equipe: e.noEquipe, cnes: e.coCnes, ubs: e.noUnidade, nota_final: e.vlNotaFinal,
        classificacao: e.dsClassificacaoFinal, equipe_valida: e.stEquipeValida, homologada: e.stEquipeHomologada,
        indicadores: e.dsComponenteIndicador });
  }
  const linhas = JSON.parse(sessionStorage.getItem("ersus360_mensal") || "[]");
  const pacote = { formato: "ersus360-siaps-captura-v1", fonte: "SIAPS área logada", municipio_ibge: "130014",
    capturado_em: new Date().toISOString(),
    colunas: ["competencia", "cnes", "ubs", "ine", "equipe", "sg_equipe", "indicador", "score", "numerador", "denominador", "classificacao"],
    linhas, quadrimestral };
  setTimeout(() => { location.href = ERSUS + "/siaps#captura-siaps=" + encodeURIComponent(JSON.stringify(pacote)); }, 300);
  return `${linhas.length} linhas mensais + ${quadrimestral.length} avaliações quadrimestrais (${quads.join(",")})`;
})()
```

Conferido em 17/10/2026 (Apuí): mensal Mai–Jul/26 = 381 linhas (Ago/26 ainda sem dados); quadrimestral Q1/26:
eSF 9, eSB 9, eMulti 1, eSFR 1 (AREAL nota 8 = Ótimo; pesos R1–R6 = NT 12/2026); Vínculo Q2/26 preliminar já
disponível na área logada.
