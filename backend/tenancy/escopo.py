"""Helpers para routers filtrarem pelo município da sessão."""
from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from routers.auth import UserOut, get_current_user
from tenancy.auditoria import registrar_auditoria


def exigir_municipio(current_user: Annotated[UserOut, Depends(get_current_user)]) -> UserOut:
    if current_user.municipio_id is None:
        raise HTTPException(status.HTTP_409_CONFLICT,
                            "MUNICIPIO_NAO_SELECIONADO: selecione um município para continuar")
    return current_user


SessaoMunicipal = Annotated[UserOut, Depends(exigir_municipio)]


async def garantir_do_municipio(
    db: AsyncSession, usuario: UserOut, registro, tabela: str, registro_id: int,
):
    """Retorna o registro se pertencer ao município da sessão.
    Registro inexistente ou de outro município → 404 idêntico (não revela existência);
    a tentativa cruzada é auditada."""
    if registro is None:
        raise HTTPException(404, "Registro não encontrado")
    if registro.municipio_id != usuario.municipio_id:
        await registrar_auditoria(db, "ACESSO_NEGADO", usuario=usuario, tabela=tabela,
                                  registro_id=registro_id,
                                  detalhe=f"REGISTRO_DE_OUTRO_MUNICIPIO dono={registro.municipio_id}")
        raise HTTPException(404, "Registro não encontrado")
    return registro
