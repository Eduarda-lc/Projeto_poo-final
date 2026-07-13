"""
Camada de REPOSITÓRIO — a INTERFACE (o contrato de persistência).

Pilar de POO: ABSTRAÇÃO / INTERFACE.

Esta classe não sabe NADA sobre ficheiros, bases de dados ou nuvem.
Só diz "quem quiser guardar tarefas tem de saber fazer estas duas coisas:
guardar() e carregar()". Como o fazem é problema da implementação.

É por isto que o Serviço (a camada de cima) depende DESTA interface e não
de uma classe concreta: amanhã trocas o ficheiro por uma base de dados e
o Serviço nem dá por isso.
"""

from abc import ABC, abstractmethod
from dominio.tarefa import Tarefa


class IRepositorio(ABC):
    """Contrato: o que qualquer repositório de tarefas tem de saber fazer."""

    @abstractmethod
    def guardar(self, tarefas: list[Tarefa]) -> None:
        """Persistir a lista completa de tarefas."""
        ...

    @abstractmethod
    def carregar(self) -> list[Tarefa]:
        """Ler e reconstruir a lista de tarefas a partir da persistência."""
        ...
