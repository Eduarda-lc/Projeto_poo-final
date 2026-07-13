from abc import ABC, abstractmethod

'''
Interface que define o comportamento de cálculo de custos.
Todas as classes que implementam esta interface devem disponibilizar um método custo()'''
class Faturavel(ABC):

    @abstractmethod
    def custo(self) -> float:
        pass