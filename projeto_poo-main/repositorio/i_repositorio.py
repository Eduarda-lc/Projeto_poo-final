from abc import ABC, abstractmethod
from dominio.tarefa import Tarefa

'''Interface responsável pela persistência de tarefas.
Define as operações que qualquer repositório deve implementar, independentemente da tecnologia utilizada.''' 

class IRepositorio(ABC):

#Guarda a lista de tarefas na fonte de dados.
    @abstractmethod
    def guardar(self, tarefas: list[Tarefa]) -> None:
        ...

#Carrega e reconstrói as tarefas previamente guardadas.
    @abstractmethod
    def carregar(self) -> list[Tarefa]:
        """Ler e reconstruir a lista de tarefas a partir da persistência."""
        ...
