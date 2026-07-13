from dominio.tarefa import Tarefa
from dominio.faturavel import Faturavel

'''Representa uma tarefa técnica associada ao desenvolvimento 
de software ou atividades de programação'''

class TarefaTecnica(Tarefa, Faturavel):

    def __init__(self, id_tarefa, titulo, responsavel, linguagem,
                estimativa_horas, estado="pendente", dependencias=None):
        
        # Inicializa os atributos comuns da classe base.
        super().__init__(id_tarefa, titulo, responsavel, estado, dependencias)
        
        linguagem = linguagem.strip()
        
        # Validação da linguagem utilizada na tarefa.
        if not linguagem:
            raise ValueError("A linguagem é obrigatória.")
        
        ## Validação da estimativa de horas.
        if estimativa_horas <= 0:
            raise ValueError("A estimativa deve ser superior a zero.")
        
        self._linguagem = linguagem
        self._estimativa_horas = float(estimativa_horas)

#------------------------
#Devolve a linguagem associada à tarefa técnica
    @property
    def linguagem(self): return self._linguagem

#------------------------
#Devolve a estimativa de horas da tarefa.
    @property
    def estimativa_horas(self): return self._estimativa_horas

#------------------------
#Gera uma descrição resumida da tarefa
    def resumo(self):
        return f"Técnica · {self.linguagem} · {self.estimativa_horas:g}h estimadas"

#------------------------
#Identifica o tipo da tarefa
    def tipo(self): return "tecnica"

#------------------------
#Calcula o custo estimado da tarefa técnica.
    def custo(self): return self.estimativa_horas * 25
