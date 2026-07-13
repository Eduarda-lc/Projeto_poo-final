import os, tempfile, unittest
from dominio.colaborador import Colaborador
from dominio.tarefa_tecnica import TarefaTecnica
from repositorio.repositorio_ficheiro import RepositorioFicheiro

class TestRepositorio(unittest.TestCase):
    def test_guardar_e_carregar_objetos(self):
        with tempfile.TemporaryDirectory() as d:
            caminho=os.path.join(d,"tarefas.csv"); r=RepositorioFicheiro(caminho)
            t=TarefaTecnica(1,"API",Colaborador("Ana","ana@empresa.pt"),"Python",8)
            r.guardar([t]); carregadas=r.carregar()
            self.assertEqual(carregadas[0].responsavel.email,"ana@empresa.pt")

    def test_ficheiro_corrompido_nao_rebenta(self):
        with tempfile.TemporaryDirectory() as d:
            caminho=os.path.join(d,"tarefas.csv")
            open(caminho,"w",encoding="utf-8").write("linha;má\n")
            self.assertEqual(RepositorioFicheiro(caminho).carregar(),[])
