from abc import ABC, abstractmethod
from dominio.colaborador import Colaborador
from dominio.exportavel import Exportavel
from dominio.excecoes import TransicaoEstadoInvalida, DependenciaPendente

ESTADOS_VALIDOS = ("pendente", "em curso", "concluída")
TRANSICOES_VALIDAS = {
    "pendente": ("em curso",),
    "em curso": ("concluída",),
    "concluída": (),
}


class Tarefa(Exportavel, ABC):
    """Classe base abstrata: concentra dados e regras comuns às tarefas."""

    def __init__(self, id_tarefa: int, titulo: str, responsavel: Colaborador,
                 estado: str = "pendente", dependencias=None):
        if id_tarefa <= 0:
            raise ValueError("O ID deve ser positivo.")
        titulo = titulo.strip()
        if not titulo:
            raise ValueError("O título é obrigatório.")
        if not isinstance(responsavel, Colaborador):
            raise TypeError("O responsável deve ser um objeto Colaborador.")
        if estado not in ESTADOS_VALIDOS:
            raise ValueError("Estado inválido.")

        self._id = id_tarefa
        self._titulo = titulo
        self._responsavel = responsavel
        self._estado = estado
        self._dependencias = list(dependencias or [])

    @property
    def id(self) -> int: return self._id

    @property
    def titulo(self) -> str: return self._titulo

    @property
    def responsavel(self) -> Colaborador: return self._responsavel

    @property
    def estado(self) -> str: return self._estado

    @property
    def dependencias(self) -> list:
        return list(self._dependencias)

    def adicionar_dependencia(self, tarefa: "Tarefa") -> None:
        if tarefa.id == self.id:
            raise ValueError("Uma tarefa não pode depender de si própria.")
        if all(d.id != tarefa.id for d in self._dependencias):
            self._dependencias.append(tarefa)

    def mudar_estado(self, novo_estado: str) -> None:
        if novo_estado not in ESTADOS_VALIDOS:
            raise TransicaoEstadoInvalida(f"Estado inválido: {novo_estado}")
        if novo_estado == self._estado:
            return
        if novo_estado not in TRANSICOES_VALIDAS[self._estado]:
            raise TransicaoEstadoInvalida(
                f"Transição inválida: {self._estado} → {novo_estado}"
            )
        # Regra no domínio: qualquer frente (consola ou web) respeita-a.
        if novo_estado == "em curso" and any(
            d.estado != "concluída" for d in self._dependencias
        ):
            raise DependenciaPendente(
                "A tarefa não pode iniciar: existem dependências por concluir."
            )
        self._estado = novo_estado

    @abstractmethod
    def resumo(self) -> str: ...

    @abstractmethod
    def tipo(self) -> str: ...

    def detalhe(self) -> str:
        return (f"[{self.id}] {self.titulo}\n"
                f"    Responsável: {self.responsavel}\n"
                f"    Estado: {self.estado}\n    {self.resumo()}")

    def exportar(self) -> str:
        return f"{self.tipo()};{self.id};{self.titulo};{self.responsavel.nome};{self.estado}"
