# Bónus — API web (FastAPI)

Frente **opcional**. A consola continua a ser a frente obrigatória; esta API
existe só para mostrar uma ideia: **o motor é o mesmo, só muda a frente**.

`api.py` não tem regras de negócio. Cria um `ServicoTarefas` (o mesmo da
consola) e expõe-no por HTTP. A lógica vive no serviço; aqui só traduzimos
pedidos/respostas HTTP.

## Como correr (Python)

```bash
pip install fastapi uvicorn
cd python/bonus_api_web
uvicorn api:app --reload
```

- Documentação interativa: http://127.0.0.1:8000/docs
- `GET  /tarefas` — lista as tarefas (usa `servico.listar()`)
- `POST /tarefas` — cria uma tarefa técnica (usa `servico.adicionar()`)

Exemplo de `POST /tarefas`:

```json
{
  "titulo": "Migração de dados",
  "responsavel": "Carla",
  "linguagem": "Python",
  "estimativa_horas": 6
}
```

## Equivalente em C# (Minimal API do ASP.NET)

Em C#, a mesma ideia faz-se com uma *Minimal API*. Não é preciso projeto
separado para o arranque — fica como esqueleto comentado no `csharp/README.md`.
O ponto a reter é o mesmo: a API injeta o `ServicoTarefas` e expõe
`GET /tarefas` e `POST /tarefas`, sem duplicar regras de negócio.
