'''Representa um colaborador do sistema.
    Cada colaborador possui um nome e um endereço de email,
    podendo ser associado a uma ou mais tarefas.
'''
class Colaborador:

    def __init__(self, nome: str, email: str):
        
        # Remove espaços em branco antes da validação.
        nome = nome.strip()
        email = email.strip()
        
        # Validação do nome do colaborador.
        if not nome:
            raise ValueError("O nome do colaborador é obrigatório.")
        
        # Validação do email do colaborador.
        if "@" not in email or email.startswith("@") or email.endswith("@"):
            raise ValueError("O email do colaborador é inválido.")
        
        self._nome = nome
        self._email = email

    @property
    def nome(self) -> str:
        #Devolve o nome do colaborador
        return self._nome

    @property
    def email(self) -> str:
        #Devolve o email do colaborador
        return self._email

    def __str__(self) -> str:
        #Devolve uma representação textual do colaborador
        return f"{self._nome} <{self._email}>"
