import unittest
from dominio.colaborador import Colaborador
from dominio.tarefa_tecnica import TarefaTecnica
from dominio.tarefa_reuniao import TarefaReuniao
from servico.servico_tarefas import ServicoTarefas

class RepoMemoria:
    def __init__(self): self.dados=[]; self.guardou=0
    def guardar(self,tarefas): self.dados=list(tarefas); self.guardou+=1
    def carregar(self): return list(self.dados)

class TestServico(unittest.TestCase):
    def setUp(self):
        self.repo=RepoMemoria(); self.s=ServicoTarefas(self.repo)
        self.ana=Colaborador("Ana","ana@empresa.pt")

    def test_adicionar_guarda_automaticamente(self):
        self.s.adicionar(TarefaTecnica(1,"API",self.ana,"Python",8))
        self.assertEqual(self.repo.guardou,1)

    def test_ids_repetidos(self):
        self.s.adicionar(TarefaTecnica(1,"A",self.ana,"Python",1))
        with self.assertRaises(ValueError): self.s.adicionar(TarefaTecnica(1,"B",self.ana,"Python",1))

    def test_filtro_responsavel(self):
        self.s.adicionar(TarefaTecnica(1,"A",self.ana,"Python",1))
        self.assertEqual(len(self.s.filtrar_por_responsavel("empresa.pt")),1)

    def test_estatisticas(self):
        a=TarefaTecnica(1,"A",self.ana,"Python",8)
        b=TarefaReuniao(2,"B",self.ana,"Teams",2)
        a.mudar_estado("em curso"); a.mudar_estado("concluída")
        self.s.adicionar(a); self.s.adicionar(b)
        e=self.s.estatisticas()
        self.assertEqual(e["total"],2); self.assertEqual(e["horas_totais"],10)
        self.assertEqual(e["percentagem_concluidas"],50)

    def test_relatorio_custos_polimorfico(self):
        self.s.adicionar(TarefaTecnica(1,"A",self.ana,"Python",8))
        self.s.adicionar(TarefaReuniao(2,"B",self.ana,"Teams",2))
        self.assertEqual(self.s.relatorio_custos()["total"],230)
