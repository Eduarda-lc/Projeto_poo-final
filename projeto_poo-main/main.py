from repositorio.repositorio_ficheiro import RepositorioFicheiro
from servico.servico_tarefas import ServicoTarefas
from interface.consola import Consola

#Ponto de entrada da aplicação em modo consola.
def main() -> None:
    #Inicializa a camada de serviço da aplicação.
    # Cria o repositório responsável pela persistência dos dados.
    servico = ServicoTarefas(RepositorioFicheiro("tarefas.csv"))
    
    # Inicia a interface de linha de comandos.
    Consola(servico).executar()


if __name__ == "__main__":
    main()
