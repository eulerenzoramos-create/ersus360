"""Exceções da camada de integração PEC."""


class PecIntegracaoDesativadaError(Exception):
    """Levantada quando um serviço PEC é chamado com ESUS_INTEGRATION_ENABLED=false
    ou sem credenciais configuradas. Nunca é capturada para simular sucesso —
    o chamador deve tratá-la e expor o estado real (\"não configurado\") ao usuário.
    """

    def __init__(self, motivo: str = "Integração com o PEC e-SUS APS está desativada ou sem credenciais."):
        self.motivo = motivo
        super().__init__(motivo)


class PecRespostaInvalidaError(Exception):
    """Levantada quando o PEC responde, mas em formato inesperado (schema divergente do documentado)."""

    def __init__(self, motivo: str, corpo_resposta: str | None = None):
        self.motivo = motivo
        self.corpo_resposta = corpo_resposta
        super().__init__(motivo)
