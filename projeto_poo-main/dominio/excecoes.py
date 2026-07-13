class TransicaoEstadoInvalida(ValueError):
    """Lançada quando se tenta saltar ou recuar na máquina de estados."""


class DependenciaPendente(ValueError):
    """Lançada quando uma tarefa tenta iniciar antes das dependências."""
