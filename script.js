// =================================================================================
// INICIALIZAÇÃO E LÓGICA GERAL
// =================================================================================

// Função segura para ler do localStorage
function carregarDoStorage(chave, valorDefault = []) {
    try {
        const item = localStorage.getItem(chave);
        return item ? JSON.parse(item) : valorDefault;
    } catch (e) {
        console.error(`Erro ao carregar '${chave}' do localStorage:`, e);
        return valorDefault;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Inicia o primeiro separador
    openTab({ currentTarget: document.querySelector('.tab-button') }, 'despesas');

    // Inicia as diferentes secções
    iniciarNovoEvento(false);
    renderListaCompras();
    renderizarHistorico('despesas');
    
    // Lógica dos Modais
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
});

function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  const tabbuttons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabbuttons.length; i++) {
    tabbuttons[i].classList.remove("active");
  }
  document.getElementById(tabName).style.display = "flex";
  evt.currentTarget.classList.add("active");
}

// =================================================================================
// LÓGICA DO SEPARADOR DESPESAS E GRUPOS
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

function abrirModalGrupos() {
    nomesSelecionadosParaAdicionar = [];
    renderizarGrupos();
    document.getElementById('modal-grupos').style.display = 'block';
}

function fecharModalGrupos() { document.getElementById('modal-grupos').style.display = 'none'; }
function fecharModalValores() { document.getElementById('modal-valores').style.display = 'none'; }

function renderizarGrupos() {
    const container = document.getElementById('lista-grupos');
    container.innerHTML = '';
    if (gruposPredefinidos.length === 0) {
        container.innerHTML = '<p>Nenhum grupo pré-definido. Adicione um abaixo.</p>';
        return;
    }
    gruposPredefinidos.forEach((grupo, index) => {
        const grupoDiv = document.createElement('div');
        grupoDiv.className = 'grupo-item';
        
        let nomesHtml = grupo.nomes.map(nome => {
            const isSelected = nomesSelecionadosParaAdicionar.includes(nome);
            return `<button class="btn btn-secondary ${isSelected ? 'active' : ''}" onclick="toggleSelecaoGrupo(this, '${nome.replace(/'/g, "\\'")}')">${nome}</button>`;
        }).join('');

        grupoDiv.innerHTML = `
            <div class="grupo-header">
                <h3 class="card-title" style="font-size: 1rem;">${grupo.nomes.join(' e ')}</h3>
                <div>
                    <button class="btn btn-secondary" onclick="editarGrupo(${index})">✏️</button>
                    <button class="btn btn-danger" onclick="eliminarGrupo(${index})">🗑️</button>
                </div>
            </div>
            <div class="grupo-nomes">${nomesHtml}</div>
        `;
        container.appendChild(grupoDiv);
    });
}

function toggleSelecaoGrupo(button, nome) {
    button.classList.toggle('active');
    const index = nomesSelecionadosParaAdicionar.indexOf(nome);
    if (index > -1) {
        nomesSelecionadosParaAdicionar.splice(index, 1);
    } else {
        nomesSelecionadosParaAdicionar.push(nome);
    }
}

function processarAdicionarSelecionados() {
    if (nomesSelecionadosParaAdicionar.length === 0) {
        alert("Nenhum participante selecionado.");
        return;
    }
    const valoresBody = document.getElementById('valores-body');
    valoresBody.innerHTML = '';
    nomesSelecionadosParaAdicionar.forEach(nome => {
        const cleanNome = nome.replace(/[^a-zA-Z0-9]/g, '');
        const inputRow = document.createElement('div');
        inputRow.className = 'input-grid';
        inputRow.innerHTML = `<label for="valor-de-${cleanNome}">${nome}:</label><input type="number" id="valor-de-${cleanNome}" placeholder="Valor gasto (€)" />`;
        valoresBody.appendChild(inputRow);
    });
    fecharModalGrupos();
    document.getElementById('modal-valores').style.display = 'block';
}

function guardarValoresBatch() {
    nomesSelecionadosParaAdicionar.forEach(nome => {
        const cleanNome = nome.replace(/[^a-zA-Z0-9]/g, '');
        const valorInput = document.getElementById(`valor-de-${cleanNome}`);
        const valor = parseFloat(valorInput.value || '0');
        adicionarParticipante(nome, valor);
    });
    fecharModalValores();
    atualizar();
}

function adicionarNovoGrupo() {
    const input = document.getElementById('novo-grupo-input');
    const nomes = input.value.split(',').map(n => n.trim()).filter(n => n);
    if (nomes.length > 0) {
        gruposPredefinidos.push({ nomes });
        localStorage.setItem("gruposPredefinidos", JSON.stringify(gruposPredefinidos));
        renderizarGrupos();
        input.value = '';
    } else {
        alert("Por favor, insira pelo menos um nome.");
    }
}

function editarGrupo(index) {
    const grupoAtual = gruposPredefinidos[index];
    const nomesAtuais = grupoAtual.nomes.join(', ');
    const novosNomesStr = prompt(`Editar grupo (nomes separados por vírgula):`, nomesAtuais);
    if (novosNomesStr) {
        const novosNomes = novosNomesStr.split(',').map(n => n.trim()).filter(n => n);
        if (novosNomes.length > 0) {
            gruposPredefinidos[index] = { nomes: novosNomes };
            localStorage.setItem("gruposPredefinidos", JSON.stringify(gruposPredefinidos));
            renderizarGrupos();
        }
    }
}

function eliminarGrupo(index) {
    if (confirm("Tem a certeza que deseja eliminar este grupo da sua lista pré-definida?")) {
        gruposPredefinidos.splice(index, 1);
        localStorage.setItem("gruposPredefinidos", JSON.stringify(gruposPredefinidos));
        renderizarGrupos();
    }
}

function adicionarParticipante(nome, valor) {
    if (!nome) return;
    participantes.push({ nome, valor });
}

function adicionarManualmente() {
  const nome = document.getElementById('nome').value;
  if (!nome) {
      alert('Por favor, preencha o nome do participante.');
      return;
  }
  const valor = parseFloat(document.getElementById('valor').value || '0');
  adicionarParticipante(nome, valor);
  document.getElementById('nome').value = '';
  document.getElementById('valor').value = '';
  atualizar();
}

function iniciarNovoEvento(confirmar = true) {
  if (confirmar && participantes.length > 0) {
    if (!confirm("Tem a certeza que quer limpar o evento atual? Perderá todos os dados não guardados.")) return;
  }
  participantes = [];
  editandoIndex = null;
  document.getElementById('evento').value = '';
  document.getElementById('data').valueAsDate = new Date();
  atualizar();
  if (confirmar) {
      window.scrollTo(0, 0);
      document.getElementById('evento').focus();
  }
}

function carregarEventoParaEdicao(index, event) {
  event.stopPropagation();
  const i = historicoDespesas.length - 1 - index;
  if (participantes.length > 0 && editandoIndex === null) {
    if (!confirm("Isto irá substituir o evento que está a criar. Deseja continuar?")) return;
  }
  openTab({currentTarget: document.querySelector('.tab-button[onclick*="despesas"]')}, 'despesas');
  const ev = historicoDespesas[i];
  editandoIndex = i;
  document.getElementById('evento').value = ev.nomeEvento;
  document.getElementById('data').value = ev.data;
  participantes = ev.balancos.map(b => ({ nome: b.nome, valor: b.valor }));
  atualizar();
  window.scrollTo(0, 0);
  alert(`Evento "${ev.nomeEvento}" carregado para edição.`);
}

function editarParticipante(index) {
  const atual = participantes[index];
  const novoNome = prompt("Editar nome:", atual.nome);
  const novoValorStr = prompt("Editar valor:", atual.valor);
  const novoValor = parseFloat(novoValorStr);
  if (novoNome !== null && !isNaN(novoValor)) {
    participantes[index] = { nome: novoNome, valor: novoValor };
    atualizar();
  }
}

function eliminarParticipante(index) {
  if (confirm("Tem a certeza que deseja eliminar este participante?")) {
    participantes.splice(index, 1);
    atualizar();
  }
}

function guardar() {
  const nomeEvento = document.getElementById('evento').value || "Evento sem nome";
  if (participantes.length === 0) return alert('Adicione pelo menos um participante antes de guardar.');
  const data = document.getElementById('data').value || new Date().toISOString().split('T')[0];
  const total = participantes.reduce((s, p) => s + p.valor, 0);
  const num = participantes.length;
  const custo = num ? total / num : 0;
  const balancos = participantes.map(p => ({ nome: p.nome, valor: p.valor, saldo: p.valor - custo }));
  const reembolsos = calcularTransacoes();
  const evento = { nomeEvento, data, total, custo, balancos, reembolsos };

  if (editandoIndex !== null) {
    historicoDespesas[editandoIndex] = evento;
    alert(`Evento "${nomeEvento}" atualizado com sucesso!`);
  } else {
    historicoDespesas.push(evento);
    alert(`Evento "${nomeEvento}" guardado com sucesso!`);
  }
  
  localStorage.setItem("historicoEventos", JSON.stringify(historicoDespesas));
  renderizarHistorico('despesas');
  iniciarNovoEvento();
}

function calcularTransacoes() {
    const total = participantes.reduce((s, p) => s + p.valor, 0);
    const num = participantes.length;
    if (num === 0) return [];
    const custo = total / num;
    const balancos = participantes.map(p => ({ ...p, saldo: p.valor - custo }));
    let credores = balancos.filter(p => p.saldo > 0.005).map(p => ({...p}));
    let devedores = balancos.filter(p => p.saldo < -0.005).map(p => ({...p}));
    let transacoes = [];
    devedores.sort((a,b) => a.saldo - b.saldo);
    credores.sort((a,b) => b.saldo - a.saldo);
    for (let d of devedores) {
        let divida = -d.saldo;
        for (let c of credores) {
            if (divida < 0.01) break;
            const receber = Math.min(divida, c.saldo);
            if(receber > 0){
                transacoes.push(`${d.nome} deve pagar ${receber.toFixed(2)} € a ${c.nome}`);
                c.saldo -= receber;
                divida -= receber;
            }
        }
    }
    return transacoes;
}

function atualizar() {
  const total = participantes.reduce((s, p) => s + p.valor, 0);
  const num = participantes.length;
  const custo = num > 0 ? total / num : 0;
  document.getElementById('resumo').innerHTML = `<div class="stat-card"><div class="stat-title">Total Gasto</div><div id="total-gasto" class="stat-value">${total.toFixed(2)} €</div></div><div class="stat-card"><div class="stat-title">Nº Participantes</div><div id="num-participantes" class="stat-value">${num}</div></div><div class="stat-card"><div class="stat-title">Custo por Pessoa</div><div id="custo-pessoa" class="stat-value">${custo.toFixed(2)} €</div></div>`;
  let htmlLista = `<div class="card-header"><h2 class="card-title">Balanço Individual</h2></div>`;
  if (participantes.length > 0) {
    htmlLista += '<div class="table-wrapper"><table><thead><tr><th>Nome</th><th>Valor Gasto</th><th>Balanço</th><th class="actions">Ações</th></tr></thead><tbody>';
    participantes.forEach((p, i) => {
      const saldo = p.valor - custo;
      const classe = saldo < -0.005 ? 'negativo' : saldo > 0.005 ? 'positivo' : '';
      htmlLista += `<tr><td><strong>${p.nome}</strong></td><td>${p.valor.toFixed(2)} €</td><td><span class="${classe}">${saldo.toFixed(2)} €</span></td><td class="actions"><button onclick="editarParticipante(${i})" class="btn btn-secondary" title="Editar">✏️</button><button onclick="eliminarParticipante(${i})" class="btn btn-danger" title="Eliminar">🗑️</button></td></tr>`;
    });
    htmlLista += '</tbody></table></div>';
  } else {
    htmlLista += '<div class="card-body"><p>Adicione os gastos de cada participante para ver o balanço.</p></div>';
  }
  document.getElementById('lista').innerHTML = htmlLista;
  const transacoes = calcularTransacoes();
  let htmlReembolsos = `<div class="card-header"><h2 class="card-title">Acerto de Contas</h2></div>`;
  if (participantes.length > 0 && transacoes.length > 0) {
      htmlReembolsos += `<div class="table-wrapper"><table><thead><tr><th>Transação Sugerida</th></tr></thead><tbody>`;
      transacoes.forEach(t => { htmlReembolsos += `<tr><td>${t}</td></tr>`; });
      htmlReembolsos += `</tbody></table></div><div class="card-footer"><button onclick="guardar()" class="btn btn-primary">${editandoIndex !== null ? 'Guardar Alterações' : 'Guardar Evento'}</button><button onclick="partilharReembolsos()" class="btn btn-secondary">Partilhar Reembolsos</button></div>`;
  } else if (participantes.length > 0) {
      htmlReembolsos += `<div class="card-body"><p>Não são necessários reembolsos.</p></div> <div class="card-footer"><button onclick="guardar()" class="btn btn-primary">${editandoIndex !== null ? 'Guardar Alterações' : 'Guardar Evento'}</button></div>`;
  } else {
      htmlReembolsos += '<div class="card-body"><p>Adicione participantes para ver as sugestões.</p></div>';
  }
  document.getElementById('reembolsos').innerHTML = htmlReembolsos;
}

// =================================================================================
// LÓGICA DE PARTILHA DE IMAGEM (CENTRALIZADA)
// =================================================================================
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

async function partilharReembolsos() {
    const transacoes = calcularTransacoes();
    if (transacoes.length === 0) {
        alert("Não há reembolsos para partilhar.");
        return;
    }
    const nomeEvento = document.getElementById('evento').value || "Acerto de Contas";
    let transacoesHtml = transacoes.map(t => `<p style="font-size: 1.1rem; text-align: left; margin: 0.5rem 0;">${t}</p>`).join('');
    const htmlFinal = `
      <div style="padding: 1rem;">
        <h2 style="text-align: center; color: var(--heading); margin-bottom: 1.5rem;">💸 Reembolsos: ${nomeEvento}</h2>
        ${transacoesHtml}
      </div>`;
    gerarEPartilharImagem(htmlFinal, 'reembolsos.png');
}

// =================================================================================
// LÓGICA DO SEPARADOR REFEIÇÕES
// =================================================================================
let historicoRefeicoes = carregarDoStorage("historicoRefeicoes");
let ultimoCalculoRefeicao = null;

const pesosEquivalentes = {
    Bifanas: 80, Entremeadas: 70, Hambúrgueres: 110, Salsichas: 60,
};

function calcularRefeicao() {
    const adultos = parseInt(document.getElementById('num-adultos').value) || 0;
    const criancas = parseInt(document.getElementById('num-criancas').value) || 0;
    document.getElementById('ajuste-fino-container').style.display = 'none';
    document.getElementById('ajuste-mulheres').value = '';
    document.getElementById('ajuste-comiloes').value = '';
    const resultado = calcularQuantidades(adultos, criancas);
    renderizarResultadoRefeicao(resultado, adultos, criancas);
}

function reajustarCarnes() {
    const adultosBase = parseInt(document.getElementById('num-adultos').value) || 0;
    const criancas = parseInt(document.getElementById('num-criancas').value) || 0;
    const numMulheres = parseInt(document.getElementById('ajuste-mulheres').value) || 0;
    const numComiloes = parseInt(document.getElementById('ajuste-comiloes').value) || 0;
    if (numMulheres + numComiloes > adultosBase) {
        alert("O número de mulheres e 'comilões' não pode exceder o número total de adultos.");
        return;
    }
    const numNormais = adultosBase - numMulheres - numComiloes;
    const adultosEquivalentes = (numNormais * 1) + (numMulheres * (2/3)) + (numComiloes * 1.5);
    const resultado = calcularQuantidades(adultosBase, criancas, adultosEquivalentes);
    renderizarResultadoRefeicao(resultado, adultosBase, criancas);
}

function calcularQuantidades(adultos, criancas, adultosEquivalentesParaCarne = null) {
    const totalPessoas = adultos + criancas;
    const adultosParaCarne = adultosEquivalentesParaCarne !== null ? adultosEquivalentesParaCarne : adultos;
    const querCerveja = document.getElementById('check-cerveja').checked;
    const querVinho = document.getElementById('check-vinho').checked;
    const querSumosAdultos = document.getElementById('check-sumos-adultos').checked;
    const querAzeitonas = document.getElementById('check-azeitonas').checked;
    const querPate = document.getElementById('check-pate').checked;
    const querChourico = document.getElementById('check-chourico').checked;
    const querArroz = document.getElementById('check-arroz').checked;
    const querSalada = document.getElementById('check-salada').checked;
    const querPao = document.getElementById('check-pao').checked;
    const querBolinhas = document.getElementById('check-bolinhas').checked;
    const querBatatas = document.getElementById('check-batatas').checked;
    const carnesSelecionadas = Array.from(document.querySelectorAll('input[name="carne"]:checked')).map(cb => cb.value);

    let resultados = { aperitivos: [], bebidas: [], carnes: [], acompanhamentos: [] };
    
    if (querAzeitonas) resultados.aperitivos.push({ item: 'Azeitonas', qtd: `${Math.ceil(totalPessoas / 7)} emb.` });
    if (querPate) resultados.aperitivos.push({ item: 'Patê de Atum', qtd: `${Math.ceil(totalPessoas / 6)} emb.` });
    if (querChourico) resultados.aperitivos.push({ item: 'Chouriço', qtd: `${Math.ceil(adultos / 6)} unidade(s)` });

    if (querCerveja) resultados.bebidas.push({ item: 'Cerveja', qtd: `${adultos * 3} unidades` });
    if (querVinho) resultados.bebidas.push({ item: 'Vinho', qtd: `${Math.ceil((adultos / 10) * 3)} garrafa(s)` });
    
    let qtdSumos = 0;
    if (criancas > 0) qtdSumos += Math.ceil(criancas / 3);
    if (querSumosAdultos) qtdSumos += Math.ceil(adultos / 8);
    if (qtdSumos > 0) resultados.bebidas.push({ item: 'Sumos', qtd: `${qtdSumos} garrafa(s) (1.5L)`});
    
    if (carnesSelecionadas.length > 0) {
        let apetiteTotalKg = (adultosParaCarne * 0.400) + (criancas * 0.200);
        const querSalsichas = carnesSelecionadas.includes('Salsichas');
        let carnesParaBalancear = carnesSelecionadas.filter(c => c !== 'Salsichas');
        
        if (querSalsichas) {
            const qtdSalsichas = Math.ceil(totalPessoas / 2);
            resultados.carnes.push({ item: 'Salsichas', qtd: `${qtdSalsichas} unidades` });
            const apetiteConsumido = qtdSalsichas * (pesosEquivalentes.Salsichas / 1000);
            apetiteTotalKg -= apetiteConsumido;
        }

        if (carnesParaBalancear.length > 0 && apetiteTotalKg > 0) {
            const apetitePorTipoKg = apetiteTotalKg / carnesParaBalancear.length;
            
            carnesParaBalancear.forEach(carne => {
                if (pesosEquivalentes[carne]) {
                    let numUnidades = Math.ceil((apetitePorTipoKg * 1000) / pesosEquivalentes[carne]);
                    if (carne === 'Hambúrgueres' && carnesSelecionadas.length > 2) {
                        numUnidades = Math.ceil(numUnidades / 2);
                    }
                    resultados.carnes.push({ item: `${carne}`, qtd: `${numUnidades} unidades` });
                } else {
                    resultados.carnes.push({ item: `${carne}`, qtd: `${apetitePorTipoKg.toFixed(2)} kg` });
                }
            });
        }
    }
    
    if (querArroz) resultados.acompanhamentos.push({ item: 'Arroz', qtd: `${(((totalPessoas / 3) * 0.2) * 0.8).toFixed(2)} kg (cru)` });
    if (querSalada) resultados.acompanhamentos.push({ item: 'Salada', qtd: `${Math.ceil(totalPessoas / 6)} kit(s)` });
    if (querPao) {
        let qtdPao;
        if (totalPessoas <= 5) qtdPao = 2;
        else if (totalPessoas <= 10) qtdPao = 3;
        else if (totalPessoas <= 15) qtdPao = 4;
        else if (totalPessoas <= 25) qtdPao = 5;
        else qtdPao = 6;
        resultados.acompanhamentos.push({ item: 'Pão (Cacete)', qtd: `${qtdPao} unidades` });
    }
    if(querBolinhas) resultados.acompanhamentos.push({ item: 'Bolinhas de Pão', qtd: `${(adultos * 2) + criancas} unidades` });
    if (querBatatas) resultados.acompanhamentos.push({ item: 'Batatas Fritas', qtd: `${Math.ceil(totalPessoas / 4)} pacote(s)` });

    return resultados;
}

function renderizarResultadoRefeicao(resultados, adultos, criancas) {
    const resultadoDiv = document.getElementById('resultado-refeicao');
    const footerDiv = document.getElementById('refeicao-footer');
    const ajusteFinoDiv = document.getElementById('ajuste-fino-container');
    
    let htmlFinal = '';
    const categorias = {
        aperitivos: '🧀 Aperitivos', bebidas: '🍻 Bebidas', carnes: '🥩 Carnes', acompanhamentos: '🥗 Acompanhamentos'
    };

    let totalResultados = 0;
    for (const categoria in categorias) {
        if (resultados[categoria] && resultados[categoria].length > 0) {
            totalResultados++;
            htmlFinal += `<h4 class="card-title" style="font-size:1rem; margin-top:1rem;">${categorias[categoria]}</h4>`;
            resultados[categoria].forEach(r => { htmlFinal += `<p><strong>${r.item}:</strong> ${r.qtd}</p>`; });
        }
    }

    if (totalResultados > 0) {
        resultadoDiv.innerHTML = `<div class="results-container">${htmlFinal}</div>`;
        footerDiv.style.display = 'flex';
        ajusteFinoDiv.style.display = 'block';
        ultimoCalculoRefeicao = { data: new Date().toISOString().split('T')[0], adultos, criancas, resultados };
    } else {
        resultadoDiv.innerHTML = '';
        footerDiv.style.display = 'none';
        ajusteFinoDiv.style.display = 'none';
        ultimoCalculoRefeicao = null;
    }
}

function limparRefeicao() {
    document.getElementById('num-adultos').value = 0;
    document.getElementById('num-criancas').value = 0;
    document.querySelectorAll('#refeicoes input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.getElementById('resultado-refeicao').innerHTML = '';
    document.getElementById('refeicao-footer').style.display = 'none';
    document.getElementById('ajuste-fino-container').style.display = 'none';
    ultimoCalculoRefeicao = null;
}

function guardarRefeicao() {
    if (!ultimoCalculoRefeicao) {
        alert("Calcule primeiro uma refeição para poder guardar.");
        return;
    }
    const nomeRefeicao = prompt("Dê um nome a este cálculo de refeição:", `Refeição de ${ultimoCalculoRefeicao.data}`);
    if (nomeRefeicao) {
        ultimoCalculoRefeicao.nome = nomeRefeicao;
        historicoRefeicoes.push(ultimoCalculoRefeicao);
        localStorage.setItem("historicoRefeicoes", JSON.stringify(historicoRefeicoes));
        alert(`Cálculo "${nomeRefeicao}" guardado com sucesso!`);
        renderizarHistorico('refeicoes');
    }
}

async function partilharRefeicaoComoImagem() {
    if (!ultimoCalculoRefeicao) {
        alert("Não há resultados para partilhar.");
        return;
    }
    let htmlResultados = '';
    const categorias = {
        aperitivos: '🧀 Aperitivos', bebidas: '🍻 Bebidas', carnes: '🥩 Carnes', acompanhamentos: '🥗 Acompanhamentos'
    };
     for (const categoria in categorias) {
        if (ultimoCalculoRefeicao.resultados[categoria] && ultimoCalculoRefeicao.resultados[categoria].length > 0) {
            htmlResultados += `<h4 class="card-title" style="font-size:1rem; margin-top:1rem;">${categorias[categoria]}</h4>`;
            ultimoCalculoRefeicao.resultados[categoria].forEach(r => { htmlResultados += `<p><strong>${r.item}:</strong> ${r.qtd}</p>`; });
        }
    }
    const htmlFinal = `
      <div style="padding: 1rem;">
        <h2 style="text-align: center; color: var(--heading); margin-bottom: 0.5rem;">Lista para a Refeição</h2>
        <p style="text-align: center; font-size: 0.9rem; color: var(--text); margin-bottom: 1.5rem;">
            Para ${ultimoCalculoRefeicao.adultos} adultos e ${ultimoCalculoRefeicao.criancas} crianças
        </p>
        ${htmlResultados}
      </div>
    `;
    gerarEPartilharImagem(htmlFinal, 'lista-refeicao.png');
}


// =================================================================================
// LÓGICA DO SEPARADOR HISTÓRICO
// =================================================================================
function renderizarHistorico(tipo, targetButton) {
    if(targetButton) {
      document.querySelectorAll('.tab-button-local').forEach(btn => btn.classList.remove('active'));
      targetButton.classList.add('active');
    }
    const container = document.getElementById('historico-container');
    container.innerHTML = '';
    if (tipo === 'despesas') {
        historicoDespesas = carregarDoStorage("historicoEventos");
        if (historicoDespesas.length > 0) {
            let html = '<div class="table-wrapper"><table><thead><tr><th>Evento</th><th>Data</th><th>Total</th><th class="actions">Ações</th></tr></thead><tbody>';
            historicoDespesas.slice().reverse().forEach((ev, i_rev) => {
              const i = historicoDespesas.length - 1 - i_rev;
              html += `<tr><td style="cursor:pointer;" onclick="verDetalhesDespesa(${i})"><strong class="clickable-row">${ev.nomeEvento}</strong></td><td>${ev.data}</td><td>${ev.total.toFixed(2)} €</td><td class="actions"><button onclick="carregarEventoParaEdicao(${i}, event)" class="btn btn-secondary" title="Editar">✏️</button><button onclick="eliminarHistorico('despesas', ${i}, event)" class="btn btn-danger" title="Eliminar">🗑️</button></td></tr>`;
            });
            container.innerHTML = html + '</tbody></table></div>';
        } else {
            container.innerHTML = '<div class="card-body"><p>Nenhum evento de despesas guardado.</p></div>';
        }
    } else if (tipo === 'refeicoes') {
        historicoRefeicoes = carregarDoStorage("historicoRefeicoes");
        if (historicoRefeicoes.length > 0) {
            let html = '<div class="table-wrapper"><table><thead><tr><th>Refeição</th><th>Data</th><th>Pessoas</th><th class="actions">Ações</th></tr></thead><tbody>';
            historicoRefeicoes.slice().reverse().forEach((ev, i_rev) => {
                const i = historicoRefeicoes.length - 1 - i_rev;
                html += `<tr><td style="cursor:pointer;" onclick="verDetalhesRefeicao(${i})"><strong class="clickable-row">${ev.nome}</strong></td><td>${ev.data}</td><td>${ev.adultos}A, ${ev.criancas}C</td><td class="actions"><button onclick="eliminarHistorico('refeicoes', ${i}, event)" class="btn btn-danger" title="Eliminar">🗑️</button></td></tr>`;
            });
            container.innerHTML = html + '</tbody></table></div>';
        } else {
            container.innerHTML = '<div class="card-body"><p>Nenhum cálculo de refeição guardado.</p></div>';
        }
    }
}

function verDetalhesDespesa(index) {
  const ev = historicoDespesas[index];
  const modal = document.getElementById('modal-historico');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  modalTitle.textContent = ev.nomeEvento;
  let bodyHtml = `<div class="card"><div class="card-header"><h2 class="card-title">Resumo do Evento</h2></div><div class="card-body" style="display:flex; flex-direction:column; gap:0.5rem;"><p><strong>Data:</strong> ${ev.data}</p><p><strong>Total Gasto:</strong> ${ev.total.toFixed(2)} €</p><p><strong>Custo por Pessoa:</strong> ${ev.custo.toFixed(2)} €</p></div></div><div class="card"><div class="card-header"><h2 class="card-title">Balanço Individual Guardado</h2></div><div class="table-wrapper"><table><thead><tr><th>Nome</th><th>Valor Gasto</th><th>Balanço</th></tr></thead><tbody>`;
  ev.balancos.forEach(p => {
    const classe = p.saldo < -0.005 ? 'negativo' : p.saldo > 0.005 ? 'positivo' : '';
    bodyHtml += `<tr><td><strong>${p.nome}</strong></td><td>${p.valor.toFixed(2)} €</td><td><span class="${classe}">${p.saldo.toFixed(2)} €</span></td></tr>`;
  });
  bodyHtml += `</tbody></table></div></div><div class="card"><div class="card-header"><h2 class="card-title">Acerto de Contas Guardado</h2></div><div class="table-wrapper"><table><thead><tr><th>Transação Sugerida</th></tr></thead><tbody>`;
  if (ev.reembolsos.length > 0) {
    ev.reembolsos.forEach(t => { bodyHtml += `<tr><td>${t}</td></tr>`; });
  } else {
    bodyHtml += '<tr><td>Contas equilibradas!</td></tr>';
  }
  bodyHtml += '</tbody></table></div></div>';
  modalBody.innerHTML = bodyHtml;
  modal.style.display = 'block';
}

function verDetalhesRefeicao(index) {
    const ev = historicoRefeicoes[index];
    const modal = document.getElementById('modal-historico');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    let htmlResultados = '';
    const categorias = {
        aperitivos: '🧀 Aperitivos', bebidas: '🍻 Bebidas', carnes: '🥩 Carnes', acompanhamentos: '🥗 Acompanhamentos'
    };
     for (const categoria in categorias) {
        if (ev.resultados[categoria] && ev.resultados[categoria].length > 0) {
            htmlResultados += `<h4 class="card-title" style="font-size:1rem; margin-top:1rem;">${categorias[categoria]}</h4>`;
            ev.resultados[categoria].forEach(r => {
                htmlResultados += `<p><strong>${r.item}:</strong> ${r.qtd}</p>`;
            });
        }
    }
    modalTitle.textContent = ev.nome;
    modalBody.innerHTML = `
        <div class="card"><div class="card-header"><h2 class="card-title">Detalhes do Cálculo</h2></div><div class="card-body"><p><strong>Data:</strong> ${ev.data}</p><p><strong>Pessoas:</strong> ${ev.adultos} Adultos, ${ev.criancas} Crianças</p></div></div>
        <div class="card"><div class="card-header"><h2 class="card-title">Lista de Quantidades</h2></div><div class="card-body" style="padding-top: 0; padding-bottom:0;">${htmlResultados}</div></div>`;
    modal.style.display = 'block';
}

function eliminarHistorico(tipo, indexReverso, event) {
  event.stopPropagation();
  if (confirm("Tem a certeza que deseja eliminar este item do histórico?")) {
    if (tipo === 'despesas') {
      const indexOriginal = historicoDespesas.length - 1 - indexReverso;
      historicoDespesas.splice(indexOriginal, 1);
      localStorage.setItem("historicoEventos", JSON.stringify(historicoDespesas));
    } else {
      const indexOriginal = historicoRefeicoes.length - 1 - indexReverso;
      historicoRefeicoes.splice(indexOriginal, 1);
      localStorage.setItem("historicoRefeicoes", JSON.stringify(historicoRefeicoes));
    }
    renderizarHistorico(tipo);
  }
}

// =================================================================================
// LÓGICA DO SEPARADOR COMPRAS
// =================================================================================

let listaCompras = carregarDoStorage("listaCompras");

function renderListaCompras() {
    const container = document.getElementById('lista-compras');
    const footer = document.getElementById('compras-footer');
    container.innerHTML = '';
    if(listaCompras.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding: 1rem 0;">A sua lista de compras está vazia.</p>';
        footer.style.display = 'none';
        return;
    }
    footer.style.display = 'flex';
    listaCompras.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shopping-item' + (item.checked ? ' checked' : '');
        itemDiv.onclick = () => toggleItemCompra(index);
        const itemSpan = document.createElement('span');
        itemSpan.textContent = item.text;
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn btn-danger';
        deleteButton.innerHTML = '🗑️';
        deleteButton.onclick = (e) => { e.stopPropagation(); eliminarItemCompra(index); };
        itemDiv.appendChild(itemSpan);
        itemDiv.appendChild(deleteButton);
        container.appendChild(itemDiv);
    });
}

function adicionarItemCompra() {
    const input = document.getElementById('item-compra');
    const itemText = input.value.trim();
    if (itemText) {
        listaCompras.push({ text: itemText, checked: false });
        localStorage.setItem("listaCompras", JSON.stringify(listaCompras));
        input.value = '';
        renderListaCompras();
        input.focus();
    }
}

function adicionarItemCompraComEnter(event) {
    if (event.key === 'Enter') adicionarItemCompra();
}

function toggleItemCompra(index) {
    listaCompras[index].checked = !listaCompras[index].checked;
    localStorage.setItem("listaCompras", JSON.stringify(listaCompras));
    renderListaCompras();
}

function eliminarItemCompra(index) {
    listaCompras.splice(index, 1);
    localStorage.setItem("listaCompras", JSON.stringify(listaCompras));
    renderListaCompras();
}

function limparListaCompras() {
    if (listaCompras.length > 0 && confirm("Tem a certeza que quer limpar toda a lista de compras?")) {
        listaCompras = [];
        localStorage.setItem("listaCompras", JSON.stringify(listaCompras));
        renderListaCompras();
    }
}

async function partilharListaCompras() {
    if (listaCompras.length === 0) {
        alert("A lista de compras está vazia!");
        return;
    }
    let listaHtml = listaCompras.map(item => 
        `<p style="font-size: 1.1rem; margin: 0.5rem 0; text-align: left; ${item.checked ? 'text-decoration: line-through; color: var(--slate-500);' : ''}">
            ${item.checked ? '✅' : '⬜️'} ${item.text}
         </p>`
    ).join('');
    const htmlFinal = `
      <div style="padding: 1rem;">
        <h2 style="text-align: center; color: var(--heading); margin-bottom: 1.5rem;">🛒 Lista de Compras</h2>
        ${listaHtml}
      </div>`;
    gerarEPartilharImagem(htmlFinal, 'lista-compras.png');
}

// =================================================================================
// LÓGICA DO SEPARADOR SUGESTÕES DE JANTAR
// =================================================================================
const refeicoesDB = [
    { id: 1, nome: "Massa à Bolonhesa", tags: ['massa', 'carne'], tempo: 'normal', kidFriendly: true, desc: "Um clássico que agrada a todos, especialmente aos mais novos. Perfeito para um jantar de família." },
    { id: 2, nome: "Bifes de Frango Grelhados com Arroz e Salada", tags: ['frango', 'salada', 'arroz'], tempo: 'rapido', kidFriendly: true, desc: "Uma refeição leve, rápida e saudável. O frango grelhado é sempre uma aposta segura." },
    { id: 3, nome: "Douradinhos no Forno com Arroz de Tomate", tags: ['peixe', 'arroz'], tempo: 'normal', kidFriendly: true, desc: "Os douradinhos são um favorito das crianças, e feitos no forno ficam mais saudáveis." },
    { id: 4, nome: "Massa com Atum e Natas", tags: ['massa', 'peixe', 'atum'], tempo: 'rapido', kidFriendly: true, desc: "Incrivelmente rápido e cremoso. Uma solução perfeita para dias de pressa." },
    { id: 5, nome: "Omelete de Queijo e Fiambre com Salada", tags: ['ovos', 'salada'], tempo: 'rapido', kidFriendly: true, desc: "Versátil e rapidíssima. Pode juntar os legumes que tiver no frigorífico." },
    { id: 6, nome: "Rojões de Porco à Portuguesa", tags: ['carne', 'porco'], tempo: 'normal', kidFriendly: false, desc: "Um prato robusto e cheio de sabor, para um jantar com mais tempo e apetite." },
    { id: 7, nome: "Salada Caesar com Frango Grelhado", tags: ['salada', 'frango'], tempo: 'rapido', kidFriendly: false, desc: "Uma salada completa que serve como refeição principal. Leve mas satisfatória." },
    { id: 8, nome: "Strogonoff de Frango com Batata Palha", tags: ['frango', 'carne'], tempo: 'normal', kidFriendly: true, desc: "Um prato cremoso e reconfortante que é surpreendentemente fácil de fazer." },
    { id: 9, nome: "Nuggets Caseiros com Esparguete", tags: ['frango', 'massa', 'carne'], tempo: 'rapido', kidFriendly: true, desc: "A combinação preferida da pequenada para um dia especial, como o dos trampolins!" },
    { id: 10, nome: "Salmão Grelhado com Legumes Cozidos", tags: ['peixe', 'salada'], tempo: 'normal', kidFriendly: true, desc: "Uma opção muito saudável e saborosa para uma refeição equilibrada durante a semana." },
    { id: 11, nome: "Bife com Batata Frita e Ovo Estrelado", tags: ['carne', 'batata_frita', 'ovos'], tempo: 'rapido', kidFriendly: true, desc: "O 'bitoque'. Um prato rápido, delicioso e um clássico que nunca falha." },
    { id: 12, nome: "Risotto de Cogumelos", tags: ['arroz', 'cogumelos'], tempo: 'normal', kidFriendly: false, desc: "Um prato vegetariano, cremoso e sofisticado para uma noite mais calma." },
    { id: 13, nome: "Esparguete com Camarão ao Alho", tags: ['massa', 'peixe'], tempo: 'rapido', kidFriendly: false, desc: "Rápido, aromático e com um toque mediterrânico. Ideal para um jantar a dois." },
    { id: 14, nome: "Empadão de Carne com Puré de Batata", tags: ['carne', 'batata'], tempo: 'normal', kidFriendly: true, desc: "Comida de conforto no seu melhor. O empadão é sempre um sucesso com toda a família." }
];
let historicoSugestoes = carregarDoStorage("historicoSugestoes");

function sugerirJantar(surpresa = false) {
    const querRapida = document.getElementById('sugestao-rapida').checked;
    const ingredientesSelecionados = surpresa ? [] : Array.from(document.querySelectorAll('input[name="ingrediente"]:checked')).map(cb => cb.value);

    const seisDiasAtras = new Date();
    seisDiasAtras.setDate(seisDiasAtras.getDate() - 6);
    historicoSugestoes = historicoSugestoes.filter(h => new Date(h.timestamp) > seisDiasAtras);
    const idsRecentes = historicoSugestoes.map(h => h.id);

    let poolDisponivel = refeicoesDB.filter(r => !idsRecentes.includes(r.id));
    if (poolDisponivel.length === 0) {
        poolDisponivel = refeicoesDB;
        historicoSugestoes = [];
    }

    let poolFinal = poolDisponivel;
    if (querRapida) {
        const refeicoesRapidas = poolFinal.filter(r => r.tempo === 'rapido');
        if (refeicoesRapidas.length > 0) poolFinal = refeicoesRapidas;
    }

    if (ingredientesSelecionados.length > 0) {
        const refeicoesComIngredientes = poolFinal.filter(r => 
            ingredientesSelecionados.some(ing => r.tags.includes(ing))
        );
        if (refeicoesComIngredientes.length > 0) {
            poolFinal = refeicoesComIngredientes;
        } else {
             alert("Não foram encontradas sugestões com esses critérios. Tente outras opções ou clique em 'Surpreenda-me!'.");
             return;
        }
    }

    if (poolFinal.length > 0) {
        const sugestao = poolFinal[Math.floor(Math.random() * poolFinal.length)];
        historicoSugestoes.push({ id: sugestao.id, timestamp: new Date() });
        localStorage.setItem("historicoSugestoes", JSON.stringify(historicoSugestoes));
        renderizarSugestao(sugestao);
    } else {
        alert("Não foi possível encontrar uma sugestão única com os seus filtros. Tente novamente!");
    }
}

function renderizarSugestao(refeicao) {
    const inputContainer = document.getElementById('sugestao-input-container');
    const resultadoContainer = document.getElementById('sugestao-resultado-container');

    resultadoContainer.innerHTML = `
        <div class="card-header"><h2 class="card-title">A nossa sugestão para hoje é...</h2></div>
        <div class="card-body">
            <h3 class="card-title" style="font-size: 1.5rem; color: var(--primary);">${refeicao.nome}</h3>
            <p style="margin-top: 1rem;">${refeicao.desc}</p>
            <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                <p><strong>Tipo:</strong> ${refeicao.tags.join(', ')}</p>
                <p><strong>Tempo estimado:</strong> ${refeicao.tempo === 'rapido' ? '⚡ Rápido' : 'Normal'}</p>
                <p><strong>Ideal para crianças:</strong> ${refeicao.kidFriendly ? 'Sim 👍' : 'Talvez 🤔'}</p>
            </div>
        </div>
        <div class="card-footer" style="justify-content: flex-end;">
            <button onclick="mostrarEcradeInputSugestao()" class="btn btn-secondary">Sugerir Outra</button>
        </div>
    `;
    inputContainer.style.display = 'none';
    resultadoContainer.style.display = 'flex';
    resultadoContainer.style.flexDirection = 'column';
}

function mostrarEcradeInputSugestao() {
    document.getElementById('sugestao-input-container').style.display = 'block';
    document.getElementById('sugestao-resultado-container').style.display = 'none';
    document.querySelectorAll('input[name="ingrediente"]:checked').forEach(cb => cb.checked = false);
    document.getElementById('sugestao-rapida').checked = false;
}
