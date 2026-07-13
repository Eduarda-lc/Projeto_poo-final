from dominio.tarefa import Tarefa
from dominio.faturavel import Faturavel


class TarefaReuniao(Tarefa, Faturavel):
    def __init__(self, id_tarefa, titulo, responsavel, local, duracao,
                 estado="pendente", dependencias=None):
        super().__init__(id_tarefa, titulo, responsavel, estado, dependencias)
        local = local.strip()
        if not local:
            raise ValueError("O local é obrigatório.")
        if duracao <= 0:
            raise ValueError("A duração deve ser superior a zero.")
        self._local = local
        self._duracao = float(duracao)

    @property
    def local(self): return self._local

    @property
    def duracao(self): return self._duracao

    def resumo(self): return f"Reunião · {self.local} · {self.duracao:g}h"

    def tipo(self): return "reuniao"

    def custo(self): return self.duracao * 15
