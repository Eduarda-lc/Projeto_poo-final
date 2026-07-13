from dominio.tarefa import Tarefa
from dominio.faturavel import Faturavel


class TarefaTecnica(Tarefa, Faturavel):
    """Subclasse concreta; demonstra herança, override e polimorfismo."""

    def __init__(self, id_tarefa, titulo, responsavel, linguagem,
                 estimativa_horas, estado="pendente", dependencias=None):
        super().__init__(id_tarefa, titulo, responsavel, estado, dependencias)
        linguagem = linguagem.strip()
        if not linguagem:
            raise ValueError("A linguagem é obrigatória.")
        if estimativa_horas <= 0:
            raise ValueError("A estimativa deve ser superior a zero.")
        self._linguagem = linguagem
        self._estimativa_horas = float(estimativa_horas)

    @property
    def linguagem(self): return self._linguagem

    @property
    def estimativa_horas(self): return self._estimativa_horas

    def resumo(self):
        return f"Técnica · {self.linguagem} · {self.estimativa_horas:g}h estimadas"

    def tipo(self): return "tecnica"

    def custo(self): return self.estimativa_horas * 25
