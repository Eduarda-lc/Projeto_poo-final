# Guia rápido para a defesa

## Frase principal

"Construímos um motor de domínio reutilizável. A consola e a página web são duas frentes diferentes, mas ambas chamam o mesmo `ServicoTarefas`; por isso as regras não são duplicadas."

## Perguntas prováveis

**Onde está a herança?**  
`TarefaTecnica` e `TarefaReuniao` herdam de `Tarefa` e chamam `super().__init__()`.

**Onde está o polimorfismo?**  
O serviço percorre tarefas heterogéneas e chama `custo()`, `tipo()` e `resumo()` sem precisar de saber antecipadamente qual é a subclasse.

**Por que o responsável é um objeto?**  
Porque tem identidade e dados próprios (`nome`, `email`). A tarefa "tem um" colaborador; não é apenas uma string.

**Por que a regra de estados está no domínio?**  
Para que seja respeitada pela consola, API, testes ou qualquer futura interface.

**Como o frontend grava no CSV?**  
O JavaScript faz um `POST /api/tarefas`; a API cria o objeto e chama `ServicoTarefas.adicionar()`, que chama `guardar()` no repositório.

**O que mudariam ao vivo facilmente?**  
Adicionar um novo filtro, uma propriedade a uma tarefa, ou uma nova estatística no serviço e apresentá-la no frontend.

## Demo recomendada (1–2 minutos)

1. Criar uma tarefa técnica.
2. Mostrar que aparece na tabela.
3. Abrir `tarefas.csv` e mostrar a linha criada.
4. Mudar para "em curso" e depois "concluída".
5. Mostrar estatísticas atualizadas.
6. Abrir `/docs` para provar que existe uma API independente da página.
