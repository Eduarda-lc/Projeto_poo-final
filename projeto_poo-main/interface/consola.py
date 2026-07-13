from servico.servico_tarefas import ServicoTarefas
from dominio.tarefa_tecnica import TarefaTecnica
from dominio.tarefa_reuniao import TarefaReuniao
from dominio.colaborador import Colaborador

'''Interface de linha de comandos do sistema.
Permite ao utilizador interagir com a aplicação através de um menu textual.'''
class Consola:

## Ligação à camada de serviço.
    def __init__(self, servico: ServicoTarefas):
        self._servico = servico

#Ciclo principal da aplicação em modo consola.
    def executar(self) -> None:

        opcoes = {
            "1": ("Listar tarefas", self._listar, True),
            "2": ("Adicionar tarefa", self._adicionar, True),
            "3": ("Mudar estado de uma tarefa", self._mudar_estado, True),
            "4": ("Filtrar por estado", self._filtrar, True),
            "5": ("Ver estatísticas", self._estatisticas, True),
            "6": ("Guardar em ficheiro", self._guardar, True),
            "7": ("Carregar de ficheiro", self._carregar, True),
            "8": ("Exportar", self._exportar, True),
        }

        while True:

            print("\n=== Gestão de Tarefas ===")

            for tecla, (rotulo, _, feita) in opcoes.items():
                marca = "" if feita else "  [TODO]"
                print(f"  {tecla}. {rotulo}{marca}")

            print("  0. Sair")

            escolha = input("Escolhe uma opção: ").strip()

            if escolha == "0":
                print("Até à próxima!")
                break

            opcao = opcoes.get(escolha)

            if opcao is None:
                print("Opção inválida.")
                continue


            try:
                opcao[1]()
            except NotImplementedError as erro:
                print(f"[TODO] {erro}")
            except Exception as erro:
                print(f"Erro: {erro}")

#------------------------
#Lista todas as tarefas existentes.

    def _listar(self):

        tarefas = self._servico.listar()

        if not tarefas:
            print("(sem tarefas)")
            return

        for tarefa in tarefas:
            print(tarefa.detalhe())

#------------------------
#Cria uma nova tarefa através de dados introduzidos pelo utilizador.

    def _adicionar(self):

        tipo = input("Tipo (tecnica/reuniao): ").lower()

        titulo = input("Título: ")
        nome = input("Nome do responsável: ")
        email = input("Email do responsável: ")
        responsavel = Colaborador(nome, email)

        if tipo == "tecnica":

            linguagem = input("Linguagem: ")
            horas = float(input("Horas estimadas: "))

            tarefa = TarefaTecnica(
                self._servico.proximo_id(),
                titulo,
                responsavel,
                linguagem,
                horas
            )

        elif tipo == "reuniao":

            local = input("Local: ")
            duracao = float(input("Duração: "))

            tarefa = TarefaReuniao(
                self._servico.proximo_id(),
                titulo,
                responsavel,
                local,
                duracao
            )

        else:
            print("Tipo inválido.")
            return

        self._servico.adicionar(tarefa)

        print("Tarefa adicionada com sucesso.")
        
#------------------------
#Permite alterar o estado de uma tarefa.

    def _mudar_estado(self):

        try:
            id_tarefa = int(input("ID da tarefa: "))
        except ValueError:
            print("O ID deve ser um número.")
            return
        novo_estado = input(
            "Novo estado (pendente/em curso/concluída): "
        )

        self._servico.mudar_estado(
            id_tarefa,
            novo_estado
        )

        print("Estado alterado.")

#------------------------
#Apresenta apenas as tarefas com o estado indicado.

    def _filtrar(self):

        estado = input(
            "Estado (pendente/em curso/concluída): "
        )

        tarefas = self._servico.filtrar_por_estado(
            estado
        )

        if not tarefas:
            print("Nenhuma tarefa encontrada.")
            return

        for tarefa in tarefas:
            print(tarefa.detalhe())
            
#------------------------
#Mostra os indicadores estatísticos do sistema.

    def _estatisticas(self):

        estatisticas = self._servico.estatisticas()

        print("\n=== Estatísticas ===")
        print(f"Total: {estatisticas['total']}")
        print(f"Horas estimadas: {estatisticas['horas_totais']}")
        print(
            f"Concluídas: "
            f"{estatisticas['percentagem_concluidas']:.2f}%"
        )

#------------------------
#Guarda os dados no ficheiro CSV.

    def _guardar(self):
        self._servico.guardar()
        print("Tarefas guardadas com sucesso.")
        
#------------------------
#Carrega os dados do ficheiro CSV.

    def _carregar(self):
        self._servico.carregar()
        print("Tarefas carregadas com sucesso.")
        
#------------------------
#EExporta as tarefas utilizando a interface Exportavel.

    def _exportar(self):

        tarefas = self._servico.listar()

        print("\n=== Exportação ===")

        for tarefa in tarefas:
            print(tarefa.exportar())