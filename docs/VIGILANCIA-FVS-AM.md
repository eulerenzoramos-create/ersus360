# Vigilância em Saúde integrada à FVS-RCP/AM

Levantamento e implantação de 23/10/2026. Fonte: <https://www.fvs.am.gov.br/dadossaude>.

## 1. Diagnóstico da aba existente

As 15 subabas da VIGILÂNCIA EM SAÚDE foram mantidas sem alteração de conteúdo. Cada uma ganhou, acima da
tela que já existia, a seção recolhível **"Dados oficiais FVS-AM"** (`components/vigilancia/DadosOficiaisFvs.tsx`,
aplicada na rota em `App.tsx` por `<ComFvs id="…">`). A entrada da aba ganhou o **Painel de Vigilância (FVS-AM)**
(`/vigilancia-saude`), liberado para todos os municípios (`PAGINAS_MULTIMUNICIPIO`).

Antes desta etapa as telas da Vigilância usavam proxies do DATASUS ou mostravam "dado não disponível" (auditoria
da etapa 4, branch `feat/auditoria-vigilancia`, incorporada aqui).

## 2. Inventário da FVS

A página `/dadossaude` tem 19 cartões (`/ver_painel/{id}`). Por trás deles:

| Plataforma | Painéis | Dados extraíveis? |
|---|---|---|
| Tableau Public (perfil `astec.sass`, SASS/FVS-RCP) | PQA-VS, Doenças e agravos (SINAN), Malária, Hepatites, Tuberculose, HIV/aids, Sífilis, ISTs, Mortalidade feminina, Mortalidade prematura DCNT | A FVS deixou liberado o download da pasta de trabalho (.twbx) em quase todos |
| Power BI "Publicar na Web" | População negra, PES, TB preventivo, Esporotricose, Vírus respiratórios/SRAG, Mpox, Mortalidade infantil, Mortalidade materna, Nascimentos | Não — o Power BI público não oferece exportação |

O mesmo perfil Tableau tem pastas públicas fora da página: **AESOP** (alerta precoce de síndromes respiratórias,
CIEVS), **Vacinômetro AM** (COVID-19), Painel COVID-19 Resumo, Informe Inundação 2025, PES 2024.

Mecanismos usados (os mesmos oferecidos a qualquer visitante, sem login):

- `GET https://public.tableau.com/profile/api/workbook/{pasta}` → `lastUpdateDate` (quando a FVS republicou)
- `GET https://public.tableau.com/workbooks/{pasta}.twb` → pasta de trabalho com as extrações `.hyper`,
  lidas com a Tableau Hyper API. Só agregados por município/período são gravados.

## 3. Achado de proteção de dados (LGPD) — comunicar a FVS

Seis pastas públicas baixáveis trazem **dados pessoais identificados**: nome do paciente, nome da mãe, data de
nascimento, CNS, resultado de HIV, orientação sexual, número da notificação/DO:

`PainelHepatites`, `PainelTuberculose`, `Painel_AIDS_HIV`, `PainelSfilisFVSAM`, `PaineldeISTs`, `Painel-bitosdemulheres`.

O ERSUS360 **não baixa nem lê** essas pastas (`integracao = "bloqueado_lgpd"` no catálogo) e as incorpora sem
barra de ferramentas. Além disso, todo download passa por uma trava (`services/fvs_tableau.py`): se qualquer tabela
de qualquer extração tiver coluna identificadora, a leitura é recusada e os arquivos temporários são apagados — a
fonte fica com situação "Bloqueado (proteção de dados)".

Durante o levantamento as pastas foram baixadas uma vez para inspecionar a estrutura (só nomes de coluna) e
apagadas em seguida.

**Recomendação:** a Secretaria comunicar o Encarregado de Dados da FVS-RCP/AM para desativar o download dessas
pastas no Tableau Public (Configurações da pasta → "Permitir download"). Rascunho:

> Prezados, ao integrar os painéis públicos de dados da FVS-RCP/AM (fvs.am.gov.br/dadossaude) ao sistema de gestão
> municipal, identificamos que as pastas de trabalho do Tableau Public dos painéis de Hepatites Virais, Tuberculose,
> HIV/Aids, Sífilis, ISTs e Óbitos de Mulheres permitem o download completo, e as extrações incluem dados pessoais
> identificados (nome, nome da mãe, data de nascimento, CNS). Sugerimos desativar a opção "Permitir download" nessas
> pastas. Não armazenamos nem utilizamos esses arquivos. Ficamos à disposição.

## 4. Fontes extraídas e regras

| Coletor | Pasta | O que vira número no ERSUS360 | Regra (copiada do painel da FVS) |
|---|---|---|---|
| `pqa_vs` | PQA-VS-Indicadores | 14 indicadores por município: 2012–2023 (resultado, meta) e 2023+ (num., den., resultado, alcance) por ano/quadrimestre; população; Região de Saúde | Valores publicados, sem recálculo |
| `sinan` | monitoramentosinan | Notificações por doença/agravo × município × ano/mês/SE; recortes sexo, faixa etária, zona, raça/cor (últimos 5 anos) | "Casos = COUNT" de registros |
| `malaria` | Painel_Malria | Positivos por município provável de infecção × ano/mês/SE; espécie; sexo; IPA | RES_EXAM 2–11 e ID_LVC = 2, até a "Data de atualização"; IPA = positivos ÷ população da planilha × 1.000; classes do painel |
| `aesop` | Painel_AESOP | Avisos AESOP/APS/PIP, probabilidade de crescimento, SG na APS, SRAG, vírus GAL por SE | Publicado pelo CIEVS |
| `vacinometro` | Vacinometro_AM_2 | Doses COVID-19 por município × ano/mês/dose | Contagem de doses (série até 14/04/2025) |

Validação a cada execução: chaves duplicadas, repetições idênticas consolidadas, conflitos descartados (não
escolhemos qual número está certo), códigos fora do AM, municípios sem dado, registros com município ignorado.

Conferência feita: Apuí 2025 tem **223** casos de malária no SIVEP (por local de infecção) e **223** no SINAN da FVS.

### PQA-VS: definições mudaram em 2024

De 2024 em diante os indicadores seguem a Portaria GM/MS nº 6.878, de 17/04/2025 (cartilha PQA-VS). A pasta
pública não liga cada número à descrição nova; o ERSUS360 mostra a descrição só até 2023 e, depois, "Indicador NN"
com a meta publicada. Indicador com "ausência de casos" no período não entra na contagem de metas.

## 5. Mapeamento para as subabas

| Subaba | Dados FVS |
|---|---|
| Arboviroses / Dengue | SINAN: dengue, chikungunya, zika, febre amarela |
| Epidemiologia / SINAN | SINAN: todos os agravos; PQA-VS 06, 13, 14 |
| IST / HIV / Hepatites | SINAN: aids, sífilis congênita, hepatites; PQA-VS 11, 12; painéis oficiais (sem extração — LGPD) |
| Malária / Endemias | SIVEP-Malária (positivos, IPA, espécie, semanas); SINAN malária; PQA-VS 07 |
| Monitor Epidemiológico | AESOP/SRAG; SINAN imunopreveníveis; painéis Vírus Respiratórios, Mpox, COVID-19 |
| TB / Hanseníase | SINAN: tuberculose, hanseníase; PQA-VS 09, 10; painéis TB e TB preventivo |
| Zoonoses | SINAN: atendimento antirrábico, raiva, leptospirose, leishmaniose, animais peçonhentos, Chagas; painel Esporotricose |
| Vacinas / SIPNI | Vacinômetro COVID-19; PQA-VS 03, 04 |
| SIM / SINASC | PQA-VS 01, 02; painéis de mortalidade materna, infantil, feminina, DCNT, nascimentos |
| Controle de Vetores | PQA-VS 08 |
| VigiÁgua | PQA-VS 05 |
| CCIH, Rastreio de Câncer, SISVAN, Vigilância Sanitária | A FVS não publica painel em /dadossaude — telas seguem com as fontes que já tinham |

## 6. Painel, alertas, mapa, relatórios e Agente IA

- **Alertas oficiais**: aviso AESOP/APS/PIP; PQA-VS abaixo da meta (alcance publicado).
- **Alertas calculados** (critérios em `fvs_analise.CRITERIOS`, ajustáveis por parâmetro): acumulado do ano × mesmo
  período (≥ 50% e ≥ 5 casos), últimas 4 SE × 4 anteriores (≥ 100%), mudança de classe de IPA. Rotulados como
  sinal para investigação, nunca como surto confirmado.
- **Mapa**: malha municipal do IBGE (API de malhas v3) desenhada em SVG; casos, taxa por 100 mil, variação.
- **Relatórios**: 8 tipos em PDF, Excel e Word; fontes com data, limitações; análise de IA opcional e separada.
- **Agente IA** (`services/fvs_ia.py`): Claude com ferramentas que só leem a série integrada; resposta separa
  "Dados oficiais" de "Análise da IA".
- **Integrações**: situação de cada fonte, histórico de execuções, atualização manual (perfis admin/gestor).
  Rotina automática às 07:10 e 14:10 (Manaus); só baixa de novo quando a FVS republica.

## 7. Limitações conhecidas

- A base SINAN pública traz notificações, não confirmados/descartados/em investigação nem óbitos.
- Unidade de saúde não vem nas extrações públicas usadas.
- Dados Power BI (mortalidade, nascimentos, SRAG detalhado, Mpox, esporotricose, PES, TB preventivo, população negra)
  só como painel oficial incorporado.
- O município do SINAN é o código informado pela FVS na base (registros com código 130000 — município ignorado — ficam
  fora das contagens municipais e aparecem na validação).
