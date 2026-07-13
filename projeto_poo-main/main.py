from repositorio.repositorio_ficheiro import RepositorioFicheiro
from servico.servico_tarefas import ServicoTarefas
from interface.consola import Consola


def main() -> None:
    # A consola e a API criam o MESMO serviço; só muda a frente utilizada.
    servico = ServicoTarefas(RepositorioFicheiro("tarefas.csv"))
    Consola(servico).executar()


if __name__ == "__main__":
    main()
