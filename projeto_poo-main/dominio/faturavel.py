from abc import ABC, abstractmethod


class Faturavel(ABC):

    @abstractmethod
    def custo(self) -> float:
        pass