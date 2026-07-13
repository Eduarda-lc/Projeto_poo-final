from dominio.tarefa import Tarefa
from dominio.faturavel import Faturavel


'''Representa uma tarefa do tipo reunião.
Herda o comportamento comum da classe Tarefa e implementa a interface Faturavel para cálculo de custos.'''

class TarefaReuniao(Tarefa, Faturavel):
    def __init__(self, id_tarefa, titulo, responsavel, local, duracao,
                estado="pendente", dependencias=None):
        
        # Inicializa os atributos comuns da classe base.
        super().__init__(id_tarefa, titulo, responsavel, estado, dependencias)
        
        local = local.strip()
        
        # Validação do local da reunião.
        if not local:
            raise ValueError("O local é obrigatório.")
        
        # Validação da duração da reunião.
        if duracao <= 0:
            raise ValueError("A duração deve ser superior a zero.")
        
        self._local = local
        self._duracao = float(duracao)

#------------------------
#Devolve o local da reunião.
    @property
    def local(self): return self._local

#------------------------
#Devolve a duração da reunião.
    @property
    def duracao(self): return self._duracao

#------------------------
#Gera um resumo textual da tarefa.
    def resumo(self): return f"Reunião · {self.local} · {self.duracao:g}h"

#------------------------
#Identifica o tipo da tarefa.
    def tipo(self): return "reuniao"

#------------------------
#Calcula o custo da reunião com base na sua duração.
    def custo(self): return self.duracao * 15
