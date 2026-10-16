"""Cadastro do município pelo administrador-geral: CNPJ validado e formatado."""
import pytest
from fastapi import HTTPException

from routers.admin_geral import _cnpj_formatado


def test_cnpj_so_digitos_e_formatado():
    assert _cnpj_formatado("cnpj_fundo", "12834320000126") == "12.834.320/0001-26"
    assert _cnpj_formatado("cnpj_fundo", "12.834.320/0001-26") == "12.834.320/0001-26"


def test_cnpj_vazio_limpa_o_campo():
    assert _cnpj_formatado("cnpj_fundo", "") is None
    assert _cnpj_formatado("cnpj_fundo", None) is None


def test_cnpj_incompleto_e_recusado():
    with pytest.raises(HTTPException) as e:
        _cnpj_formatado("cnpj_fundo", "1283432")
    assert e.value.status_code == 422
