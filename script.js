"use strict";

// =================================================================================
// FUNÇÕES AUXILIARES E GLOBAIS
// =================================================================================

// Função segura para ler do localStorage, retorna um valor default em caso de erro
function carregarDoStorage(chave, valorDefault = []) {
    try {
        const item = localStorage.getItem(chave);
        return item ? JSON.parse(item) : valorDefault;
    } catch (e) {
        console.error(`Erro ao carregar '${chave}' do localStorage. A usar valor default. Erro:`, e);
        return valorDefault;
    }
}

async function gerarEPartilharImagem(htmlParaImagem, nomeFicheiro) {
    const containerPartilha = document.getElementById('imagem-a-partilhar');
    const conteudoPartilha = document.getElementById('conteudo-imagem');
    
    conteudoPartilha.innerHTML = htmlParaImagem;
    containerPartilha.style.display = 'block';

    try {
        const canvas = await html2canvas(containerPartilha, { scale: 2, useCORS: true });
        canvas.toBlob(async (blob) => {
            if (navigator.share && navigator.canShare({ files: [new File([blob], nomeFicheiro, { type: 'image/png' })] })) {
                try {
                    await navigator.share({
                        files: [new File([blob], nomeFicheiro, { type: 'image/png' })]
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') console.error('Erro ao partilhar:', err);
                }
            } else {
                const link = document.createElement('a');
                link.download = nomeFicheiro;
                link.href = URL.createObjectURL(blob);
                link.click();
                URL.revokeObjectURL(link.href);
            }
        }, 'image/png');
    } catch (err) {
        console.error('Erro ao gerar a imagem:', err);
        alert('Ocorreu um erro ao tentar gerar a imagem.');
    } finally {
        containerPartilha.style.display = 'none';
    }
}

// =================================================================================
// VARIÁVEIS DE ESTADO GLOBAIS
// =================================================================================

let participantes = [];
let historicoDespesas = carregarDoStorage("historicoEventos");
let editandoIndex = null;
let nomesSelecionadosParaAdicionar = [];
const listaPredefinidaDefault = [
    { nomes: ["João Faria", "Tânia Bravo"] }, { nomes: ["Jorge Gimbra", "Sara Catalão"] },
    { nomes: ["Pedro Jerónimo", "Teresa Filipe"] }, { nomes: ["Roberto Silva", "Célia Silva"] },
    { nomes: ["Tiago Louro"] }, { nomes: ["Rui Cresovel", "Inês"] },
    { nomes: ["Vânia Silva"] }, { nomes: ["Rui Moutinho", "Sandra Moutinho"] }
];
let gruposPredefinidos = carregarDoStorage("gruposPredefinidos", listaPredefinidaDefault);
let historicoRefeicoes = carregarDoStorage("historicoRefeicoes");
let ultimoCalculoRefeicao = null;
let listaCompras = carregarDoStorage("listaCompras");
let historicoSugestoes = carregarDoStorage("historicoSugestoes");
let ultimosFiltrosSugestao = null;
const refeicoesDB = [
    { id: 1, nome: "Massa à Bolonhesa", tags: ['massa', 'carne'], tempo: 'normal', kidFriendly: true, light: false, desc: "Um clássico que agrada a todos. Perfeito para um jantar de família.", linkReceita: "https://www.pingodoce.pt/receitas/esparguete-a-bolonhesa-rapido/" },
    { id: 2, nome: "Bifes de Frango Grelhados com Arroz e Salada", tags: ['frango', 'salada', 'arroz', 'rapido'], tempo: 'rapido', kidFriendly: true, light: true, desc: "Uma refeição leve, rápida e saudável. O frango grelhado é sempre uma aposta segura.", linkReceita: "https://www.saborintenso.com/f23/bifes-frango-grelhados-arroz-cenoura-3972/" },
    { id: 3, nome: "Douradinhos no Forno com Arroz de Tomate", tags: ['peixe', 'arroz'], tempo: 'normal', kidFriendly: true, light: true, desc: "Os douradinhos são um favorito das crianças, e feitos no forno ficam mais saudáveis.", linkReceita: "https://www.teleculinaria.pt/receitas/peixe/douradinhos-com-arroz-de-tomate-e-coentros/" },
    { id: 4, nome: "Massa com Atum e Cogumelos", tags: ['massa', 'peixe', 'atum', 'cogumelos', 'rapido'], tempo: 'rapido', kidFriendly: true, light: false, desc: "Incrivelmente rápido e cremoso. Uma solução perfeita para dias de pressa.", linkReceita: "https://www.pingodoce.pt/receitas/massa-salteada-com-atum-e-cogumelos/" },
    { id: 5, nome: "Omelete de Queijo e Fiambre com Salada", tags: ['ovos', 'salada', 'rapido'], tempo: 'rapido', kidFriendly: true, light: true, desc: "Versátil e rapidíssima. Pode juntar os legumes que tiver no frigorífico.", linkReceita: "https://www.pingodoce.pt/receitas/omeleta-mista-com-salada/" },
    { id: 6, nome: "Rojões de Porco à Portuguesa", tags: ['carne', 'porco'], tempo: 'normal', kidFriendly: false, light: false, desc: "Um prato robusto e cheio de sabor, para um jantar com mais tempo e apetite.", linkReceita: "https://www.saborintenso.com/f18/rojoes-moda-minho-48/" },
    { id: 7, nome: "Salada Caesar com Frango", tags: ['salada', 'frango', 'rapido'], tempo: 'rapido', kidFriendly: false, light: true, desc: "Uma salada completa que serve como refeição principal. Leve mas satisfatória.", linkReceita: "https://www.continente.pt/receitas/salada-caesar-com-frango/" },
    { id: 8, nome: "Strogonoff de Frango", tags: ['frango', 'carne', 'cogumelos'], tempo: 'normal', kidFriendly: true, light: false, desc: "Um prato cremoso e reconfortante que é surpreendentemente fácil de fazer.", linkReceita: "https://www.teleculinaria.pt/receitas/aves/strogonoff-de-frango-simples/" },
    { id: 9, nome: "Nuggets Caseiros com Esparguete", tags: ['frango', 'massa', 'carne', 'rapido'], tempo: 'rapido', kidFriendly: true, light: false, desc: "A combinação preferida da pequenada para um dia especial, como o dos trampolins!", linkReceita: "https://www.continente.pt/receitas/nuggets-de-frango-com-esparguete/" },
    { id: 10, nome: "Salmão Grelhado com Legumes", tags: ['peixe', 'salada'], tempo: 'normal', kidFriendly: true, light: true, desc: "Uma opção muito saudável e saborosa para uma refeição equilibrada.", linkReceita: "https://www.pingodoce.pt/receitas/salmao-grelhado-com-batata-doce-e-brocolos/" },
    { id: 11, nome: "Bitoque com Batata Frita e Ovo", tags: ['carne', 'batata_frita', 'ovos', 'rapido'], tempo: 'rapido', kidFriendly: true, light: false, desc: "O 'bitoque'. Um prato rápido, delicioso e um clássico que nunca falha.", linkReceita: "https://www.saborintenso.com/f18/bitoque-vaca-340/" },
    { id: 12, nome: "Risotto de Cogumelos", tags: ['arroz', 'cogumelos'], tempo: 'normal', kidFriendly: false, light: false, desc: "Um prato vegetariano, cremoso e sofisticado para uma noite mais calma.", linkReceita: "https://www.pingodoce.pt/receitas/risotto-de-cogumelos-com-tomilho/" },
    { id: 13, nome: "Ovos Rotos com Chouriço", tags: ['ovos', 'carne', 'batata_frita', 'rapido'], tempo: 'rapido', kidFriendly: false, light: false, desc: "Uma tapa espanhola que funciona perfeitamente como um jantar rápido e delicioso.", linkReceita: "https://www.teleculinaria.pt/receitas/entradas/ovos-rotos-com-chouricao/" },
    { id: 14, nome: "Empadão de Carne com Arroz", tags: ['carne', 'arroz'], tempo: 'normal', kidFriendly: true, light: false, desc: "Comida de conforto no seu melhor. O empadão é sempre um sucesso com toda a família.", linkReceita: "https://www.saborintenso.com/f18/empadao-carne-arroz-4670/" }
];
const pesosEquivalentes = {
    Bifanas: 80, Entremeadas: 70, Hambúrgueres: 110, Salsichas: 60,
};

// =================================================================================
// INICIALIZAÇÃO E LÓGICA GERAL DA PÁGINA
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    try {
        setupEventListeners();
        
        // Inicia a aplicação mostrando o primeiro separador e carregando os dados iniciais
        const primeiroBotao = document.querySelector('.tab-button');
        if (primeiroBotao) {
            openTab({ currentTarget: primeiroBotao }, 'despesas');
        }

        iniciarNovoEvento(false);
        renderListaCompras();
        renderizarHistorico('despesas');
    } catch (error) {
        console.error("Erro crítico na inicialização da aplicação:", error);
        alert("Ocorreu um erro grave ao carregar a aplicação. Por favor, tente limpar os dados de navegação.");
    }
});

function setupEventListeners() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => { modal.style.display = 'none'; };
        }
    });

    window.onclick = (event) => {
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        });
    };
}

function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  const tabbuttons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabbuttons.length; i++) {
    tabbuttons[i].classList.remove("active");
  }
  const tabAtiva = document.getElementById(tabName);
  if (tabAtiva) {
    tabAtiva.style.display = "flex";
  }
  if (evt && evt.currentTarget) {
    evt.currentTarget.classList.add("active");
  }
}

// ... (Todo o resto do código para cada separador segue aqui, exatamente como na resposta anterior)
// ... As funções para Despesas, Grupos, Refeições, Sugestões, Compras e Histórico ...
// ... O código completo está na resposta anterior. Apenas a estrutura de inicialização e a ordem foram alteradas para garantir a estabilidade.
