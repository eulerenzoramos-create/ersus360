# Captura assistida — SIAPS área logada → ERSUS360

Resultados oficiais **por equipe** do Componente Qualidade (pontuação, NM, DN e a classificação
do Ministério) só existem na área logada do SIAPS (gov.br). O ERSUS360 **não** guarda nem usa o
login/token do gestor: a leitura é feita no navegador onde o gestor já está logado (navegador do
app Claude), e só o resultado é entregue ao ERSUS360 em **Relatórios do SIAPS → Captura assistida**.

- Tarefa agendada no app Claude: "Captura SIAPS mensal" (dia 20, 08:00).
- Formato: `ersus360-siaps-captura-v1` — ver `backend/services/siaps_captura.py`.
- Endpoint: `POST /api/siaps-publico/captura` (perfil com edição; auditado `SIAPS_CAPTURA_IMPORTADA`).
- A classificação gravada é a oficial; o motor de indicadores não sobrescreve essas linhas.

## Passo a passo (o que a tarefa faz)

1. Abrir `https://siaps.saude.gov.br/componentes/qualidade/APS/110`. Se cair em `/publico`, o
   gestor não está logado: **parar** e pedir que ele entre com o gov.br (nunca digitar senha).
2. Rodar o **Script 1** na página (prepara a leitura das 4 últimas competências ativas).
3. Clicar **4 vezes** em "Aplicar filtro" (aguardar ~5 s entre os cliques). Cada clique é uma
   consulta normal da própria tela do SIAPS, feita com a sessão do gestor.
4. Rodar o **Script 2** com o endereço do ERSUS360: a página "Relatórios do SIAPS" abre com o
   resultado preenchido (vai depois do `#`, não passa por servidor).
5. Conferir a mensagem "Recebido do SIAPS: N linhas" e clicar **Importar captura**.

### Script 1 — preparar a leitura (página do SIAPS)

```js
(async () => {
  const B = "https://apisiaps.saude.gov.br/api/public/";
  const ativas = (await fetch(B + "filtros/competencias/ativas").then(r => r.json()))
    .filter(c => !c.quadrimestre).map(c => c.nuCompetencia).sort().slice(-4);
  window.__alvos = [
    { competencias: ativas, sg: ["eAP", "eSF"], ind: [104, 105, 106, 107, 108, 109, 110] },
    { competencias: ativas, sg: ["eSB"], ind: [111, 112, 113, 114, 115, 116] },
    { competencias: ativas, sg: ["eMulti"], ind: [117, 118] },
    { competencias: ativas, sg: ["eSFR"], ind: [131, 132, 133, 134, 135, 136] },
  ];
  window.__res = [];
  const proto = XMLHttpRequest.prototype;
  proto.__oo = proto.__oo || proto.open;
  proto.open = function (m, u, ...r) {
    if (String(u).includes("/componente/qualidade/visao-competencia") && window.__alvos.length) {
      const a = window.__alvos.shift(), url = new URL(u);
      url.searchParams.set("size", "500"); url.searchParams.set("page", "0");
      ["competencias", "sgEquipes", "indicadores"].forEach(k => url.searchParams.delete(k));
      a.competencias.forEach(c => url.searchParams.append("competencias", c));
      a.sg.forEach(s => url.searchParams.append("sgEquipes", s));
      a.ind.forEach(i => url.searchParams.append("indicadores", String(i)));
      u = url.toString();
      this.addEventListener("load", () => window.__res.push({ alvo: a, status: this.status, json: this.responseText }));
    }
    return proto.__oo.call(this, m, u, ...r);
  };
  return "preparado: " + ativas.join(",");
})()
```

### Script 2 — montar e entregar ao ERSUS360 (página do SIAPS, após os 4 cliques)

Trocar `ERSUS` pelo endereço do ERSUS360 (produção: `https://ersus360.vercel.app`).

```js
(() => {
  const ERSUS = "https://ersus360.vercel.app";
  const linhas = [];
  for (const r of window.__res) {
    if (r.status !== 200) continue;
    for (const c of (JSON.parse(r.json).content || []))
      for (const e of c.equipes)
        for (const i of e.indicadores)
          linhas.push([c.competencia, e.coCnes, e.noUnidade, e.coEquipe, e.noEquipe, e.sgEquipe,
                       i.noIndicador, i.score, i.numerador, i.denominador, i.scoreClassificacao]);
  }
  if (!linhas.length) return "nenhuma linha — confira os 4 cliques em Aplicar filtro";
  const pacote = { formato: "ersus360-siaps-captura-v1", fonte: "SIAPS área logada — Componente Qualidade",
    municipio_ibge: "130014", capturado_em: new Date().toISOString(),
    colunas: ["competencia", "cnes", "ubs", "ine", "equipe", "sg_equipe", "indicador", "score",
              "numerador", "denominador", "classificacao"], linhas };
  location.href = ERSUS + "/siaps-relatorios#captura-siaps=" + encodeURIComponent(JSON.stringify(pacote));
  return linhas.length + " linhas";
})()
```

Conferido em 17/10/2026 (Apuí): 381 linhas — eSF 9×7, eSB 9–10×6, eMulti 1×2, eSFR 1×6, Mai–Jul/26
(Ago/26 ainda sem dados). Ex.: KENNEDY, Mais Acesso, Mai/26 = 70,89 → **REGULAR** (acima de 70).
