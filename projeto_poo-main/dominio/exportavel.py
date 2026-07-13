from abc import ABC, abstractmethod

'''Interface que define o comportamento de exportação.Todas as classes que implementam esta interface 
devem disponibilizar um método exportar().'''

class Exportavel(ABC):

   @abstractmethod
   def exportar(self) -> str:
      #Devolve uma representação textual do objeto para a exportação.
      pass