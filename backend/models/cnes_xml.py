"""
Importações do XML-CNES para o e-SUS APS (SISAB → "Gerador de Arquivo XML-CNES").

Cada upload vira um retrato do CNES do município naquela data: estabelecimentos,
equipes (INE) e lotações dos profissionais. Guardamos só o necessário para
conferir a composição das equipes — CPF, data de nascimento, sexo, endereço,
telefone, e-mail e registro de conselho do profissional são descartados na
leitura (LGPD: minimização).
"""
from __future__ import annotations

from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text

from database import Base


class CnesXmlImportacao(Base):
    __tablename__ = "cnes_xml_importacoes"

    id             = Column(Integer, primary_key=True, autoincrement=True)
    municipio_id   = Column(Integer, ForeignKey("municipios.id"), nullable=False, index=True)
    municipio_ibge = Column(String(7), nullable=False)
    data_arquivo   = Column(String(10), nullable=True)      # IDENTIFICACAO/@DATA (AAAA-MM-DD)
    versao_xsd     = Column(String(10), nullable=True)
    arquivo_nome   = Column(String(255), nullable=True)
    totais         = Column(Text, nullable=False)           # JSON {estabelecimentos, equipes, profissionais, lotacoes}
    dados          = Column(Text, nullable=False)           # JSON {estabelecimentos, equipes, profissionais} minimizado
    importado_por  = Column(String(200), nullable=True)
    importado_em   = Column(DateTime, default=datetime.utcnow, nullable=False)
