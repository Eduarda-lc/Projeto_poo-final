from abc import ABC, abstractmethod
from dominio.colaborador import Colaborador
from dominio.exportavel import Exportavel
from dominio.excecoes import TransicaoEstadoInvalida, DependenciaPendente

# Estados válidos da máquina de estados das tarefas.
ESTADOS_VALIDOS = ("pendente", "em curso", "concluída")
TRANSICOES_VALIDAS = {
    "pendente": ("em curso",),
    "em curso": ("concluída",),
    "concluída": (),
}

'''Classe abstrata que representa uma tarefa genérica.
Contém os atributos e comportamentos comuns a todos os tipos de tarefas do sistema.'''

class Tarefa(Exportavel, ABC):

    def __init__(self, id_tarefa: int, titulo: str, responsavel: Colaborador,
                estado: str = "pendente", dependencias=None):
        
        # Validação do identificador da tarefa.
        if id_tarefa <= 0:
            raise ValueError("O ID deve ser positivo.")
        
        # Remove espaços em branco antes da validação.
        titulo = titulo.strip()
        
        #Validação do título.
        if not titulo:
            raise ValueError("O título é obrigatório.")
        
        # Garante que o responsável é um colaborador válido.
        if not isinstance(responsavel, Colaborador):
            raise TypeError("O responsável deve ser um objeto Colaborador.")
        
        # Validação do estado da tarefa.
        if estado not in ESTADOS_VALIDOS:
            raise ValueError("Estado inválido.")

        self._id = id_tarefa
        self._titulo = titulo
        self._responsavel = responsavel
        self._estado = estado
        self._dependencias = list(dependencias or [])

#------------------------
#Devolve o identificador da tarefa.
    @property
    def id(self) -> int: return self._id

#------------------------
#Devolve o título da tarefa.
    @property
    def titulo(self) -> str: return self._titulo

#------------------------
#Devolve o responsável pela tarefa.
    @property
    def responsavel(self) -> Colaborador: return self._responsavel

#------------------------
#Devolve o estado atual da tarefa.
    @property
    def estado(self) -> str: return self._estado

#------------------------
#Devolve uma cópia da lista de dependências.
    @property
    def dependencias(self) -> list:
        return list(self._dependencias)

#------------------------
#Adiciona uma dependência à tarefa.

    def adicionar_dependencia(self, tarefa: "Tarefa") -> None:
        
        ## Impede que uma tarefa dependa dela própria.
        if tarefa.id == self.id:
            raise ValueError("Uma tarefa não pode depender de si própria.")
        
        # Evita dependências repetidas.
        if all(d.id != tarefa.id for d in self._dependencias):
            self._dependencias.append(tarefa)

#------------------------
#Altera o estado da tarefa respeitando a máquina de estados.
#------------------------

    def mudar_estado(self, novo_estado: str) -> None:
        
        if novo_estado not in ESTADOS_VALIDOS:
            raise TransicaoEstadoInvalida(f"Estado inválido: {novo_estado}")
        
        if novo_estado == self._estado:
            return
        
        #Verifica se a transição é permitida.
        if novo_estado not in TRANSICOES_VALIDAS[self._estado]:
            raise TransicaoEstadoInvalida(
                f"Transição inválida: {self._estado} → {novo_estado}"
            )
        
        # Uma tarefa só pode iniciar quando todas as dependências estiverem concluídas.
        if novo_estado == "em curso" and any(
            d.estado != "concluída" for d in self._dependencias):
            
            #Mensagem de dependência pendente.
            raise DependenciaPendente(
                "A tarefa não pode iniciar: existem dependências por concluir."
            )
            
        self._estado = novo_estado

#-----------------------
#Produz um resumo específico do tipo de tarefa.
    @abstractmethod
    def resumo(self) -> str: ...

#-----------------------
#Identifica o tipo concreto da tarefa.
    @abstractmethod
    def tipo(self) -> str: ...

#-----------------------
#Gera uma representação detalhada da tarefa.
    def detalhe(self) -> str:
        return (f"[{self.id}] {self.titulo}\n"
                f"    Responsável: {self.responsavel}\n"
                f"    Estado: {self.estado}\n    {self.resumo()}")

#-----------------------
#Exporta os dados da tarefa para formato textual.
    def exportar(self) -> str:
        return f"{self.tipo()};{self.id};{self.titulo};{self.responsavel.nome};{self.estado}"
