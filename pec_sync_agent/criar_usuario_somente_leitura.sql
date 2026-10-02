-- ERSUS360 Sync Agent — usuario PostgreSQL de ACESSO MINIMO e SOMENTE LEITURA
-- Executar no banco do e-SUS PEC por quem administra o servidor (superusuario),
-- por exemplo:   psql -h localhost -p 5433 -U postgres -d esus -f criar_usuario_somente_leitura.sql
--
-- A SENHA NAO FICA NESTE ARQUIVO. Depois de executar, defina-a direto no psql:
--     \password ersus_sync
-- e informe-a apenas no configurar.bat do servidor (nunca por e-mail/mensagem/chamado).
--
-- Principios (LGPD): so as tabelas/colunas que o agente le; nas tabelas que tem
-- nome/CPF/telefone do cidadao o acesso e POR COLUNA (so o necessario para juntar
-- e calcular). O agente envia ao ERSUS360 apenas percentuais agregados por equipe.
-- Se o nome do banco nao for "esus", ajuste a linha GRANT CONNECT.

CREATE ROLE ersus_sync LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT CONNECTION LIMIT 2;

-- Defesa em profundidade: toda sessao deste usuario e somente leitura e tem teto de tempo.
ALTER ROLE ersus_sync SET default_transaction_read_only = on;
ALTER ROLE ersus_sync SET statement_timeout = '120s';

GRANT CONNECT ON DATABASE esus TO ersus_sync;
GRANT USAGE ON SCHEMA public TO ersus_sync;

-- Tabelas de referencia (sem dados de paciente): leitura completa.
GRANT SELECT ON
    tb_dim_cbo, tb_dim_ciap, tb_dim_equipe, tb_dim_procedimento, tb_dim_sexo,
    tb_dim_situacao_problema, tb_dim_tempo, tb_dim_tipo_atendimento,
    tb_dim_imunobiologico, tb_dim_dose_imunobiologico
TO ersus_sync;

-- Equipes.
GRANT SELECT (co_seq_equipe, nu_ine, no_equipe, tp_equipe, st_ativo) ON tb_equipe TO ersus_sync;

-- Cidadao: SEM nome, CPF, telefone ou endereco. Apenas o necessario para o calculo.
GRANT SELECT (co_cidadao, nu_cns, co_dim_tempo_nascimento, co_dim_sexo, st_faleceu, st_deletar,
              co_dim_equipe_vinc) ON tb_fat_cidadao_pec TO ersus_sync;
GRANT SELECT (co_seq_prontuario, co_cidadao) ON tb_prontuario TO ersus_sync;

-- Atendimentos, problemas, procedimentos e visitas (colunas usadas pelos indicadores).
GRANT SELECT (nu_cns, dt_inicial_atendimento, nu_pressao_sistolica, nu_peso, nu_altura,
              co_dim_tipo_atendimento, co_dim_cbo_1, co_dim_cbo_2)
    ON tb_fat_atendimento_individual TO ersus_sync;
GRANT SELECT (nu_cns, co_dim_ciap, co_dim_situacao_problema, co_dim_equipe_1, co_dim_equipe_2)
    ON tb_fat_atd_ind_problemas TO ersus_sync;
GRANT SELECT (nu_cns, co_dim_procedimento_solicitado, co_dim_procedimento_avaliado, dt_inicial_atendimento)
    ON tb_fat_atd_ind_procedimentos TO ersus_sync;
GRANT SELECT (nu_cns, co_dim_cbo, co_dim_tempo) ON tb_fat_visita_domiciliar TO ersus_sync;

-- Vacinacao (C2, boa pratica E): so cartao SNS, data e imunobiologico/dose aplicados.
GRANT SELECT (nu_cns, dt_inicial_atendimento) ON tb_fat_vacinacao TO ersus_sync;
GRANT SELECT (co_fat_vacinacao, co_dim_imunobiologico, co_dim_dose_imunobiologico)
    ON tb_fat_vacinacao_vacina TO ersus_sync;

-- Pre-natal e exames.
GRANT SELECT (co_prontuario, dt_ultima_menstruacao) ON tb_pre_natal TO ersus_sync;
GRANT SELECT (co_seq_exame_requisitado, co_prontuario, co_requisicao_exame,
              dt_realizacao, dt_resultado, dt_solicitacao) ON tb_exame_requisitado TO ersus_sync;
GRANT SELECT (co_exame_requisitado) ON tb_exame_hemoglobina_glicada TO ersus_sync;
GRANT SELECT (co_requisicao_exame) ON tb_sol_exame_citopatologico TO ersus_sync;

-- Para REVOGAR/REMOVER no futuro (plano de interrupcao do documento de autorizacao):
--   REASSIGN OWNED BY ersus_sync TO postgres;  DROP OWNED BY ersus_sync;  DROP ROLE ersus_sync;
