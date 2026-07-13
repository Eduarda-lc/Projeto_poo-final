from dominio.tarefa import Tarefa

''''Representa um projeto composto por várias tarefas.
Esta classe é responsável por agregar, organizar e gerir as tarefas associadas a um determinado projeto.'''

class Projeto:

    def __init__(self, nome: str):
        # Remove espaços desnecessários antes da validação.
        nome = nome.strip()

        # Garante que o projeto possui um nome válido.
        if not nome:
            raise ValueError("O nome do projeto é obrigatório.")

        self._nome = nome
        self._tarefas: list[Tarefa] = []

    @property
    def nome(self) -> str:
        #Devolve o nome do projeto.
        return self._nome

    @property
    def tarefas(self) -> list[Tarefa]:
        #Devolve uma cópia da lista de tarefas, protegendo a coleção interna do projeto.
        return list(self._tarefas)

#------------------------
#Adiciona uma nova tarefa ao projeto e garante que não haja ID's duplicados.

    def adicionar_tarefa(self, tarefa: Tarefa) -> None:

        if any(
            tarefa_existente.id == tarefa.id
            for tarefa_existente in self._tarefas
        ):
            raise ValueError(
                f"Já existe uma tarefa com o ID {tarefa.id}."
            )

        self._tarefas.append(tarefa)

#------------------------
# Substitui a lista de tarefas do projeto por uma nova lista fornecida

    def substituir_tarefas(
        self,
        tarefas: list[Tarefa]
    ) -> None:
        self._tarefas = list(tarefas)

#------------------------
#Procura uma tarefa através do seu identificador.

    def procurar_tarefa(
        self,
        id_tarefa: int
    ) -> Tarefa:

        for tarefa in self._tarefas:

            if tarefa.id == id_tarefa:
                return tarefa

        raise ValueError("Tarefa não encontrada.")

#------------------------
#Remove uma tarefa do projeto.
    def remover_tarefa(
        self,
        id_tarefa: int
    ) -> None:

        tarefa = self.procurar_tarefa(id_tarefa)
        self._tarefas.remove(tarefa)

#------------------------
#Devolve o número total de tarefas do projeto.
    def total_tarefas(self) -> int:
        return len(self._tarefas)

#------------------------
#Representação textual do projeto
    def __str__(self) -> str:
        return (
            f"{self._nome} "
            f"({len(self._tarefas)} tarefas)"
        )