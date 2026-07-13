import os
import sys
from pathlib import Path

#--------------------------------
# Ajusta o caminho do projeto para permitir importar módulos
# das camadas de domínio, serviço e repositório.

RAIZ = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(RAIZ))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from dominio.colaborador import Colaborador
from dominio.tarefa_tecnica import TarefaTecnica
from dominio.tarefa_reuniao import TarefaReuniao
from servico.servico_tarefas import ServicoTarefas
from repositorio.repositorio_ficheiro import RepositorioFicheiro


#-----------------------
# Instância principal da API REST.
# Expõe a funcionalidade do sistema através de endpoints HTTP.

app = FastAPI(title="Gestão de Tarefas POO", version="1.0.0")

#-----------------------
# Permite que aplicações frontend comuniquem com a API.
# Necessário para integração com interfaces web.

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

#----------------------
# Inicialização da camada de serviço.
# Utiliza persistência CSV através do repositório de ficheiros.

CAMINHO_CSV = RAIZ / "tarefas.csv"
_servico = ServicoTarefas(RepositorioFicheiro(str(CAMINHO_CSV)))

#---------------------
# Modelo utilizado para validar pedidos de criação
# de tarefas recebidos pela API.

class NovaTarefa(BaseModel):
    tipo: str
    titulo: str = Field(min_length=1, max_length=120)
    responsavel_nome: str = Field(min_length=1, max_length=80)
    responsavel_email: str
    linguagem: str | None = None
    estimativa_horas: float | None = Field(default=None, gt=0)
    local: str | None = None
    duracao: float | None = Field(default=None, gt=0)
    dependencias: list[int] = []

#---------------------
# Modelo utilizado para alterar o estado de uma tarefa.
class NovoEstado(BaseModel):
    estado: str

#---------------------
# Converte um objeto do domínio para um formato JSON,
# permitindo a sua devolução através da API.

def para_dict(t):
    dados = {
        "id": t.id,
        "titulo": t.titulo,
        "responsavel": {"nome": t.responsavel.nome, "email": t.responsavel.email},
        "estado": t.estado,
        "tipo": t.tipo(),
        "resumo": t.resumo(),
        "dependencias": [d.id for d in t.dependencias],
        "custo": t.custo(),
    }
    if isinstance(t, TarefaTecnica):
        dados.update(linguagem=t.linguagem, estimativa_horas=t.estimativa_horas)
    else:
        dados.update(local=t.local, duracao=t.duracao)
    return dados

#---------------------
# Lista todas as tarefas.
# Permite filtros por estado e responsável.

@app.get("/api/tarefas")
def listar_tarefas(estado: str | None = Query(default=None), responsavel: str | None = None):
    tarefas = _servico.listar()
    if estado:
        tarefas = _servico.filtrar_por_estado(estado)
    if responsavel:
        tarefas = [t for t in tarefas if t in _servico.filtrar_por_responsavel(responsavel)]
    return [para_dict(t) for t in tarefas]

#---------------------
# Cria uma nova tarefa técnica ou de reunião.
# Os dados recebidos são previamente validados pelo Pydantic.

@app.post("/api/tarefas", status_code=201)
def criar_tarefa(dados: NovaTarefa):
    try:
        responsavel = Colaborador(dados.responsavel_nome, dados.responsavel_email)
        id_tarefa = _servico.proximo_id()
        if dados.tipo == "tecnica":
            if not dados.linguagem or dados.estimativa_horas is None:
                raise ValueError("Indique linguagem e estimativa de horas.")
            tarefa = TarefaTecnica(id_tarefa, dados.titulo, responsavel,
                                dados.linguagem, dados.estimativa_horas)
        elif dados.tipo == "reuniao":
            if not dados.local or dados.duracao is None:
                raise ValueError("Indique local e duração.")
            tarefa = TarefaReuniao(id_tarefa, dados.titulo, responsavel,
                                dados.local, dados.duracao)
        else:
            raise ValueError("Tipo deve ser 'tecnica' ou 'reuniao'.")
        for dep_id in dados.dependencias:       # Associa dependências à tarefa antes da sua criação.
            tarefa.adicionar_dependencia(_servico.procurar(dep_id))
        _servico.adicionar(tarefa)
        return para_dict(tarefa)
    except (ValueError, TypeError) as erro:
        raise HTTPException(status_code=400, detail=str(erro))

#---------------------
#Alterar o estado de uma tarefa existente

@app.put("/api/tarefas/{id_tarefa}/estado")
def mudar_estado(id_tarefa: int, dados: NovoEstado):
    try:
        return para_dict(_servico.mudar_estado(id_tarefa, dados.estado))
    except ValueError as erro:
        raise HTTPException(status_code=400, detail=str(erro))

#---------------------
# Devolve indicadores estatísticos do sistema.

@app.get("/api/estatisticas")
def estatisticas():
    return _servico.estatisticas()

#---------------------
# Cria um relatório de custos calculado a partir das tarefas.

@app.get("/api/relatorio-custos")
def relatorio_custos():
    return _servico.relatorio_custos()

#---------------------
# Exporta as tarefas utilizando a interface Exportavel.

@app.get("/api/exportar")
def exportar():
    return {"linhas": [t.exportar() for t in _servico.listar()]}

#---------------------
# Endpoint de diagnóstico utilizado para verificar
# se a API está operacional.

@app.get("/api/saude")
def saude():
    return {"estado": "ok", "ficheiro": str(CAMINHO_CSV.name)}

#---------------------
# Diretório que contém os ficheiros estáticos da aplicação web.
FRONTEND = RAIZ / "frontend"

#--------------------
# Disponibiliza os ficheiros estáticos através da API.

app.mount("/static", StaticFiles(directory=str(FRONTEND)), name="static")

#--------------------
# Entrega a página principal do frontend.
@app.get("/", include_in_schema=False)
def pagina_inicial():
    return FileResponse(FRONTEND / "index.html")
