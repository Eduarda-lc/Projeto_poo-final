import unittest
from dominio.colaborador import Colaborador
from dominio.excecoes import DependenciaPendente, TransicaoEstadoInvalida
from dominio.tarefa_tecnica import TarefaTecnica
from dominio.tarefa_reuniao import TarefaReuniao


class TestDominio(unittest.TestCase):
    def setUp(self): self.ana = Colaborador("Ana", "ana@empresa.pt")

    def test_colaborador_valida_email(self):
        with self.assertRaises(ValueError): Colaborador("Ana", "email-invalido")

    def test_tarefa_tecnica_polimorfismo(self):
        t = TarefaTecnica(1, "API", self.ana, "Python", 8)
        self.assertEqual(t.tipo(), "tecnica")
        self.assertIn("Python", t.resumo())
        self.assertEqual(t.custo(), 200)

    def test_tarefa_reuniao_polimorfismo(self):
        t = TarefaReuniao(1, "Kickoff", self.ana, "Teams", 2)
        self.assertEqual(t.tipo(), "reuniao")
        self.assertEqual(t.custo(), 30)

    def test_maquina_estados_valida(self):
        t = TarefaTecnica(1, "API", self.ana, "Python", 8)
        t.mudar_estado("em curso"); t.mudar_estado("concluída")
        self.assertEqual(t.estado, "concluída")

    def test_nao_salta_estado(self):
        t = TarefaTecnica(1, "API", self.ana, "Python", 8)
        with self.assertRaises(TransicaoEstadoInvalida): t.mudar_estado("concluída")

    def test_dependencia_impede_inicio(self):
        dep = TarefaTecnica(1, "Base", self.ana, "Python", 2)
        t = TarefaTecnica(2, "API", self.ana, "Python", 8, dependencias=[dep])
        with self.assertRaises(DependenciaPendente): t.mudar_estado("em curso")

    def test_dependencia_concluida_permite_inicio(self):
        dep = TarefaTecnica(1, "Base", self.ana, "Python", 2)
        dep.mudar_estado("em curso"); dep.mudar_estado("concluída")
        t = TarefaTecnica(2, "API", self.ana, "Python", 8, dependencias=[dep])
        t.mudar_estado("em curso")
        self.assertEqual(t.estado, "em curso")
