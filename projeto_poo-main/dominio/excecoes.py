class TransicaoEstadoInvalida(ValueError):
    """Exceção lançada quando uma tarefa tenta realizar uma transição de estado não permitida."""


class DependenciaPendente(ValueError):
    """Exceção lançada quando uma tarefa tenta iniciar antes das dependências."""