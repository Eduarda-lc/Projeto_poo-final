import csv
import os
import tempfile
from dominio.colaborador import Colaborador
from dominio.tarefa_tecnica import TarefaTecnica
from dominio.tarefa_reuniao import TarefaReuniao
from repositorio.i_repositorio import IRepositorio

CABECALHO = ["tipo", "id", "titulo", "responsavel_nome", "responsavel_email",
             "estado", "campo_especifico", "horas", "dependencias"]


class RepositorioFicheiro(IRepositorio):
    """Persistência CSV. Linhas corrompidas são ignoradas, sem parar a aplicação."""

    def __init__(self, caminho="tarefas.csv"):
        self._caminho = caminho

    def guardar(self, tarefas):
        pasta = os.path.dirname(os.path.abspath(self._caminho))
        os.makedirs(pasta, exist_ok=True)
        # Escrita atómica: primeiro temporário, depois substitui o ficheiro real.
        fd, temporario = tempfile.mkstemp(dir=pasta, text=True)
        try:
            with os.fdopen(fd, "w", newline="", encoding="utf-8") as f:
                w = csv.writer(f, delimiter=";")
                w.writerow(CABECALHO)
                for t in tarefas:
                    especifico = t.linguagem if isinstance(t, TarefaTecnica) else t.local
                    horas = t.estimativa_horas if isinstance(t, TarefaTecnica) else t.duracao
                    deps = ",".join(str(d.id) for d in t.dependencias)
                    w.writerow([t.tipo(), t.id, t.titulo, t.responsavel.nome,
                                t.responsavel.email, t.estado, especifico, horas, deps])
            os.replace(temporario, self._caminho)
        finally:
            if os.path.exists(temporario): os.remove(temporario)

    def carregar(self):
        if not os.path.exists(self._caminho): return []
        tarefas, dependencias_por_id = [], {}
        with open(self._caminho, newline="", encoding="utf-8") as f:
            linhas = list(csv.reader(f, delimiter=";"))
        if linhas and linhas[0] == CABECALHO: linhas = linhas[1:]
        for numero, c in enumerate(linhas, start=2):
            try:
                # Novo formato (com Colaborador e dependências).
                if len(c) >= 9:
                    tipo, sid, titulo, nome, email, estado, campo, horas, deps = c[:9]
                # Compatibilidade com o CSV antigo do projeto.
                elif len(c) >= 7:
                    tipo, sid, titulo, nome, estado, campo, horas = c[:7]
                    email, deps = f"{nome.lower().replace(' ', '.')}@projeto.pt", ""
                else:
                    raise ValueError("número de campos insuficiente")
                colaborador = Colaborador(nome, email)
                cls = TarefaTecnica if tipo == "tecnica" else TarefaReuniao if tipo == "reuniao" else None
                if cls is None: raise ValueError(f"tipo desconhecido: {tipo}")
                tarefa = cls(int(sid), titulo, colaborador, campo, float(horas), estado)
                tarefas.append(tarefa)
                dependencias_por_id[tarefa.id] = [int(x) for x in deps.split(",") if x.strip()]
            except (ValueError, TypeError) as erro:
                print(f"Aviso: linha {numero} ignorada ({erro}).")
        mapa = {t.id: t for t in tarefas}
        for t in tarefas:
            for dep_id in dependencias_por_id.get(t.id, []):
                if dep_id in mapa:
                    t.adicionar_dependencia(mapa[dep_id])
        return tarefas
