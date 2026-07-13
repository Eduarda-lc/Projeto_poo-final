from abc import ABC, abstractmethod


class Exportavel(ABC):

   @abstractmethod
   def exportar(self) -> str:
      pass