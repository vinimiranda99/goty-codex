
// --- ELEMENTOS ---
const cardContainer = document.querySelector(".card-container");
const campoBusca = document.querySelector("input");
const botaoBusca = document.querySelector("#botao-busca");
const tituloPagina = document.querySelector("header h1");
const btnFavoritos = document.querySelector("#btn-favoritos"); 
const btnDescubra = document.getElementById("btn-descubra");
const modal = document.getElementById("modal");
const modalIframe = document.getElementById("modal-video");

// --- ESTADO DA APLICAÇÃO ---
let dados = []; 
let listaFavoritos = JSON.parse(localStorage.getItem('meusJogosFavoritos')) || [];

/**
 * Gera o HTML para os ícones de plataforma de um jogo.
 */
function getPlataformasHTML(plataformas) {
    if (!plataformas) return "";
    
    const mapaIcones = {
        "pc": '<i class="fa-brands fa-windows" title="PC"></i>',
        "ps5": '<i class="fa-brands fa-playstation" title="PlayStation 5"></i>',
        "xbox": '<i class="fa-brands fa-xbox" title="Xbox Series"></i>',
        "nintendo": '<i class="fa-solid fa-gamepad" title="Nintendo Switch"></i>', 
        "mobile": '<i class="fa-solid fa-mobile-screen" title="Mobile"></i>'
    };

    return plataformas.map(p => mapaIcones[p] || "").join(' ');
}

/**
 * Alterna o estado de favorito de um jogo, atualizando o localStorage e a interface.
 */
function toggleFavorito(iconeElemento, tituloJogo) {
    // 1. Toggles o estado no LocalStorage
    if (listaFavoritos.includes(tituloJogo)) {
        listaFavoritos = listaFavoritos.filter(item => item !== tituloJogo);
    } else {
        listaFavoritos.push(tituloJogo);
    }
    localStorage.setItem('meusJogosFavoritos', JSON.stringify(listaFavoritos));

    // 2. ATUALIZAÇÃO VISUAL INSTANTÂNEA (Sem recarregar a página)
    iconeElemento.classList.toggle('fa-solid'); 
    iconeElemento.classList.toggle('fa-regular'); 
    iconeElemento.classList.toggle('favoritado'); 
    
    if (tituloPagina.innerText.includes("MEUS FAVORITOS")) {
        verFavoritos(); // Necessário para remover o card da lista de Favoritos
    } else if (campoBusca.value.trim() !== "") {
        iniciarBusca(); // Necessário para manter o resultado da busca ativa
    }
    // Se estiver na Home ou no Descubra, o código para aqui, MANTENDO A PÁGINA ESTÁTICA
}

/**
 * Carrega os dados do data.json e renderiza os cards iniciais.
 * Também verifica parâmetros na URL para filtrar por categoria ou tag.
 */
async function carregarDados() {
    try {
        const resposta = await fetch("data.json");
        dados = await resposta.json();
        
        const params = new URLSearchParams(window.location.search);
        const categoriaURL = params.get("categoria");
        const tagURL = params.get("tag");

        if (categoriaURL) filtrarPorCategoria(decodeURIComponent(categoriaURL));
        else if (tagURL) filtrarPorTag(decodeURIComponent(tagURL));
        else renderizarCards(dados);

    } catch (error) {
        console.error("Erro:", error);
    }
}

/**
 * Filtra os jogos com base no termo de busca e renderiza os resultados.
 * Se a busca estiver vazia, renderiza todos os jogos.
 */
function iniciarBusca() {
    const termo = campoBusca.value.toLowerCase().trim();
    if (termo === "") {
        tituloPagina.innerText = "Goty Codex";
        tituloPagina.style.color = "var(--primary-color)";
        renderizarCards(dados);
        return;
    }
    const resultados = dados.filter(d => 
        d.titulo.toLowerCase().includes(termo) ||     
        d.descricao.toLowerCase().includes(termo) ||  
        (d.tags && d.tags.some(t => t.toLowerCase().includes(termo)))                       
    );
    renderizarCards(resultados);
}

/**
 * Renderiza uma lista de jogos no container principal.
 */
function renderizarCards(lista) {
    if (!cardContainer) return;
    cardContainer.innerHTML = "";
    
    const isSingleGameView = lista.length === 1;

    if (lista.length === 0) {
        cardContainer.innerHTML = `<h2 style="text-align:center; color:white; padding:2rem;">Nenhum jogo encontrado 😕</h2>`;
        return;
    }

    for(let dado of lista) {
        let article = document.createElement("article");
        
        article.classList.add("card");
        if (isSingleGameView) {
            article.classList.add("large-image"); 
        }
        
        article.setAttribute("onclick", "toggleSinopse(this)");

        // Lógica de Metadados
        const ehFavorito = listaFavoritos.includes(dado.titulo);
        const classeIcone = ehFavorito ? "fa-solid fa-heart favoritado" : "fa-regular fa-heart";
        
        let plataformasHTML = getPlataformasHTML(dado.plataformas); 
        let tagsHTML = (dado.tags || []).map(tag => `<span class="tag-badge">${tag}</span>`).join('');
        const numIndicacoes = dado.categorias_indicadas ? dado.categorias_indicadas.length : 0;
        
        // Geração condicional do Metacritic
        let metacriticBlock = '';
        if (isSingleGameView) { 
             metacriticBlock = `
                <div class="metacritic-box" style="margin-top: 1.5rem; margin-bottom: 0.5rem; margin-right: 40px; width: fit-content; display: none;">
                    Metacritic: <span class="meta-score">${dado.metacritic}</span>
                    <span style="color: var(--border-color); margin: 0 8px;">|</span>
                    <span style="color: var(--tertiary-color);">🏆 Indicações: </span> <span class="meta-score">${numIndicacoes}</span>
                </div>
            `;
        }

        article.innerHTML = `
            <img src="${dado.imagem}" alt="${dado.titulo}" class="card-img">
            
            <div class="card-info">
                
                <a href="${dado.video}" target="_blank" onclick="event.stopPropagation()" class="btn-link">
                    Ver Trailer ▷
                </a>

                <i class="${classeIcone} icone-favorito" onclick="event.stopPropagation(); toggleFavorito(this, '${dado.titulo}')"></i>

                <h2>${dado.titulo}</h2>
                
                <p class="meta-info"><strong>Dev:</strong> ${dado.desenvolvedora}</p>
                
                <div class="expand-hint">
                    Ler descrição <i class="fa-solid fa-chevron-down"></i>
                </div>

                <div class="platform-icons-row">
                    ${plataformasHTML}
                </div>

                <p class="description">${dado.descricao}</p>
                
                ${metacriticBlock} 

                <div class="tags-group" style="margin-top: auto; padding-right: 2.5rem;">
                    ${tagsHTML}
                </div>

            </div>
        `
        cardContainer.appendChild(article);
    }
}

/**
 * Expande ou recolhe a sinopse de um card de jogo.
 */
function toggleSinopse(card) {
    const descricao = card.querySelector(".description");
    const dica = card.querySelector(".expand-hint"); 
    if (!descricao) return;

    const estiloAtual = window.getComputedStyle(descricao).display;

    if (estiloAtual === "none") {
        // ABRIR
        descricao.style.display = "block"; 
        card.style.borderColor = "var(--primary-color)"; // Borda dourada
        

        if(dica) dica.innerHTML = `Fechar <i class="fa-solid fa-chevron-up"></i>`;
        
    } else {
       
        descricao.style.display = "none"; 
        card.style.borderColor = "var(--border-color)"; 
        
        
        if(dica) dica.innerHTML = `ler descrição <i class="fa-solid fa-chevron-down"></i>`;
    }
}

/**
 * Cria e exibe um player de vídeo lateralmente ao card de destaque.
 */
function mostrarPlayerLateral(videoId) {
    const container = document.createElement("div");
    container.classList.add("player-lateral");

    container.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${videoId}?autoplay=0"
            frameborder="0"
            allowfullscreen>
        </iframe>
    `;

    // Remove player anterior, se existir
    const existente = document.querySelector(".player-lateral");
    if (existente) existente.remove();

    // Adiciona depois do card
    const card = document.querySelector(".card");
    if (card) {
        card.insertAdjacentElement("afterend", container);
    }
}

/**
 * Abre o modal de vídeo.
 */
function abrirModal(videoId) {
    modalIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=0`;
    modal.style.display = "flex";
}

/**
 * Fecha o modal de vídeo e para o vídeo.
 */
function fecharModal() { 
    modalIframe.src = "";
    modal.style.display = "none";
}

/**
 * Atualiza o título principal da página.
 */
function atualizarTituloPagina(novoTitulo) {
    tituloPagina.innerText = novoTitulo;
    tituloPagina.style.color = "var(--primary-color)";
}

// =================================================================================
// --- FUNÇÕES DE NAVEGAÇÃO E FILTRAGEM ---
// =================================================================================

/**
 * Exibe um jogo aleatório em destaque.
 */
function descobrirJogo() {
    if (dados.length === 0) return;

    const jogo = dados[Math.floor(Math.random() * dados.length)];
    atualizarTituloPagina(jogo.titulo);
    renderizarCards([jogo]);

    // Atraso para garantir que o card foi renderizado antes de manipulá-lo
    setTimeout(() => { 
        const card = document.querySelector(".card");
        if (!card) return;

        toggleSinopse(card);

        if (jogo.metacritic !== null && jogo.metacritic !== undefined) {
            const metaDiv = document.createElement("div");
            metaDiv.classList.add("metacritic-box");
            metaDiv.innerHTML = `
                <strong>Metacritic:&nbsp</strong>
                <span class="meta-score"> ${jogo.metacritic}</span>
            `;
            card.querySelector(".card-info")?.appendChild(metaDiv);
        }

        const urlEmbed = jogo['video-embed']; 
        const videoId = urlEmbed.split('/').pop(); 
        mostrarPlayerLateral(videoId);

    }, 150);
}

/**
 * Filtra e exibe apenas os jogos favoritados.
 */
function verFavoritos() {
    atualizarTituloPagina("MEUS FAVORITOS");
    const jogosFavoritados = dados.filter(jogo => listaFavoritos.includes(jogo.titulo));
    renderizarCards(jogosFavoritados);
}

/**
 * Filtra e exibe jogos de uma categoria específica.
 */
function filtrarPorCategoria(cat) {
    atualizarTituloPagina(cat);
    const filtrados = dados.filter(j => j.categorias_indicadas && j.categorias_indicadas.includes(cat));
    renderizarCards(filtrados);
}

/**
 * Filtra e exibe jogos com uma tag específica.
 */
function filtrarPorTag(tag) {
    atualizarTituloPagina(tag);
    const filtrados = dados.filter(j => j.tags && j.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
    renderizarCards(filtrados);
}


// =================================================================================
// --- INICIALIZAÇÃO E EVENT LISTENERS ---
// =================================================================================

/**
 * Cria uma versão "debounced" de uma função que atrasa sua execução até que o usuário pare de invocá-la por um determinado tempo.
 * @param {Function} func A função a ser "debounced".
 * @param {number} delay O tempo de espera em milissegundos.
 * @returns {Function} A nova função "debounced".
 */
function debounce(func, delay) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Carrega os dados assim que a janela carregar
window.addEventListener("load", carregarDados);

// Listeners para a funcionalidade de busca
if(campoBusca) campoBusca.addEventListener("input", debounce(iniciarBusca, 300));

// Listeners para os botões de navegação
if (btnDescubra) btnDescubra.addEventListener("click", descobrirJogo);
if (btnFavoritos) btnFavoritos.addEventListener("click", verFavoritos);
if (tituloPagina) {
    tituloPagina.addEventListener("click", limparFiltros);
    tituloPagina.style.cursor = "pointer";
    tituloPagina.title = "Voltar para a página inicial";
}

// Listeners para o modal
document.getElementById("modal-fechar").addEventListener("click", fecharModal);
document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharModal(); });

function atualizarInterfaceBusca(termo) {
    const resetLinkExistente = document.getElementById("reset-link-btn");
    const h1 = document.querySelector("header h1");
    
    // Se o termo estiver vazio (resetando), remove o link.
    if (termo === "") {
        if (resetLinkExistente) {
            resetLinkExistente.remove();
        }
        return;
    } 
    
    // Se o termo não estiver vazio E o link não existir, injeta o link.
    if (termo !== "" && !resetLinkExistente) {
        const resetLink = document.createElement("a");
        resetLink.id = "reset-link-btn";
        resetLink.classList.add("btn-navegacao"); // Reutiliza estilo de botão
        resetLink.innerText = "Limpar Busca X";
        resetLink.href = "javascript:void(0)"; 
        resetLink.setAttribute("onclick", "limparFiltros()");
        
        // Estilo discreto e compacto
        resetLink.style.fontSize = "0.7rem";
        resetLink.style.padding = "5px 10px";
        resetLink.style.marginLeft = "10px";
        
        // Adiciona o link logo após o h1 (como um irmão)
        h1.insertAdjacentElement('afterend', resetLink);
    }
}

// Já que alteramos a lógica, simplificamos o Limpar Filtros
function limparFiltros() {
    window.history.pushState({}, '', 'index.html'); 
    if (campoBusca) campoBusca.value = '';
    
    // Chama a função de limpeza visual para remover o botão "Limpar Busca"
    atualizarInterfaceBusca(""); 
    
    tituloPagina.innerText = "GOTY CODEX";
    renderizarCards(dados);
}