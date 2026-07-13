# Gestão de Tarefas — Projeto POO

Projeto em camadas, com **consola** e **frente web HTML/CSS/JavaScript** a utilizar exatamente o mesmo serviço. As alterações feitas pelo frontend passam por `FastAPI → ServicoTarefas → RepositorioFicheiro` e ficam imediatamente gravadas em `tarefas.csv`.

## Executar a aplicação web

No terminal, entrar primeiro nesta pasta (a que contém `requirements.txt`):

```powershell
py -m pip install -r requirements.txt
py -m uvicorn bonus_api_web.api:app --reload
```

Abrir: `http://127.0.0.1:8000`

Documentação automática: `http://127.0.0.1:8000/docs`

## Executar a consola

```powershell
py main.py
```

## Executar os testes

```powershell
py -m unittest discover -s tests -v
```

## Arquitetura para explicar na defesa

```text
HTML/CSS/JavaScript ou Consola
             ↓
        ServicoTarefas
             ↓
        IRepositorio
             ↓
    RepositorioFicheiro (CSV)

ServicoTarefas usa o domínio: Projeto, Tarefa, TarefaTecnica,
TarefaReuniao e Colaborador.
```

### Pontos importantes

- `Tarefa` é abstrata; `TarefaTecnica` e `TarefaReuniao` herdam dela.
- `resumo()`, `tipo()` e `custo()` demonstram polimorfismo.
- `Colaborador` é um objeto associado à tarefa, não apenas texto.
- A máquina de estados está no domínio, portanto nenhuma frente a consegue contornar.
- Dependências também são validadas no domínio.
- O serviço depende de `IRepositorio`, e não do CSV concreto.
- O repositório ignora linhas corrompidas e usa escrita temporária antes de substituir o CSV.
- O frontend usa `fetch()`; nunca escreve diretamente no ficheiro.

## Comentários sobre IA

A IA foi usada como apoio para revisão, testes e frontend. O código gerado foi simplificado e adaptado à arquitetura inicial. Foram rejeitadas soluções com React e bibliotecas adicionais por aumentarem a complexidade sem melhorar os conceitos de POO avaliados. O grupo deve conseguir explicar e modificar cada parte apresentada.
