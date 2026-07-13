from dominio.tarefa import Tarefa


class Projeto:

    def __init__(self, nome: str):
        nome = nome.strip()

        if not nome:
            raise ValueError("O nome do projeto é obrigatório.")

        self._nome = nome
        self._tarefas: list[Tarefa] = []

    @property
    def nome(self) -> str:
        return self._nome

    @property
    def tarefas(self) -> list[Tarefa]:
        return list(self._tarefas)

    def adicionar_tarefa(self, tarefa: Tarefa) -> None:

        if any(
            tarefa_existente.id == tarefa.id
            for tarefa_existente in self._tarefas
        ):
            raise ValueError(
                f"Já existe uma tarefa com o ID {tarefa.id}."
            )

        self._tarefas.append(tarefa)

    def substituir_tarefas(
        self,
        tarefas: list[Tarefa]
    ) -> None:
        self._tarefas = list(tarefas)

    def procurar_tarefa(
        self,
        id_tarefa: int
    ) -> Tarefa:

        for tarefa in self._tarefas:

            if tarefa.id == id_tarefa:
                return tarefa

        raise ValueError("Tarefa não encontrada.")

    def remover_tarefa(
        self,
        id_tarefa: int
    ) -> None:

        tarefa = self.procurar_tarefa(id_tarefa)
        self._tarefas.remove(tarefa)

    def total_tarefas(self) -> int:
        return len(self._tarefas)

    def __str__(self) -> str:
        return (
            f"{self._nome} "
            f"({len(self._tarefas)} tarefas)"
        )