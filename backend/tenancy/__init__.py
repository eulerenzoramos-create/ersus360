"""Isolamento multi-tenant do ERSUS360 (um município = um tenant).

O município da sessão vem SEMPRE do token emitido no login (ou na troca
auditada de município) e é revalidado no banco a cada requisição.
Nenhum parâmetro enviado pelo cliente altera o município em uso.
"""
