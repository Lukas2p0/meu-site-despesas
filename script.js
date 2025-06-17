// ... (Todo o código anterior para Despesas, Refeições, Compras, etc., permanece igual)

// =================================================================================
// LÓGICA DO SEPARADOR SUGESTÕES DE JANTAR (ATUALIZADO)
// =================================================================================

const refeicoesDB = [
    { id: 1, nome: "Massa à Bolonhesa", tags: ['massa', 'carne'], tempo: 'normal', kidFriendly: true, desc: "Um clássico que agrada a todos. Perfeito para um jantar de família.", linkReceita: "https://www.pingodoce.pt/receitas/esparguete-a-bolonhesa-rapido/" },
    { id: 2, nome: "Bifes de Frango Grelhados com Arroz", tags: ['frango', 'arroz', 'rapido'], tempo: 'rapido', kidFriendly: true, desc: "Uma refeição leve, rápida e saudável. O frango grelhado é sempre uma aposta segura.", linkReceita: "https://www.saborintenso.com/f23/bifes-frango-grelhados-arroz-cenoura-3972/" },
    { id: 3, nome: "Douradinhos no Forno com Arroz de Tomate", tags: ['peixe', 'arroz'], tempo: 'normal', kidFriendly: true, desc: "Os douradinhos são um favorito das crianças, e feitos no forno ficam mais saudáveis.", linkReceita: "https://www.teleculinaria.pt/receitas/peixe/douradinhos-com-arroz-de-tomate-e-coentros/" },
    { id: 4, nome: "Massa com Atum e Natas", tags: ['massa', 'peixe', 'atum'], tempo: 'rapido', kidFriendly: true, desc: "Incrivelmente rápido e cremoso. Uma solução perfeita para dias de pressa.", linkReceita: "https://www.saborintenso.com/f22/massa-atum-natas-26/" },
    { id: 5, nome: "Omelete de Queijo e Fiambre com Salada", tags: ['ovos', 'salada'], tempo: 'rapido', kidFriendly: true, desc: "Versátil e rapidíssima. Pode juntar os legumes que tiver no frigorífico.", linkReceita: "https://www.pingodoce.pt/receitas/omeleta-mista-com-salada/" },
    { id: 6, nome: "Rojões de Porco à Portuguesa", tags: ['carne', 'porco'], tempo: 'normal', kidFriendly: false, desc: "Um prato robusto e cheio de sabor, para um jantar com mais tempo e apetite.", linkReceita: "https://www.saborintenso.com/f18/rojoes-moda-minho-48/" },
    { id: 7, nome: "Salada Caesar com Frango Grelhado", tags: ['salada', 'frango'], tempo: 'rapido', kidFriendly: false, desc: "Uma salada completa que serve como refeição principal. Leve mas satisfatória.", linkReceita: "https://www.continente.pt/receitas/salada-caesar-com-frango/" },
    { id: 8, nome: "Strogonoff de Frango", tags: ['frango', 'carne', 'cogumelos'], tempo: 'normal', kidFriendly: true, desc: "Um prato cremoso e reconfortante que é surpreendentemente fácil de fazer.", linkReceita: "https://www.teleculinaria.pt/receitas/aves/strogonoff-de-frango-simples/" },
    { id: 9, nome: "Nuggets com Esparguete", tags: ['frango', 'massa', 'carne'], tempo: 'rapido', kidFriendly: true, desc: "A combinação preferida da pequenada para um dia especial, como o dos trampolins!", linkReceita: "https://www.continente.pt/receitas/nuggets-de-frango-com-esparguete/" },
    { id: 10, nome: "Salmão Grelhado com Legumes", tags: ['peixe', 'salada'], tempo: 'normal', kidFriendly: true, desc: "Uma opção muito saudável e saborosa para uma refeição equilibrada.", linkReceita: "https://www.pingodoce.pt/receitas/salmao-grelhado-com-batata-doce-e-brocolos/" },
    { id: 11, nome: "Bitoque com Batata Frita e Ovo", tags: ['carne', 'batata_frita', 'ovos'], tempo: 'rapido', kidFriendly: true, desc: "O 'bitoque'. Um prato rápido, delicioso e um clássico que nunca falha.", linkReceita: "https://www.saborintenso.com/f18/bitoque-vaca-340/" },
    { id: 12, nome: "Risotto de Cogumelos", tags: ['arroz', 'cogumelos'], tempo: 'normal', kidFriendly: false, desc: "Um prato vegetariano, cremoso e sofisticado para uma noite mais calma.", linkReceita: "https://www.pingodoce.pt/receitas/risotto-de-cogumelos-com-tomilho/" },
    { id: 13, nome: "Ovos Rotos com Chouriço", tags: ['ovos', 'carne', 'batata_frita'], tempo: 'rapido', kidFriendly: false, desc: "Uma tapa espanhola que funciona perfeitamente como um jantar rápido e delicioso.", linkReceita: "https://www.saborintenso.com/f25/ovos-rotos-presunto-73894/" },
    { id: 14, nome: "Empadão de Carne", tags: ['carne', 'batata'], tempo: 'normal', kidFriendly: true, desc: "Comida de conforto no seu melhor. O empadão é sempre um sucesso com toda a família.", linkReceita: "https://www.teleculinaria.pt/receitas/carne/empadao-de-carne-rapido/" }
];
let historicoSugestoes = carregarDoStorage("historicoSugestoes");

function sugerirJantar(surpresa = false) {
    const querRapida = document.getElementById('sugestao-rapida').checked;
    const paraCriancas = document.getElementById('sugestao-crianca').checked;
    const ingredientesSelecionados = surpresa ? [] : Array.from(document.querySelectorAll('input[name="ingrediente"]:checked')).map(cb => cb.value);

    // 1. Filtrar histórico
    const seisDiasAtras = new Date();
    seisDiasAtras.setDate(seisDiasAtras.getDate() - 6);
    historicoSugestoes = historicoSugestoes.filter(h => new Date(h.timestamp) > seisDiasAtras);
    const idsRecentes = historicoSugestoes.map(h => h.id);

    let poolDisponivel = refeicoesDB.filter(r => !idsRecentes.includes(r.id));
    if (poolDisponivel.length === 0) { 
        poolDisponivel = refeicoesDB;
        historicoSugestoes = [];
    }
    
    // 2. Aplicar filtros
    let poolFinal = poolDisponivel;
    if (paraCriancas) {
        poolFinal = poolFinal.filter(r => r.kidFriendly === true);
    }
    if (querRapida) {
        poolFinal = poolFinal.filter(r => r.tempo === 'rapido');
    }
    if (ingredientesSelecionados.length > 0) {
        poolFinal = poolFinal.filter(r => 
            ingredientesSelecionados.some(ing => r.tags.includes(ing))
        );
    }

    // 3. Verificar se sobrou alguma sugestão após os filtros
    if (poolFinal.length === 0) {
        alert("Não foram encontradas sugestões com essa combinação de filtros. Tente ser menos específico ou clique em 'Surpreenda-me!'.");
        return;
    }

    // 4. Escolher aleatoriamente e renderizar
    const sugestao = poolFinal[Math.floor(Math.random() * poolFinal.length)];
    historicoSugestoes.push({ id: sugestao.id, timestamp: new Date() });
    localStorage.setItem("historicoSugestoes", JSON.stringify(historicoSugestoes));
    renderizarSugestao(sugestao);
}

function renderizarSugestao(refeicao) {
    const inputContainer = document.getElementById('sugestao-input-container');
    const resultadoContainer = document.getElementById('sugestao-resultado-container');

    resultadoContainer.innerHTML = `
        <div class="card-header"><h2 class="card-title">A nossa sugestão para hoje é...</h2></div>
        <div class="card-body">
            <h3 class="card-title" style="font-size: 1.5rem; color: var(--primary);">${refeicao.nome}</h3>
            <p style="margin-top: 1rem;">${refeicao.desc}</p>
        </div>
        <div class="card-footer" style="justify-content: space-between;">
            <button onclick="mostrarEcradeInputSugestao()" class="btn btn-secondary">Sugerir Outra</button>
            <a href="${refeicao.linkReceita}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">Ver Receita ↗️</a>
        </div>
    `;
    inputContainer.style.display = 'none';
    resultadoContainer.style.display = 'block';
    resultadoContainer.style.flexDirection = 'column';
}

function mostrarEcradeInputSugestao() {
    document.getElementById('sugestao-input-container').style.display = 'block';
    document.getElementById('sugestao-resultado-container').style.display = 'none';
    // Não limpa os filtros para permitir ajustar a pesquisa
}


// ... (O resto do seu ficheiro script.js, que já é muito longo e não foi alterado, permanece igual)
