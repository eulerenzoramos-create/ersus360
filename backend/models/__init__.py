# Importar na ordem correta para evitar dependências circulares
from models.municipio import Municipio, ContaBancaria
from models.convenio import Convenio, BlocoPacto, SituacaoConvenio
from models.repasse import Repasse, TipoRepasse
from models.cronograma import Cronograma, SituacaoCronograma
from models.indicador import Indicador, SituacaoIndicador
from models.alerta import Alerta, SeveridadeAlerta
from models.portaria import Portaria, PortariaMunicipio
from models.execucao import (
    Empenho, Liquidacao, Pagamento, RestoPagar, AplicacaoFinanceira,
    SituacaoEmpenho, SituacaoResto,
)
from models.obra import Obra, ObraFoto, ObraCronograma, TipoEstabelecimento, TipoObra, StatusObra
from models.usuario import Usuario, AuditLog, Perfil, PERMISSOES
from models.documento import Documento
from models.emenda import Emenda, TipoEmenda, FaseEmenda, QuadrimestreEmenda
from models.pec_cadastro import (
    OrigemDado, EquipeSaude, ProfissionalSaude, Microarea, Domicilio, Cidadao,
)
from models.visita_domiciliar import (
    StatusFilaVisita, StatusLocalizacao, VisitaDomiciliar, VisitaTransmissao,
)
from models.extracao import (
    ExtracaoRegistro, DataRecord, SituacaoDado, MetodoExtracao, FonteSistema,
)
from models.inconsistencia import (
    Inconsistencia, GravidadeInconsistencia, SituacaoInconsistencia,
)
from models.credencial_municipio import CredencialMunicipio
from models.email_diario import EmailDiarioLog, StatusEnvio

__all__ = [
    # Municipio
    "Municipio", "ContaBancaria",
    # Convênios
    "Convenio", "BlocoPacto", "SituacaoConvenio",
    # Repasses
    "Repasse", "TipoRepasse",
    # Cronograma
    "Cronograma", "SituacaoCronograma",
    # Indicadores
    "Indicador", "SituacaoIndicador",
    # Alertas
    "Alerta", "SeveridadeAlerta",
    # Portarias
    "Portaria", "PortariaMunicipio",
    # Execução
    "Empenho", "Liquidacao", "Pagamento", "RestoPagar", "AplicacaoFinanceira",
    "SituacaoEmpenho", "SituacaoResto",
    # Obras
    "Obra", "ObraFoto", "ObraCronograma", "TipoEstabelecimento", "TipoObra", "StatusObra",
    # Usuários
    "Usuario", "AuditLog", "Perfil", "PERMISSOES",
    # Documentos
    "Documento",
    # Emendas
    "Emenda", "TipoEmenda", "FaseEmenda", "QuadrimestreEmenda",
    # Cadastros PEC (cache local — ver docs/DOC-PEC-INTEGRACAO.md)
    "OrigemDado", "EquipeSaude", "ProfissionalSaude", "Microarea", "Domicilio", "Cidadao",
    # Visitas domiciliares / fila LEDI
    "StatusFilaVisita", "StatusLocalizacao", "VisitaDomiciliar", "VisitaTransmissao",
    # Proveniência e rastreabilidade (missão ERSUS 360)
    "ExtracaoRegistro", "DataRecord", "SituacaoDado", "MetodoExtracao", "FonteSistema",
    # Inconsistências
    "Inconsistencia", "GravidadeInconsistencia", "SituacaoInconsistencia",
    # Credenciais por município
    "CredencialMunicipio",
]

from models.transferencia_fns import TransferenciaFns, ColetaFns
from models.investsus import (
    Parlamentar, ProgramaInvestSUS, PropostaInvestSUS, HistoricoSituacao,
    UnidadeBeneficiada, PlanoTrabalho, AcaoServico, NaturezaDespesa,
    Parecer, PagamentoInvestSUS, AlertaInvestSUS, DocumentoInvestSUS,
    AtualizacaoManual, SnapshotInvestSUS,
)
