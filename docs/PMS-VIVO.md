# PMS Vivo — Gestão, Execução e Resultados do Plano Municipal de Saúde

Tela: `/pms-vivo` (menu "Planejamento e Prestação de Contas"). API: `/api/pms-vivo/*`. Multi-município, com auditoria.

## Entrega 1 — fases 1 a 3 (esta branch)

### PMS: cadastro, importação e versões
- O PMS do quadriênio é guardado com diretrizes, objetivos e metas.
- Cada meta tem um identificador próprio (`uid`), que continua o mesmo entre as versões, e o código do documento.
- Cada meta registra:
  - indicador e tipo do indicador (percentual, taxa, índice, absoluto acumulável ou não acumulável, sim/não);
  - unidade, polaridade e fórmula;
  - linha de base e meta quadrienal;
  - meta prevista para cada ano da vigência;
  - fonte e setor responsável.
- **Importação:** planilha Excel modelo (`GET /modelo.xlsx`).
  - A prévia aponta erros e avisos e não grava nada.
  - Célula ilegível fica vazia, nunca estimada.
  - Só a confirmação depois da revisão grava as metas.
- O PDF oficial do PMS fica anexado ao plano.
- **Versões:**
  - A versão aprovada (com a resolução do CMS) é a oficial e não pode ser editada.
  - Uma alteração vira "nova versão" (proposta), com os mesmos `uid`.
  - Quando a proposta é aprovada, a versão anterior passa a "substituído" e continua consultável.

### PAS e ações
- Uma PAS por exercício da vigência, sempre ligada a uma versão aprovada do PMS. Ela também é aprovada com a resolução do CMS.
- Cada ação registra:
  - código, descrição, produto/entrega e quantidade prevista;
  - prazo, setor e responsável (usuário do município);
  - recursos e fonte de financiamento;
  - indicador de acompanhamento e evidência esperada.
- Relação de N para N entre ações e metas (`pms_acao_meta`): uma ação pode servir a várias metas e uma meta pode ter várias ações. A tela do PMS mostra quantas ações cada meta tem.
- Com a PAS aprovada, código, descrição e quantidade ficam travados. A ação não é excluída: só pode ser cancelada.

### Execução — "não basta marcar uma caixa"
- O responsável informa a situação: em andamento, concluída, parcialmente executada, não executada ou cancelada.
- Junto com a situação, informa o percentual, a quantidade realizada, o resultado, a justificativa e a evidência.
- A informação fica **aguardando validação**. A situação oficial da ação só muda quando outra pessoa valida.
- Quem valida: Secretário, Planejamento, Coordenação ou administrador.
- Ninguém valida a própria atualização, nem o Secretário.
- Regras de preenchimento:
  - Concluída exige o resultado.
  - Parcial, não executada e cancelada exigem justificativa.
  - Validar uma conclusão exige que a evidência esperada esteja anexada.
  - Cancelamento só é validado pelo Secretário, pelo Planejamento ou pelo administrador.
- Devolução exige motivo, que aparece para o responsável.
- A tela separa a execução física da ação do cumprimento da meta e do desempenho do indicador. Os dois últimos ficam para a entrega 2.

### Minhas Ações
- Mostra as ações do usuário da sessão, com contadores:
  - atrasadas;
  - prazo em até 15 dias;
  - aguardando validação;
  - devolvidas;
  - evidências a apresentar.
- Cada ação mostra metas, prazo, entrega e evidência esperada.

### Perfis
Usa os perfis que já existem, sem criar perfil novo no banco:

| Papel | Perfil |
|---|---|
| Secretário | `gestor` |
| Coordenação de Planejamento | `planejamento` |
| Coordenadores | `coordenador` |
| Assessoria | `admin` / `auditoria` |
| Controle social / consulta | `conselho` / `consulta` (só leitura) |
| Executor | o usuário indicado na ação |

## Entrega 2 — fases 4 e 5
Serviço `services/pms_monitoramento.py`.

### Resultado das metas
- O resultado de cada ano é registrado na versão aprovada, sempre com fonte e competência, por Secretário, Planejamento ou Coordenação. Cada registro fica no histórico e na auditoria.
- **Cálculo por tipo de indicador:**

  | Tipo | Como é calculado |
  |---|---|
  | Acumulável | Soma dos anos, comparada à meta quadrienal |
  | Percentual, taxa, índice, absoluto não acumulável | Último resultado, sem soma entre anos |
  | Sim/não | Cumprido só se o resultado for igual à meta |
  | Tipo não informado | Sem acumulado nem tendência (aparece aviso) |

- Polaridade "quanto menor, melhor": cumprimento = meta ÷ resultado.
- **Situação da meta no ano:**
  - **Ano encerrado:** alcançada ou não alcançada. Sem resultado registrado = "Sem resultado", nunca "não alcançada".
  - **Ano corrente:** em risco quando o resultado está abaixo da meta ou há ação atrasada, não executada ou parcial; senão, em acompanhamento.
  - **Ano futuro:** prevista.
- **Tendência:** melhora, piora ou estável, comparando os dois últimos resultados e respeitando a polaridade.
- **Fonte automática:** só com correspondência exata. Hoje existe uma, `siops_pct_asps` (SIOPS, % aplicado em ações e serviços de saúde), que exige meta do tipo percentual. Se a fonte não traz dado, nada é gravado e aparece o motivo.

### Painel, Kanban, cronograma e alertas
- **Painel do gestor:**
  - metas: total, alcançadas, em risco, não alcançadas e sem resultado;
  - ações: concluídas, atrasadas, não executadas, parciais e aguardando validação;
  - resultados por diretriz;
  - responsáveis com pendências;
  - metas em risco.

  Filtros: ano, diretriz, objetivo, setor, responsável e situação. O ano é escolhido na barra da aba; diretriz, setor, responsável e situação, no próprio painel. Reprogramação aparece como "entrega 3".
- **Kanban:** colunas Não iniciadas, Em andamento, Atrasadas, Aguardando validação, Concluídas e Encerradas. Os cartões são só visualização: a situação oficial continua mudando apenas por validação.
- **Cronograma:** ações por mês do prazo, com responsável e setor.
- **Alertas:**
  - prazo em até 15 dias;
  - ação atrasada;
  - meta em risco;
  - sem atualização há mais de 30 dias;
  - evidência esperada ausente;
  - atualização devolvida;
  - validação pendente há mais de 5 dias;
  - meta sem tipo de indicador.

  A rotina `pms_vivo_alertas` (07:30, horário de Manaus) leva ações atrasadas e metas em risco para a central de alertas, sem duplicar.

### FCA (Fato, Causa, Ação corretiva)
- Só para meta não alcançada ou em risco, ou para ação não executada, parcial ou atrasada.
- A causa fica como **hipótese** até ser validada por outra pessoa. Se a causa for alterada, volta a ser hipótese.
- Registra responsável, prazo, evidência e situação da ação corretiva.
- A sugestão de hipóteses por IA não foi incluída: fica para quando houver uma integração de IA autorizada para este módulo.

### Banco
A migração idempotente `_migrar_pms_vivo` em `database.py` adiciona `pms_meta.fonte_automatica`. A tabela `pms_fca` é criada pelo `create_all`.

## Próximas entregas
- **Entrega 3 (fases 6 e 7):**
  - "Reprogramar para o Exercício Seguinte", com aprovação;
  - relatórios de apoio ao RDQA e ao RAG, em PDF e Excel;
  - reuniões mensais com pauta e decisões;
  - ligação com os problemas do Diagnóstico Situacional.
- **Fase 8:** carregar o PMS real de Apuí, que o usuário vai enviar, e validar os fluxos.

## Testes
`backend/tests/test_pms_vivo.py` cobre:
- a planilha: números, erros apontados sem correção automática e prévia;
- a importação, a aprovação e as versões;
- a PAS e as ações N:N;
- a execução, a validação, a devolução, o cancelamento e a proibição de autovalidação;
- Minhas Ações, o isolamento entre municípios e os perfis.

`backend/tests/test_pms_monitoramento.py` cobre:
- o cálculo por tipo de indicador e polaridade, o acumulado sem soma de percentual, a tendência e a situação (sem resultado não é fracasso);
- o resultado com fonte obrigatória;
- a fonte automática do SIOPS, com e sem dado;
- o painel com filtros, o Kanban, o cronograma e os alertas;
- a central de alertas sem duplicar;
- a FCA, com a causa como hipótese até validação por outra pessoa;
- o isolamento entre municípios.
