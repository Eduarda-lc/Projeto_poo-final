const api = "/api";

const $ = (id) => document.getElementById(id);

let tarefas = [];
let estatisticas = {};

/*
 * Paginação da tabela principal.
 * São apresentadas 10 tarefas por página.
 */
const tarefasPorPagina = 10;
let paginaAtual = 1;

/*
 * Paginação da seleção de dependências.
 * São apresentadas 6 dependências por página.
 */
const dependenciasPorPagina = 6;
let paginaDependencias = 1;

/*
 * Mantém os IDs das dependências selecionadas.
 *
 * O Set evita valores repetidos e conserva a seleção
 * quando o utilizador muda de página ou aplica filtros.
 */
const dependenciasSelecionadas = new Set();

/*
 * Configuração inicial da ordenação.
 */
let colunaOrdenacao = "id";
let direcaoOrdenacao = "asc";

/*
 * Guarda temporariamente a alteração de estado
 * enquanto o modal de confirmação está aberto.
 */
let alteracaoEstadoPendente = null;

/*
 * Conta quantos pedidos à API estão ativos.
 *
 * Isto evita que o loading desapareça antes de todos
 * os pedidos simultâneos terminarem.
 */
let pedidosAtivos = 0;

/*
 * Guarda o temporizador da mensagem atual.
 */
let temporizadorMensagem = null;


/* ============================================================
   FUNÇÕES GERAIS
   ============================================================ */

/*
 * Mostra uma notificação de sucesso ou erro.
 */
function mensagem(texto, erro = false) {
  const elemento = $("mensagem");

  if (temporizadorMensagem) {
    clearTimeout(temporizadorMensagem);
  }

  elemento.textContent = erro
    ? `✕ ${texto}`
    : `✓ ${texto}`;

  elemento.className = erro
    ? "mensagem erro"
    : "mensagem";

  temporizadorMensagem = setTimeout(() => {
    elemento.classList.add("oculto");
  }, 4000);
}


/*
 * Mostra o indicador global de carregamento.
 */
function mostrarLoading(texto = "A carregar...") {
  pedidosAtivos += 1;

  $("loading-texto").textContent = texto;

  $("loading-global").classList.remove("oculto");
}


/*
 * Esconde o indicador quando já não existem pedidos ativos.
 */
function esconderLoading() {
  pedidosAtivos = Math.max(
    0,
    pedidosAtivos - 1
  );

  if (pedidosAtivos === 0) {
    $("loading-global").classList.add("oculto");
  }
}


/*
 * Função central para comunicar com a API.
 *
 * Centralizar os pedidos evita repetir:
 * - headers;
 * - tratamento de JSON;
 * - tratamento de erros;
 * - controlo do loading.
 */
async function pedido(
  url,
  opcoes = {},
  textoLoading = "A carregar..."
) {
  mostrarLoading(textoLoading);

  try {
    const resposta = await fetch(url, {
      headers: {
        "Content-Type": "application/json"
      },
      ...opcoes
    });

    let dados = {};

    try {
      dados = await resposta.json();
    } catch {
      dados = {};
    }

    if (!resposta.ok) {
      throw new Error(
        dados.detail ||
        dados.mensagem ||
        "Ocorreu um erro inesperado."
      );
    }

    return dados;
  } finally {
    esconderLoading();
  }
}


/*
 * Protege o HTML contra caracteres especiais.
 *
 * Assim, texto recebido da API não é interpretado
 * como código HTML.
 */
function esc(valor) {
  return String(valor ?? "").replace(
    /[&<>'"]/g,
    (caractere) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[caractere])
  );
}


/*
 * Define a próxima transição da tarefa.
 */
function proximoEstado(estado) {
  if (estado === "pendente") {
    return "em curso";
  }

  if (estado === "em curso") {
    return "concluída";
  }

  return null;
}


/*
 * Formata um valor em euros.
 */
function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-PT",
    {
      style: "currency",
      currency: "EUR"
    }
  );
}


/*
 * Formata números usando o padrão português.
 */
function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-PT",
    {
      maximumFractionDigits: 1
    }
  );
}


/*
 * Define a classe CSS de cada estado.
 */
function classeEstado(estado) {
  if (estado === "pendente") {
    return "badge-pendente";
  }

  if (estado === "em curso") {
    return "badge-curso";
  }

  return "badge-concluida";
}


/* ============================================================
   NAVEGAÇÃO ENTRE SECÇÕES
   ============================================================ */

/*
 * Funciona como uma navegação simples de página única.
 *
 * Não são usados frameworks:
 * o JavaScript apenas mostra uma secção e esconde as outras.
 */
function mostrarSecao(nomeSecao) {
  document
    .querySelectorAll(".pagina-secao")
    .forEach((secao) => {
      secao.classList.remove("ativa");
    });

  document
    .querySelectorAll(".nav-item[data-secao]")
    .forEach((botao) => {
      botao.classList.remove("ativo");
    });

  const secao = $(`secao-${nomeSecao}`);

  if (secao) {
    secao.classList.add("ativa");
  }

  const itemMenu = document.querySelector(
    `.nav-item[data-secao="${nomeSecao}"]`
  );

  if (itemMenu) {
    itemMenu.classList.add("ativo");
  }

  const titulos = {
    painel: "Painel",
    tarefas: "Tarefas",
    "nova-tarefa": "Nova tarefa",
    estatisticas: "Estatísticas",
    exportar: "Exportar"
  };

  $("titulo-pagina").textContent =
    titulos[nomeSecao] || "GestorTarefas";

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* ============================================================
   CARTÕES DO DASHBOARD
   ============================================================ */

/*
 * Gera os cartões usados no painel principal
 * e na página de estatísticas.
 */
function renderizarCards(est) {
  const itens = [
    {
      nome: "Total de tarefas",
      valor: est.total || 0,
      icone: "✓"
    },
    {
      nome: "Pendentes",
      valor: est.pendentes || 0,
      icone: "○"
    },
    {
      nome: "Em curso",
      valor: est.em_curso || 0,
      icone: "↻"
    },
    {
      nome: "Concluídas",
      valor: est.concluidas || 0,
      icone: "●"
    },
    {
      nome: "Horas estimadas",
      valor: `${formatarNumero(
        est.horas_totais || 0
      )} h`,
      icone: "◷"
    }
  ];

  const html = itens
    .map(
      (item) => `
        <article class="card">

          <div class="card-topo">

            <span>
              ${esc(item.nome)}
            </span>

            <div class="card-icon">
              ${item.icone}
            </div>

          </div>

          <strong>
            ${esc(item.valor)}
          </strong>

        </article>
      `
    )
    .join("");

  $("cards").innerHTML = html;

  $("cards-estatisticas").innerHTML = html;
}


/* ============================================================
   ESTATÍSTICAS E GRÁFICOS
   ============================================================ */

/*
 * Atualiza:
 * - percentagens;
 * - barras de progresso;
 * - gráficos circulares;
 * - indicadores financeiros;
 * - dados da página de exportação.
 */
function renderizarEstatisticas(est) {
  const total = Number(
    est.total || 0
  );

  const pendentes = Number(
    est.pendentes || 0
  );

  const emCurso = Number(
    est.em_curso || 0
  );

  const concluidas = Number(
    est.concluidas || 0
  );

  const horas = Number(
    est.horas_totais || 0
  );

  const custo = Number(
    est.custo_total || 0
  );

  /*
   * Caso o backend não devolva a percentagem,
   * o frontend consegue calculá-la.
   */
  const percentagem = Number(
    est.percentagem_concluidas ??
    (
      total > 0
        ? (concluidas / total) * 100
        : 0
    )
  );

  const percentagemLimitada = Math.max(
    0,
    Math.min(percentagem, 100)
  );

  /*
   * Painel principal.
   */
  $("percentagem-texto").textContent =
    `${formatarNumero(
      percentagemLimitada
    )}%`;

  $("barra-percentagem").style.width =
    `${percentagemLimitada}%`;

  $("legenda-pendentes").textContent =
    pendentes;

  $("legenda-curso").textContent =
    emCurso;

  $("legenda-concluidas").textContent =
    concluidas;

  $("resumo-estatisticas").textContent =
    total === 0
      ? "Ainda não existem tarefas no projeto."
      : `${concluidas} de ${total} tarefas estão concluídas.`;

  /*
   * Cálculo das fatias do gráfico circular.
   */
  const grausPendentes =
    total > 0
      ? (pendentes / total) * 360
      : 0;

  const grausCurso =
    total > 0
      ? (emCurso / total) * 360
      : 0;

  const fimPendentes =
    grausPendentes;

  const fimCurso =
    grausPendentes + grausCurso;

  const fundoGrafico =
    total === 0
      ? "#e7e2d8"
      : `
        conic-gradient(
          var(--status-pendente)
          0deg
          ${fimPendentes}deg,

          var(--status-curso)
          ${fimPendentes}deg
          ${fimCurso}deg,

          var(--status-concluida)
          ${fimCurso}deg
          360deg
        )
      `;

  /*
   * Gráfico do painel principal.
   */
  $("grafico-circular").style.background =
    fundoGrafico;

  $("grafico-total").textContent =
    total;

  $("grafico-pendentes").textContent =
    pendentes;

  $("grafico-curso").textContent =
    emCurso;

  $("grafico-concluidas").textContent =
    concluidas;

  /*
   * Página de estatísticas.
   */
  $("estatisticas-percentagem").textContent =
    `${formatarNumero(
      percentagemLimitada
    )}%`;

  $("estatisticas-barra").style.width =
    `${percentagemLimitada}%`;

  $("estatistica-legenda-pendentes").textContent =
    pendentes;

  $("estatistica-legenda-curso").textContent =
    emCurso;

  $("estatistica-legenda-concluidas").textContent =
    concluidas;

  $("estatisticas-resumo").textContent =
    total === 0
      ? "Ainda não existem tarefas para analisar."
      : `${concluidas} tarefas concluídas num total de ${total}.`;

  $("grafico-circular-estatisticas").style.background =
    fundoGrafico;

  $("grafico-total-estatisticas").textContent =
    total;

  $("grafico-pendentes-estatisticas").textContent =
    pendentes;

  $("grafico-curso-estatisticas").textContent =
    emCurso;

  $("grafico-concluidas-estatisticas").textContent =
    concluidas;

  /*
   * Indicadores financeiros e temporais.
   */
  $("indicador-horas").textContent =
    `${formatarNumero(horas)} h`;

  $("indicador-custo").textContent =
    formatarMoeda(custo);

  const mediaHoras =
    total > 0
      ? horas / total
      : 0;

  $("indicador-media").textContent =
    `${formatarNumero(mediaHoras)} h`;

  /*
   * Informações usadas na página Exportar.
   */
  $("exportar-total-tarefas").textContent =
    total;

  $("exportar-custo-total").textContent =
    formatarMoeda(custo);
}


/* ============================================================
   DEPENDÊNCIAS E BLOQUEIOS
   ============================================================ */

/*
 * Procura uma tarefa pelo seu ID.
 */
function obterTarefaPorId(id) {
  return tarefas.find(
    (tarefa) =>
      Number(tarefa.id) === Number(id)
  );
}


/*
 * Devolve as dependências que ainda não estão concluídas.
 */
function obterDependenciasPendentes(tarefa) {
  const dependencias =
    Array.isArray(tarefa.dependencias)
      ? tarefa.dependencias
      : [];

  return dependencias
    .map((id) => obterTarefaPorId(id))
    .filter(
      (dependencia) =>
        dependencia &&
        dependencia.estado !== "concluída"
    );
}


/*
 * Uma tarefa pendente fica bloqueada enquanto alguma
 * dependência não estiver concluída.
 */
function tarefaEstaBloqueada(tarefa) {
  return (
    tarefa.estado === "pendente" &&
    obterDependenciasPendentes(tarefa).length > 0
  );
}


/* ============================================================
   CRIAÇÃO DAS LINHAS DA TABELA
   ============================================================ */

/*
 * Produz o HTML de uma linha de tarefa.
 *
 * A mesma função é usada na tabela principal
 * e na lista de tarefas recentes.
 */
function criarLinhaTarefa(
  tarefa,
  mostrarAcao = true
) {
  const proximo =
    proximoEstado(tarefa.estado);

  const dependencias =
    Array.isArray(tarefa.dependencias)
      ? tarefa.dependencias
      : [];

  const pendentes =
    obterDependenciasPendentes(tarefa);

  const bloqueada =
    tarefaEstaBloqueada(tarefa);

  const nomesPendentes = pendentes
    .map(
      (dependencia) =>
        `#${dependencia.id} ${dependencia.titulo}`
    )
    .join(", ");

  const textoDependencias =
    dependencias.length > 0
      ? `Depende de #${dependencias.join(", #")}`
      : "";

  const tipo =
    tarefa.tipo === "reuniao"
      ? "Reunião"
      : "Técnica";

  let acao = "—";

  /*
   * Se estiver bloqueada, o botão não permite
   * passar para “em curso”.
   */
  if (mostrarAcao && proximo) {
    if (
      bloqueada &&
      proximo === "em curso"
    ) {
      acao = `
        <button
          type="button"
          class="acao"
          disabled
          title="Conclua primeiro as dependências pendentes."
        >
          🔒 Bloqueada
        </button>
      `;
    } else {
      acao = `
        <button
          type="button"
          class="acao"
          onclick="abrirModalEstado(
            ${Number(tarefa.id)},
            '${proximo}'
          )"
        >
          Alterar para ${esc(proximo)}
        </button>
      `;
    }
  }

  return `
    <tr class="${
      bloqueada
        ? "linha-bloqueada"
        : ""
    }">

      <td>
        #${Number(tarefa.id)}
      </td>

      <td>

        <strong>
          ${esc(tarefa.titulo)}
        </strong>

        ${
          bloqueada
            ? `
              <div class="badge-bloqueada">
                🔒 Bloqueada
              </div>
            `
            : ""
        }

        <small>
          ${esc(tarefa.resumo || "")}
        </small>

        ${
          textoDependencias
            ? `
              <small>
                ${esc(textoDependencias)}
              </small>
            `
            : ""
        }

        ${
          bloqueada
            ? `
              <span
                class="dependencias-pendentes"
                title="${esc(nomesPendentes)}"
              >
                Pendentes:
                ${esc(nomesPendentes)}
              </span>
            `
            : ""
        }

      </td>

      <td>

        ${esc(
          tarefa.responsavel?.nome || ""
        )}

        <small>
          ${esc(
            tarefa.responsavel?.email || ""
          )}
        </small>

      </td>

      <td>

        <span
          class="badge ${classeEstado(
            tarefa.estado
          )}"
        >
          ${esc(tarefa.estado)}
        </span>

      </td>

      <td>

        <span class="tipo-tag">
          ${tipo}
        </span>

      </td>

      <td>
        ${formatarMoeda(tarefa.custo)}
      </td>

      ${
        mostrarAcao
          ? `<td>${acao}</td>`
          : ""
      }

    </tr>
  `;
}


/* ============================================================
   FILTROS E ORDENAÇÃO
   ============================================================ */

/*
 * Filtra por:
 * - título;
 * - nome do responsável;
 * - email;
 * - estado;
 * - tipo.
 */
function obterTarefasFiltradas() {
  const estado =
    $("filtro-estado").value;

  const tipo =
    $("filtro-tipo").value;

  const pesquisa =
    $("filtro-pesquisa")
      .value
      .trim()
      .toLowerCase();

  return tarefas.filter((tarefa) => {
    const titulo =
      String(tarefa.titulo || "")
        .toLowerCase();

    const responsavel = [
      tarefa.responsavel?.nome || "",
      tarefa.responsavel?.email || ""
    ]
      .join(" ")
      .toLowerCase();

    const correspondePesquisa =
      !pesquisa ||
      titulo.includes(pesquisa) ||
      responsavel.includes(pesquisa);

    const correspondeEstado =
      !estado ||
      tarefa.estado === estado;

    const correspondeTipo =
      !tipo ||
      tarefa.tipo === tipo;

    return (
      correspondePesquisa &&
      correspondeEstado &&
      correspondeTipo
    );
  });
}


/*
 * Obtém o valor correto para ordenar cada coluna.
 */
function valorOrdenacao(
  tarefa,
  coluna
) {
  if (coluna === "id") {
    return Number(tarefa.id || 0);
  }

  if (coluna === "titulo") {
    return String(
      tarefa.titulo || ""
    ).toLowerCase();
  }

  if (coluna === "responsavel") {
    return String(
      tarefa.responsavel?.nome || ""
    ).toLowerCase();
  }

  if (coluna === "estado") {
    const ordemEstados = {
      pendente: 1,
      "em curso": 2,
      "concluída": 3
    };

    return ordemEstados[
      tarefa.estado
    ] || 99;
  }

  if (coluna === "tipo") {
    return String(
      tarefa.tipo || ""
    ).toLowerCase();
  }

  if (coluna === "custo") {
    return Number(
      tarefa.custo || 0
    );
  }

  return "";
}


/*
 * Ordena uma cópia da lista.
 * A lista original não é alterada.
 */
function ordenarTarefas(lista) {
  return [...lista].sort((a, b) => {
    const valorA =
      valorOrdenacao(
        a,
        colunaOrdenacao
      );

    const valorB =
      valorOrdenacao(
        b,
        colunaOrdenacao
      );

    let resultado = 0;

    if (
      typeof valorA === "number" &&
      typeof valorB === "number"
    ) {
      resultado =
        valorA - valorB;
    } else {
      resultado =
        String(valorA).localeCompare(
          String(valorB),
          "pt-PT"
        );
    }

    return direcaoOrdenacao === "asc"
      ? resultado
      : -resultado;
  });
}


/*
 * Muda a coluna ou a direção da ordenação.
 */
function ordenarPor(coluna) {
  if (colunaOrdenacao === coluna) {
    direcaoOrdenacao =
      direcaoOrdenacao === "asc"
        ? "desc"
        : "asc";
  } else {
    colunaOrdenacao = coluna;
    direcaoOrdenacao = "asc";
  }

  paginaAtual = 1;

  atualizarCabecalhosOrdenacao();

  renderizarTabela();
}


/*
 * Atualiza as setas dos cabeçalhos.
 */
function atualizarCabecalhosOrdenacao() {
  document
    .querySelectorAll("[data-ordenar]")
    .forEach((cabecalho) => {
      const coluna =
        cabecalho.dataset.ordenar;

      const icone =
        cabecalho.querySelector(
          ".icone-ordenacao"
        );

      cabecalho.classList.toggle(
        "ordenacao-ativa",
        coluna === colunaOrdenacao
      );

      if (!icone) {
        return;
      }

      if (
        coluna !== colunaOrdenacao
      ) {
        icone.textContent = "↕";
      } else {
        icone.textContent =
          direcaoOrdenacao === "asc"
            ? "↑"
            : "↓";
      }
    });
}


/* ============================================================
   TABELA PRINCIPAL E PAGINAÇÃO
   ============================================================ */

/*
 * Aplica filtros, ordenação e paginação.
 */
function renderizarTabela() {
  const listaFiltrada =
    ordenarTarefas(
      obterTarefasFiltradas()
    );

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      listaFiltrada.length /
      tarefasPorPagina
    )
  );

  if (
    paginaAtual > totalPaginas
  ) {
    paginaAtual = totalPaginas;
  }

  if (paginaAtual < 1) {
    paginaAtual = 1;
  }

  const inicio =
    (paginaAtual - 1) *
    tarefasPorPagina;

  const fim =
    inicio +
    tarefasPorPagina;

  const tarefasDaPagina =
    listaFiltrada.slice(
      inicio,
      fim
    );

  $("contador-tarefas").textContent =
    `${listaFiltrada.length} de ${tarefas.length} tarefas`;

  $("corpo-tabela").innerHTML =
    tarefasDaPagina.length > 0
      ? tarefasDaPagina
          .map(
            (tarefa) =>
              criarLinhaTarefa(
                tarefa,
                true
              )
          )
          .join("")
      : `
        <tr>
          <td colspan="7">
            Nenhuma tarefa corresponde aos filtros selecionados.
          </td>
        </tr>
      `;

  renderizarPaginacao(
    totalPaginas,
    listaFiltrada.length
  );
}


/*
 * Atualiza os botões da paginação principal.
 */
function renderizarPaginacao(
  totalPaginas,
  totalResultados
) {
  const primeiroItem =
    totalResultados === 0
      ? 0
      : (
          (paginaAtual - 1) *
          tarefasPorPagina
        ) + 1;

  const ultimoItem = Math.min(
    paginaAtual *
    tarefasPorPagina,
    totalResultados
  );

  $("texto-paginacao").textContent =
    totalResultados === 0
      ? "Sem resultados"
      : `A mostrar ${primeiroItem}–${ultimoItem} de ${totalResultados} tarefas`;

  $("pagina-anterior").disabled =
    paginaAtual <= 1;

  $("pagina-seguinte").disabled =
    paginaAtual >= totalPaginas;

  /*
   * Mostra no máximo cinco números de página.
   */
  let primeiraPagina = Math.max(
    1,
    paginaAtual - 2
  );

  let ultimaPagina = Math.min(
    totalPaginas,
    primeiraPagina + 4
  );

  primeiraPagina = Math.max(
    1,
    ultimaPagina - 4
  );

  const numeros = [];

  for (
    let numero = primeiraPagina;
    numero <= ultimaPagina;
    numero += 1
  ) {
    numeros.push(`
      <button
        type="button"
        class="numero-pagina ${
          numero === paginaAtual
            ? "ativa"
            : ""
        }"
        data-pagina="${numero}"
      >
        ${numero}
      </button>
    `);
  }

  $("numeros-paginacao").innerHTML =
    numeros.join("");

  document
    .querySelectorAll(
      "[data-pagina]"
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () => {
          paginaAtual =
            Number(
              botao.dataset.pagina
            );

          renderizarTabela();
        }
      );
    });
}


/*
 * Mostra as cinco tarefas mais recentes no painel.
 */
function renderizarRecentes() {
  const recentes = [...tarefas]
    .sort(
      (a, b) =>
        Number(b.id) -
        Number(a.id)
    )
    .slice(0, 5);

  $("corpo-tabela-recentes").innerHTML =
    recentes.length > 0
      ? recentes
          .map(
            (tarefa) =>
              criarLinhaTarefa(
                tarefa,
                false
              )
          )
          .join("")
      : `
        <tr>
          <td colspan="6">
            Ainda não existem tarefas.
          </td>
        </tr>
      `;
}
/* ============================================================
   PESQUISA E FILTRO DAS DEPENDÊNCIAS
   ============================================================ */

/*
 * Filtra as tarefas que podem aparecer
 * na área de seleção de dependências.
 */
function obterDependenciasFiltradas() {
  const pesquisa =
    $("pesquisa-dependencias")
      .value
      .trim()
      .toLowerCase();

  const estado =
    $("filtro-estado-dependencias")
      .value;

  return tarefas.filter((tarefa) => {
    const titulo =
      String(
        tarefa.titulo || ""
      ).toLowerCase();

    const responsavel = [
      tarefa.responsavel?.nome || "",
      tarefa.responsavel?.email || ""
    ]
      .join(" ")
      .toLowerCase();

    const correspondePesquisa =
      !pesquisa ||
      titulo.includes(pesquisa) ||
      responsavel.includes(pesquisa);

    const correspondeEstado =
      !estado ||
      tarefa.estado === estado;

    return (
      correspondePesquisa &&
      correspondeEstado
    );
  });
}


/* ============================================================
   RENDERIZAÇÃO DAS DEPENDÊNCIAS
   ============================================================ */

/*
 * Apresenta apenas as dependências da página atual.
 *
 * A seleção fica guardada no Set
 * dependenciasSelecionadas.
 */
function renderizarDependencias() {
  const contentor =
    $("lista-dependencias");

  const listaFiltrada =
    obterDependenciasFiltradas();

  const totalPaginas = Math.max(
    1,
    Math.ceil(
      listaFiltrada.length /
      dependenciasPorPagina
    )
  );

  /*
   * Garante que a página atual continua válida.
   */
  if (
    paginaDependencias >
    totalPaginas
  ) {
    paginaDependencias =
      totalPaginas;
  }

  if (
    paginaDependencias < 1
  ) {
    paginaDependencias = 1;
  }

  const inicio =
    (
      paginaDependencias - 1
    ) * dependenciasPorPagina;

  const fim =
    inicio +
    dependenciasPorPagina;

  const listaDaPagina =
    listaFiltrada.slice(
      inicio,
      fim
    );

  /*
   * Caso ainda não existam tarefas no projeto.
   */
  if (tarefas.length === 0) {
    contentor.innerHTML = `
      <div class="sem-dependencias">
        Ainda não existem tarefas que possam ser usadas como dependência.
      </div>
    `;
  }

  /*
   * Caso existam tarefas, mas nenhuma corresponda aos filtros.
   */
  else if (
    listaDaPagina.length === 0
  ) {
    contentor.innerHTML = `
      <div class="dependencias-sem-resultados">
        Nenhuma tarefa corresponde à pesquisa ou ao filtro selecionado.
      </div>
    `;
  }

  /*
   * Apresenta os cartões das dependências.
   */
  else {
    contentor.innerHTML =
      listaDaPagina
        .map((tarefa) => {
          const id =
            Number(tarefa.id);

          const selecionada =
            dependenciasSelecionadas
              .has(id);

          return `
            <div class="dependencia-item">

              <input
                type="checkbox"
                class="dependencia-checkbox"
                id="dependencia-${id}"
                value="${id}"
                ${
                  selecionada
                    ? "checked"
                    : ""
                }
              >

              <label
                for="dependencia-${id}"
              >

                <span class="dependencia-check">
                  ✓
                </span>

                <span class="dependencia-info">

                  <strong>
                    #${id}
                    ${esc(tarefa.titulo)}
                  </strong>

                  <small>
                    Estado:
                    ${esc(tarefa.estado)}
                  </small>

                  <small>
                    Responsável:
                    ${esc(
                      tarefa.responsavel?.nome ||
                      "Sem responsável"
                    )}
                  </small>

                </span>

              </label>

            </div>
          `;
        })
        .join("");
  }

  /*
   * Regista os eventos dos checkboxes visíveis.
   */
  document
    .querySelectorAll(
      ".dependencia-checkbox"
    )
    .forEach((checkbox) => {
      checkbox.addEventListener(
        "change",
        () => {
          const id =
            Number(
              checkbox.value
            );

          if (checkbox.checked) {
            dependenciasSelecionadas
              .add(id);
          } else {
            dependenciasSelecionadas
              .delete(id);
          }

          atualizarContadorDependencias();
        }
      );
    });

  renderizarPaginacaoDependencias(
    totalPaginas,
    listaFiltrada.length
  );

  atualizarContadorDependencias();
}


/* ============================================================
   PAGINAÇÃO DAS DEPENDÊNCIAS
   ============================================================ */

/*
 * Atualiza o texto, os botões e os números
 * da paginação das dependências.
 */
function renderizarPaginacaoDependencias(
  totalPaginas,
  totalResultados
) {
  $("texto-paginacao-dependencias")
    .textContent =
      totalResultados === 0
        ? "Sem resultados"
        : `Página ${paginaDependencias} de ${totalPaginas}`;

  $("dependencias-anterior")
    .disabled =
      paginaDependencias <= 1;

  $("dependencias-seguinte")
    .disabled =
      paginaDependencias >=
      totalPaginas;

  /*
   * Apresenta no máximo cinco números de página.
   */
  let primeiraPagina =
    Math.max(
      1,
      paginaDependencias - 2
    );

  let ultimaPagina =
    Math.min(
      totalPaginas,
      primeiraPagina + 4
    );

  primeiraPagina =
    Math.max(
      1,
      ultimaPagina - 4
    );

  const numeros = [];

  for (
    let numero = primeiraPagina;
    numero <= ultimaPagina;
    numero += 1
  ) {
    numeros.push(`
      <button
        type="button"
        class="numero-pagina ${
          numero === paginaDependencias
            ? "ativa"
            : ""
        }"
        data-pagina-dependencia="${numero}"
      >
        ${numero}
      </button>
    `);
  }

  $("numeros-paginacao-dependencias")
    .innerHTML =
      numeros.join("");

  document
    .querySelectorAll(
      "[data-pagina-dependencia]"
    )
    .forEach((botao) => {
      botao.addEventListener(
        "click",
        () => {
          paginaDependencias =
            Number(
              botao.dataset
                .paginaDependencia
            );

          renderizarDependencias();
        }
      );
    });
}


/* ============================================================
   CONTADOR E LIMPEZA DAS DEPENDÊNCIAS
   ============================================================ */

/*
 * Atualiza o número de dependências selecionadas.
 */
function atualizarContadorDependencias() {
  const quantidade =
    dependenciasSelecionadas.size;

  $("contador-dependencias")
    .textContent =
      quantidade === 1
        ? "1 selecionada"
        : `${quantidade} selecionadas`;
}


/*
 * Limpa a pesquisa, filtro, paginação
 * e todas as dependências escolhidas.
 */
function limparDependencias() {
  dependenciasSelecionadas.clear();

  paginaDependencias = 1;

  $("pesquisa-dependencias")
    .value = "";

  $("filtro-estado-dependencias")
    .value = "";

  renderizarDependencias();
}


/* ============================================================
   MODAL DE ALTERAÇÃO DE ESTADO
   ============================================================ */

/*
 * Abre o modal e apresenta os dados da tarefa.
 */
function abrirModalEstado(
  id,
  novoEstado
) {
  const tarefa =
    obterTarefaPorId(id);

  if (!tarefa) {
    mensagem(
      "A tarefa selecionada não foi encontrada.",
      true
    );

    return;
  }

  /*
   * Guarda a operação até o utilizador confirmar.
   */
  alteracaoEstadoPendente = {
    id,
    novoEstado
  };

  $("modal-tarefa").textContent =
    `#${tarefa.id} ${tarefa.titulo}`;

  $("modal-estado-atual").textContent =
    tarefa.estado;

  $("modal-novo-estado").textContent =
    novoEstado;

  $("modal-estado")
    .classList
    .remove("oculto");

  /*
   * Coloca o foco no botão principal.
   */
  $("modal-confirmar").focus();
}


/*
 * Fecha o modal sem modificar a tarefa.
 */
function fecharModalEstado() {
  alteracaoEstadoPendente = null;

  $("modal-estado")
    .classList
    .add("oculto");
}


/*
 * Confirma a alteração e envia o pedido à API.
 */
async function confirmarAlteracaoEstado() {
  if (
    !alteracaoEstadoPendente
  ) {
    return;
  }

  const {
    id,
    novoEstado
  } = alteracaoEstadoPendente;

  fecharModalEstado();

  try {
    await pedido(
      `${api}/tarefas/${id}/estado`,
      {
        method: "PUT",
        body: JSON.stringify({
          estado: novoEstado
        })
      },
      "A atualizar o estado..."
    );

    mensagem(
      "Estado atualizado e ficheiro CSV guardado."
    );

    /*
     * Volta a carregar os dados da API,
     * porque as estatísticas também podem mudar.
     */
    await carregar();
  } catch (erro) {
    mensagem(
      erro.message,
      true
    );
  }
}


/*
 * A função precisa de ficar disponível globalmente,
 * porque é chamada pelos botões criados no HTML da tabela.
 */
window.abrirModalEstado =
  abrirModalEstado;


/* ============================================================
   CARREGAMENTO DOS DADOS DA API
   ============================================================ */

/*
 * Carrega tarefas e estatísticas ao mesmo tempo.
 *
 * Promise.all permite realizar os dois pedidos
 * em paralelo.
 */
async function carregar() {
  const [
    tarefasRecebidas,
    estatisticasRecebidas
  ] = await Promise.all([
    pedido(
      `${api}/tarefas`,
      {},
      "A carregar tarefas..."
    ),

    pedido(
      `${api}/estatisticas`,
      {},
      "A carregar estatísticas..."
    )
  ]);

  tarefas =
    Array.isArray(
      tarefasRecebidas
    )
      ? tarefasRecebidas
      : [];

  estatisticas =
    estatisticasRecebidas || {};

  /*
   * Remove do Set IDs que eventualmente
   * já não existam na lista atual.
   */
  const idsExistentes =
    new Set(
      tarefas.map(
        (tarefa) =>
          Number(tarefa.id)
      )
    );

  [
    ...dependenciasSelecionadas
  ].forEach((id) => {
    if (
      !idsExistentes.has(id)
    ) {
      dependenciasSelecionadas
        .delete(id);
    }
  });

  renderizarCards(
    estatisticas
  );

  renderizarEstatisticas(
    estatisticas
  );

  renderizarTabela();

  renderizarRecentes();

  renderizarDependencias();
}


/* ============================================================
   EXPORTAÇÃO DE FICHEIROS
   ============================================================ */

/*
 * Cria um ficheiro temporário no navegador
 * e inicia o respetivo download.
 */
function descarregarFicheiro(
  nome,
  conteudo,
  tipoMime
) {
  const blob = new Blob(
    [conteudo],
    {
      type:
        `${tipoMime};charset=utf-8`
    }
  );

  const endereco =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = endereco;

  link.download = nome;

  document.body
    .appendChild(link);

  link.click();

  link.remove();

  URL.revokeObjectURL(
    endereco
  );
}


/*
 * Prepara um campo para CSV.
 *
 * As aspas internas são duplicadas,
 * seguindo o formato CSV.
 */
function campoCsv(valor) {
  const texto =
    String(valor ?? "");

  return `"${texto.replace(
    /"/g,
    '""'
  )}"`;
}


/*
 * Exporta o relatório operacional com todas as tarefas.
 */
function exportarRelatorioTarefas() {
  if (tarefas.length === 0) {
    mensagem(
      "Não existem tarefas para exportar.",
      true
    );

    return;
  }

  const cabecalho = [
    "ID",
    "Título",
    "Tipo",
    "Estado",
    "Responsável",
    "Email",
    "Resumo",
    "Dependências",
    "Custo"
  ];

  const linhas =
    tarefas.map(
      (tarefa) => [
        tarefa.id,

        tarefa.titulo,

        tarefa.tipo,

        tarefa.estado,

        tarefa.responsavel?.nome ||
          "",

        tarefa.responsavel?.email ||
          "",

        tarefa.resumo || "",

        Array.isArray(
          tarefa.dependencias
        )
          ? tarefa.dependencias
              .join(" | ")
          : "",

        Number(
          tarefa.custo || 0
        ).toFixed(2)
      ]
    );

  const conteudo = [
    cabecalho,
    ...linhas
  ]
    .map(
      (linha) =>
        linha
          .map(campoCsv)
          .join(";")
    )
    .join("\n");

  /*
   * O BOM ajuda programas como o Excel
   * a reconhecer corretamente caracteres portugueses.
   */
  descarregarFicheiro(
    "relatorio_tarefas.csv",
    `\uFEFF${conteudo}`,
    "text/csv"
  );

  mensagem(
    "Relatório de tarefas exportado."
  );
}


/*
 * Exporta o relatório financeiro.
 */
function exportarRelatorioFinanceiro() {
  if (tarefas.length === 0) {
    mensagem(
      "Não existem tarefas para exportar.",
      true
    );

    return;
  }

  const cabecalho = [
    "ID",
    "Tarefa",
    "Tipo",
    "Estado",
    "Responsável",
    "Custo"
  ];

  const linhas =
    tarefas.map(
      (tarefa) => [
        tarefa.id,

        tarefa.titulo,

        tarefa.tipo,

        tarefa.estado,

        tarefa.responsavel?.nome ||
          "",

        Number(
          tarefa.custo || 0
        ).toFixed(2)
      ]
    );

  /*
   * Adiciona o custo total na última linha.
   */
  linhas.push([
    "",
    "CUSTO TOTAL",
    "",
    "",
    "",
    Number(
      estatisticas.custo_total ||
      0
    ).toFixed(2)
  ]);

  const conteudo = [
    cabecalho,
    ...linhas
  ]
    .map(
      (linha) =>
        linha
          .map(campoCsv)
          .join(";")
    )
    .join("\n");

  descarregarFicheiro(
    "relatorio_financeiro.csv",
    `\uFEFF${conteudo}`,
    "text/csv"
  );

  mensagem(
    "Relatório financeiro exportado."
  );
}


/*
 * Exporta um resumo executivo em formato TXT.
 */
function exportarResumoTxt() {
  const texto = [
    "GESTORTAREFAS - RESUMO DO PROJETO",
    "================================",
    "",

    `Data: ${
      new Date()
        .toLocaleDateString(
          "pt-PT"
        )
    }`,

    "",

    `Total de tarefas: ${
      estatisticas.total || 0
    }`,

    `Pendentes: ${
      estatisticas.pendentes || 0
    }`,

    `Em curso: ${
      estatisticas.em_curso || 0
    }`,

    `Concluídas: ${
      estatisticas.concluidas || 0
    }`,

    `Percentagem concluída: ${
      formatarNumero(
        estatisticas
          .percentagem_concluidas ||
        0
      )
    }%`,

    `Horas totais: ${
      formatarNumero(
        estatisticas
          .horas_totais ||
        0
      )
    } h`,

    `Custo total: ${
      formatarMoeda(
        estatisticas
          .custo_total ||
        0
      )
    }`
  ].join("\n");

  descarregarFicheiro(
    "resumo_projeto.txt",
    texto,
    "text/plain"
  );

  mensagem(
    "Resumo geral exportado."
  );
}


/* ============================================================
   DATA APRESENTADA NO TOPO
   ============================================================ */

/*
 * Apresenta a data no formato português.
 */
function atualizarData() {
  const hoje =
    new Intl.DateTimeFormat(
      "pt-PT",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(
      new Date()
    );

  $("data-atual")
    .textContent =
      hoje;
}
/* ============================================================
   EVENTOS DE NAVEGAÇÃO
   ============================================================ */

/*
 * Liga os botões do menu às respetivas secções.
 */
document
  .querySelectorAll(".nav-item[data-secao]")
  .forEach((botao) => {
    botao.addEventListener(
      "click",
      () => {
        mostrarSecao(
          botao.dataset.secao
        );
      }
    );
  });


/*
 * Atalhos para abrir a página de nova tarefa.
 */
$("botao-ir-nova-tarefa")
  .addEventListener(
    "click",
    () => {
      mostrarSecao(
        "nova-tarefa"
      );
    }
  );

$("botao-ir-nova-tarefa-2")
  .addEventListener(
    "click",
    () => {
      mostrarSecao(
        "nova-tarefa"
      );
    }
  );


/*
 * Abre a página com todas as tarefas.
 */
$("botao-ver-tarefas")
  .addEventListener(
    "click",
    () => {
      mostrarSecao(
        "tarefas"
      );
    }
  );


/*
 * Cancela o formulário e regressa ao painel.
 */
$("botao-cancelar")
  .addEventListener(
    "click",
    () => {
      $("form-tarefa").reset();

      limparDependencias();

      mostrarSecao(
        "painel"
      );
    }
  );


/* ============================================================
   EVENTOS DA ORDENAÇÃO
   ============================================================ */

/*
 * Cada cabeçalho ordenável chama ordenarPor().
 */
document
  .querySelectorAll(
    "[data-ordenar]"
  )
  .forEach((cabecalho) => {
    cabecalho.addEventListener(
      "click",
      () => {
        ordenarPor(
          cabecalho
            .dataset
            .ordenar
        );
      }
    );
  });


/* ============================================================
   EVENTOS DOS FILTROS PRINCIPAIS
   ============================================================ */

$("filtro-pesquisa")
  .addEventListener(
    "input",
    () => {
      paginaAtual = 1;

      renderizarTabela();
    }
  );

$("filtro-estado")
  .addEventListener(
    "change",
    () => {
      paginaAtual = 1;

      renderizarTabela();
    }
  );

$("filtro-tipo")
  .addEventListener(
    "change",
    () => {
      paginaAtual = 1;

      renderizarTabela();
    }
  );


/*
 * Limpa pesquisa, estado e tipo.
 */
$("limpar-filtros")
  .addEventListener(
    "click",
    () => {
      $("filtro-pesquisa")
        .value = "";

      $("filtro-estado")
        .value = "";

      $("filtro-tipo")
        .value = "";

      paginaAtual = 1;

      renderizarTabela();

      mensagem(
        "Filtros removidos."
      );
    }
  );


/* ============================================================
   EVENTOS DA PAGINAÇÃO PRINCIPAL
   ============================================================ */

$("pagina-anterior")
  .addEventListener(
    "click",
    () => {
      if (
        paginaAtual > 1
      ) {
        paginaAtual -= 1;

        renderizarTabela();
      }
    }
  );

$("pagina-seguinte")
  .addEventListener(
    "click",
    () => {
      const totalPaginas =
        Math.max(
          1,
          Math.ceil(
            obterTarefasFiltradas()
              .length /
            tarefasPorPagina
          )
        );

      if (
        paginaAtual <
        totalPaginas
      ) {
        paginaAtual += 1;

        renderizarTabela();
      }
    }
  );


/* ============================================================
   EVENTOS DAS DEPENDÊNCIAS
   ============================================================ */

/*
 * Pesquisa instantânea nas dependências.
 */
$("pesquisa-dependencias")
  .addEventListener(
    "input",
    () => {
      paginaDependencias = 1;

      renderizarDependencias();
    }
  );


/*
 * Filtro de estado das dependências.
 */
$("filtro-estado-dependencias")
  .addEventListener(
    "change",
    () => {
      paginaDependencias = 1;

      renderizarDependencias();
    }
  );


/*
 * Página anterior nas dependências.
 */
$("dependencias-anterior")
  .addEventListener(
    "click",
    () => {
      if (
        paginaDependencias > 1
      ) {
        paginaDependencias -= 1;

        renderizarDependencias();
      }
    }
  );


/*
 * Página seguinte nas dependências.
 */
$("dependencias-seguinte")
  .addEventListener(
    "click",
    () => {
      const totalPaginas =
        Math.max(
          1,
          Math.ceil(
            obterDependenciasFiltradas()
              .length /
            dependenciasPorPagina
          )
        );

      if (
        paginaDependencias <
        totalPaginas
      ) {
        paginaDependencias += 1;

        renderizarDependencias();
      }
    }
  );


/* ============================================================
   ALTERAÇÃO DO TIPO DE TAREFA
   ============================================================ */

/*
 * Altera os campos conforme o tipo escolhido.
 *
 * Técnica:
 * - Linguagem
 * - Estimativa de horas
 *
 * Reunião:
 * - Local
 * - Duração
 */
$("tipo")
  .addEventListener(
    "change",
    () => {
      const reuniao =
        $("tipo").value ===
        "reuniao";

      const labelCampo =
        document.querySelector(
          "#grupo-campo label"
        );

      const labelHoras =
        document.querySelector(
          "#grupo-horas label"
        );

      labelCampo.textContent =
        reuniao
          ? "Local"
          : "Linguagem";

      labelHoras.textContent =
        reuniao
          ? "Duração em horas"
          : "Estimativa de horas";

      $("campo").placeholder =
        reuniao
          ? "Sala 2 ou Microsoft Teams"
          : "Python";
    }
  );


/* ============================================================
   CRIAÇÃO DE TAREFA
   ============================================================ */

/*
 * Envia o formulário para a API.
 *
 * A API cria o objeto de domínio e guarda
 * a tarefa no ficheiro CSV.
 */
$("form-tarefa")
  .addEventListener(
    "submit",
    async (evento) => {
      evento.preventDefault();

      const tipo =
        $("tipo").value;

      const botaoGuardar =
        $("botao-guardar-tarefa");

      /*
       * Payload comum aos dois tipos.
       */
      const payload = {
        tipo,

        titulo:
          $("titulo")
            .value
            .trim(),

        responsavel_nome:
          $("responsavel_nome")
            .value
            .trim(),

        responsavel_email:
          $("responsavel_email")
            .value
            .trim(),

        dependencias: [
          ...dependenciasSelecionadas
        ]
      };

      /*
       * Campos específicos.
       */
      if (
        tipo === "tecnica"
      ) {
        payload.linguagem =
          $("campo")
            .value
            .trim();

        payload.estimativa_horas =
          Number(
            $("horas").value
          );
      } else {
        payload.local =
          $("campo")
            .value
            .trim();

        payload.duracao =
          Number(
            $("horas").value
          );
      }

      /*
       * Impede cliques repetidos.
       */
      botaoGuardar.disabled = true;

      botaoGuardar.textContent =
        "A guardar...";

      try {
        await pedido(
          `${api}/tarefas`,
          {
            method: "POST",
            body:
              JSON.stringify(
                payload
              )
          },
          "A criar e guardar a tarefa..."
        );

        /*
         * Limpa o formulário depois do sucesso.
         */
        evento.target.reset();

        dependenciasSelecionadas
          .clear();

        paginaDependencias = 1;

        $("pesquisa-dependencias")
          .value = "";

        $("filtro-estado-dependencias")
          .value = "";

        paginaAtual = 1;

        mensagem(
          "Tarefa criada e guardada no ficheiro tarefas.csv."
        );

        /*
         * Atualiza todas as páginas com os dados novos.
         */
        await carregar();

        mostrarSecao(
          "tarefas"
        );
      } catch (erro) {
        mensagem(
          erro.message,
          true
        );
      } finally {
        botaoGuardar.disabled =
          false;

        botaoGuardar.textContent =
          "Adicionar e guardar";
      }
    }
  );


/* ============================================================
   EVENTOS DO MODAL
   ============================================================ */

/*
 * Cancela a alteração de estado.
 */
$("modal-cancelar")
  .addEventListener(
    "click",
    fecharModalEstado
  );


/*
 * Confirma a alteração de estado.
 */
$("modal-confirmar")
  .addEventListener(
    "click",
    confirmarAlteracaoEstado
  );


/*
 * Fecha o modal ao clicar no fundo escuro.
 */
$("modal-estado")
  .addEventListener(
    "click",
    (evento) => {
      if (
        evento.target ===
        $("modal-estado")
      ) {
        fecharModalEstado();
      }
    }
  );


/*
 * Fecha o modal com a tecla Escape.
 */
document
  .addEventListener(
    "keydown",
    (evento) => {
      const modalAberto =
        !$("modal-estado")
          .classList
          .contains("oculto");

      if (
        evento.key ===
          "Escape" &&
        modalAberto
      ) {
        fecharModalEstado();
      }
    }
  );


/* ============================================================
   EVENTOS DE EXPORTAÇÃO
   ============================================================ */

$("exportar-tarefas-csv")
  .addEventListener(
    "click",
    exportarRelatorioTarefas
  );

$("exportar-financeiro-csv")
  .addEventListener(
    "click",
    exportarRelatorioFinanceiro
  );

$("exportar-resumo-txt")
  .addEventListener(
    "click",
    exportarResumoTxt
  );


/* ============================================================
   INICIALIZAÇÃO
   ============================================================ */

/*
 * Mostra a data atual.
 */
atualizarData();


/*
 * Atualiza as setas da ordenação.
 */
atualizarCabecalhosOrdenacao();


/*
 * Carrega os dados iniciais da API.
 */
carregar()
  .catch((erro) => {
    mensagem(
      `Não foi possível ligar à API: ${erro.message}`,
      true
    );
  });