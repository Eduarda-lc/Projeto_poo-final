from dominio.faturavel import Faturavel
from dominio.projeto import Projeto
from dominio.tarefa_tecnica import TarefaTecnica
from dominio.tarefa_reuniao import TarefaReuniao
from repositorio.i_repositorio import IRepositorio


class ServicoTarefas:
    """Caso de uso da aplicação. Não conhece HTML, FastAPI nem CSV concreto."""

    def __init__(self, repositorio: IRepositorio):
        self._repositorio = repositorio
        self._projeto = Projeto("Projeto POO")
        self.carregar()

    def proximo_id(self):
        return max((t.id for t in self._projeto.tarefas), default=0) + 1

    def adicionar(self, tarefa):
        self._projeto.adicionar_tarefa(tarefa)
        self.guardar()  # persistência automática usada igualmente pela API e consola
        return tarefa

    def listar(self): return self._projeto.tarefas

    def procurar(self, id_tarefa): return self._projeto.procurar_tarefa(id_tarefa)

    def mudar_estado(self, id_tarefa, novo_estado):
        tarefa = self.procurar(id_tarefa)
        tarefa.mudar_estado(novo_estado)
        self.guardar()
        return tarefa

    def adicionar_dependencia(self, id_tarefa, id_dependencia):
        tarefa = self.procurar(id_tarefa)
        dependencia = self.procurar(id_dependencia)
        tarefa.adicionar_dependencia(dependencia)
        self.guardar()

    def filtrar_por_estado(self, estado):
        return [t for t in self.listar() if t.estado == estado]

    def filtrar_por_responsavel(self, texto):
        texto = texto.casefold()
        return [t for t in self.listar()
                if texto in t.responsavel.nome.casefold()
                or texto in t.responsavel.email.casefold()]

    def estatisticas(self):
        tarefas = self.listar()
        total = len(tarefas)
        concluidas = sum(t.estado == "concluída" for t in tarefas)
        horas = sum(t.estimativa_horas if isinstance(t, TarefaTecnica)
                    else t.duracao if isinstance(t, TarefaReuniao) else 0
                    for t in tarefas)
        return {
            "total": total,
            "pendentes": sum(t.estado == "pendente" for t in tarefas),
            "em_curso": sum(t.estado == "em curso" for t in tarefas),
            "concluidas": concluidas,
            "horas_totais": round(horas, 2),
            "percentagem_concluidas": round((concluidas / total * 100) if total else 0, 1),
            "custo_total": round(self.relatorio_custos()["total"], 2),
        }

    def relatorio_custos(self):
        linhas = [{"id": t.id, "titulo": t.titulo, "tipo": t.tipo(), "custo": t.custo()}
                  for t in self.listar() if isinstance(t, Faturavel)]
        return {"tarefas": linhas, "total": sum(x["custo"] for x in linhas)}

    def guardar(self): self._repositorio.guardar(self.listar())

    def carregar(self): self._projeto.substituir_tarefas(self._repositorio.carregar())
