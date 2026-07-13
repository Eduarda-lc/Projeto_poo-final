class Colaborador:
    """Entidade responsável por tarefas.

    Na defesa: uma Tarefa *tem um* Colaborador. Isto é composição/associação,
    não herança, porque uma tarefa não "é um" colaborador.
    """

    def __init__(self, nome: str, email: str):
        nome = nome.strip()
        email = email.strip()
        if not nome:
            raise ValueError("O nome do colaborador é obrigatório.")
        if "@" not in email or email.startswith("@") or email.endswith("@"):
            raise ValueError("O email do colaborador é inválido.")
        self._nome = nome
        self._email = email

    @property
    def nome(self) -> str:
        return self._nome

    @property
    def email(self) -> str:
        return self._email

    def __str__(self) -> str:
        return f"{self._nome} <{self._email}>"
