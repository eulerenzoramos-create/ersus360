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

## Entrega 3 — fases 6 e 7
Serviços `services/pms_ciclo.py` e `services/pms_relatorios.py`.

### Reprogramar para o Exercício Seguinte
Vale para ação com situação oficial "não executada" ou "parcialmente executada".

1. **Proposta** (o responsável ou a coordenação):
   - motivo e se a ação continua necessária;
   - novo prazo, nova quantidade e ajuste de meta;
   - recursos, responsável e justificativa técnica.
2. **Decisão** (Secretário, Planejamento ou administrador, sempre outra pessoa): rejeitar exige parecer. Se a proposta diz que a ação não continua necessária, ela só pode ser rejeitada.
3. **Inclusão** na PAS do ano seguinte, que precisa estar em rascunho. As metas equivalentes são encontradas pelo `uid`, o que funciona também entre versões do PMS.

Regras:
- A ação original e a situação do ano anterior nunca são alteradas.
- Nenhum recurso é transferido.
- Uma PAS de destino já aprovada não recebe a ação: nesse caso vale o procedimento oficial de alteração da PAS.
- No último ano da vigência não há reprogramação: a continuidade vai para o próximo PMS.

### Apoio ao RDQA e ao RAG
- **Consolidação quadrimestral:**
  - ações realizadas (validadas no período) e ações pendentes (prazo até o fim do período);
  - metas e resultados;
  - dificuldades e providências (FCA);
  - recomendações.
- **Avaliação anual:**
  - ações previstas, executadas, parciais, não executadas e canceladas;
  - metas alcançadas e não alcançadas;
  - principais resultados e justificativas;
  - dificuldades, ações corretivas e reprogramações;
  - recomendações para a PAS seguinte.
- Os dois são relatórios de **apoio**: não substituem o RDQA nem o RAG oficiais do DGMP/DigiSUS.
- As recomendações são regras de procedimento aplicadas aos registros (por exemplo, "meta em risco sem FCA" ou "ação não executada sem reprogramação"). Nunca afirmam causas.

### Reuniões mensais
- A pauta é gerada no momento da criação e fica guardada como estava naquele dia. Ela traz:
  - metas em risco;
  - ações atrasadas;
  - pendências por responsável;
  - problemas que exigem decisão (validações pendentes e FCA vencidas);
  - reprogramações propostas;
  - providências da reunião anterior (decisões ainda pendentes).
- Na reunião registram-se participantes, ata e situação.
- Cada decisão tem responsável, prazo e situação. Para marcar como cumprida ou cancelada, é preciso uma observação.
- A pauta e o registro saem em PDF.

### Integração com o Diagnóstico Situacional
- Problemas do Diagnóstico (Com pendência ou Crítico) são vinculados a metas ou ações (`pms_diag_vinculo`).
- O cruzamento mostra:
  - problemas contemplados e problemas sem ação correspondente;
  - metas sem acompanhamento (sem ação na PAS do ano ou sem resultado);
  - ações sem resultado;
  - recomendações para a gestão avaliar.

### Relatórios (PDF e Excel)
- Execução da PAS
- Metas do PMS
- Pendências
- Por responsável
- Quadrimestral
- Anual
- Reprogramações
- Plano de ação 5W2H (a partir das ações corretivas da FCA; onde, como e quanto ficam "—" quando não informados)
- Pauta e registro de reunião

### Também nesta entrega
- O painel do gestor passa a contar as reprogramações propostas.
- Os alertas passam a incluir "reprogramação aguardando decisão".

## Próximas etapas
- **Fase 8:** carregar o PMS real de Apuí, que o usuário vai enviar, e validar os fluxos com os responsáveis.
- **Fora do escopo autorizado até agora:**
  - IA sugerindo hipóteses de causa na FCA;
  - envio de alertas por outros canais, como e-mail ou WhatsApp.

  Os dois dependem de integração autorizada.

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

`backend/tests/test_pms_ciclo.py` cobre:
- o período de cada quadrimestre;
- a reprogramação: proposta, decisão por outra pessoa, ação original preservada e inclusão na PAS de 2027 com as metas mapeadas;
- o RDQA e o RAG;
- as reuniões: pauta, decisões e providências da reunião anterior, e o PDF;
- o cruzamento com o Diagnóstico;
- os 8 relatórios em PDF e em Excel;
- o isolamento entre municípios.
