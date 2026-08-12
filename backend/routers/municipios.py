"""
Router: /api/municipios
Gerencia a carteira de municípios atendidos pela assessoria.

Regras de acesso:
  - Listar: qualquer usuário autenticado (vê apenas o próprio município se municipal)
  - Criar/editar: somente superadmin/admin da assessoria
  - Dados do município: inclui link para status das fontes de dados

Isolamento: usuário municipal só visualiza o próprio município.
"""
from fastapi import APIRouter

router = APIRouter(prefix="/api/municipios", tags=["Municípios"])


@router.get("/dashboard")
async def dashboard():
    return {
        "situacao_dado": "nao_disponivel",
        "dados": None,
        "nota": "Dados requerem integração com sistema de origem. Nenhum valor inventado.",
    }
