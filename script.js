// =================================================================================
// INICIALIZAÇÃO E LÓGICA GERAL
// =================================================================================

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('.tab-button').click();
    document.getElementById('data').valueAsDate = new Date();
    atualizar();
    renderListaCompras();
    renderizarHistorico('despesas');
    
    // Lógica dos Modais
    const modalHistorico = document.getElementById('modal-historico');
    const modalCloseBtnHistorico = modalHistorico.querySelector('.modal-close');
    modalCloseBtnHistorico.onclick = () => { modalHistorico.style.display = 'none'; };
    
    const modalGrupos = document.getElementById('modal-grupos');
    const modalCloseBtnGrupos = modalGrupos.querySelector('.modal-close');
    modalCloseBtnGrupos.onclick = fecharModalGrupos;

    const modalValores = document.getElementById('modal-valores');
    const modalCloseBtnValores = modalValores.querySelector('.modal-close');
    modalCloseBtnValores.onclick = fecharModalValores;

    window.onclick = (event) => {
        if (event.target == modalHistorico) modalHistorico.style.display = 'none';
        if (event.target == modalGrupos) fecharModalGrupos();
        if (event.target == modalValores) fecharModalValores();
    };
});

function openTab(evt, tabName) {
  const tabcontent = document.getElementsByClassName("tab-content");
  for (let i = 0; i < tabcontent.length; i++) {
    tabcontent[i].classList.remove("active");
  }
  const tabbuttons = document.getElementsByClassName("tab-button");
  for (let i = 0; i < tabbuttons.length; i++) {
    tabbuttons[i].classList.remove("active");
  }
  document.getElementById(tabName).classList.add("active");
  evt.currentTarget.classList.add("active");
}


// =================================================================================
// LÓGICA DO SEPARADOR DESPESAS E GRUPOS
// =================================================================================
let participantes = [];
let historicoDespesas = JSON.parse(localStorage.getItem("historicoEventos")) || [];
let editandoIndex = null;
let nomesSelecionadosParaAdicionar = [];

const listaPredefinidaDefault = [
    { nomes: ["João Faria", "Tânia Bravo"] }, { nomes: ["Jorge Gimbra", "Sara Catalão"] },
    { nomes: ["Pedro Jerónimo", "Teresa Filipe"] }, { nomes: ["Roberto Silva", "Célia Silva"] },
    { nomes: ["Tiago Louro"] }, { nomes: ["Rui Cresovel", "Inês"] },
    { nomes: ["Vânia Silva"] }, { nomes: ["Rui Moutinho", "Sandra Moutinho"] }
];
let gruposPredefinidos = JSON.parse(localStorage.getItem("gruposPredefinidos")) || listaPredefinidaDefault;

function abrirModalGrupos() {
    nomesSelecionadosParaAdicionar = [];
    renderizarGrupos();
    document.getElementById('modal-grupos').style.display = 'block';
}

function fecharModalGrupos() {
    document.getElementById('modal-grupos').style.display = 'none';
}

function fecharModalValores() {
    document.getElementById('modal-valores').style.display = 'none';
}

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
            return `<button class="btn btn-secondary ${isSelected ? 'active' : ''}" onclick="toggleSelecaoGrupo(this, '${nome}')">${nome}</button>`;
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
        const inputRow = document.createElement('div');
        inputRow.className = 'input-grid';
        inputRow.innerHTML = `
            <label for="valor-de-${nome.replace(/\s/g, '')}">${nome}:</label>
            <input type="number" id="valor-de-${nome.replace(/\s/g, '')}" placeholder="Valor gasto (€)" />
        `;
        valoresBody.appendChild(inputRow);
    });

    fecharModalGrupos();
    document.getElementById('modal-valores').style.display = 'block';
}

function guardarValoresBatch() {
    nomesSelecionadosParaAdicionar.forEach(nome => {
        const valorInput = document.getElementById(`valor-de-${nome.replace(/\s/g, '')}`);
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
  if (!nome) return alert('Por favor, preencha o nome do participante.');
  const valor = parseFloat(document.getElementById('valor').value || '0');
  adicionarParticipante(nome, valor);
  
  document.getElementById('nome').value = '';
  document.getElementById('valor').value = '';
  atualizar();
}

function iniciarNovoEvento() {
  if (participantes.length > 0) {
    if (!confirm("Tem a certeza que quer limpar o evento atual? Perderá todos os dados não guardados.")) return;
  }
  participantes = [];
  editandoIndex = null;
  document.getElementById('evento').value = '';
  document.getElementById('data').valueAsDate = new Date();
  atualizar();
  window.scrollTo(0, 0);
  document.getElementById('evento').focus();
}

function carregarEventoParaEdicao(index, event) {
  event.stopPropagation();
  if (participantes.length > 0 && editandoIndex === null) {
    if (!confirm("Isto irá substituir o evento que está a criar. Deseja continuar?")) return;
  }
  openTab({currentTarget: document.querySelector('.tab-button[onclick*="despesas"]')}, 'despesas');
  const ev = historicoDespesas[index];
  editandoIndex = index;
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

async function partilharReembolsos() {
    const transacoes = calcularTransacoes();
    if (transacoes.length === 0 && participantes.length > 0) {
        alert("Não há reembolsos para partilhar, as contas estão equilibradas!");
        return;
    }
    if (transacoes.length === 0) {
        alert("Não há nada para partilhar.");
        return;
    }
    
    const containerPartilha = document.getElementById('imagem-a-partilhar');
    const conteudoPartilha = document.getElementById('conteudo-imagem');
    const nomeEvento = document.getElementById('evento').value || "Acerto de Contas";
    
    let transacoesHtml = transacoes.map(t => `<p style="font-size: 1.1rem; text-align: left;">${t}</p>`).join('');

    conteudoPartilha.innerHTML = `
      <div style="padding: 1rem;">
        <h2 style="text-align: center; color: var(--heading); margin-bottom: 1.5rem;">💸 Reembolsos: ${nomeEvento}</h2>
        ${transacoesHtml}
      </div>
    `;
    
    containerPartilha.style.display = 'block';

    try {
        const canvas = await html2canvas(containerPartilha, { scale: 2 });
        canvas.toBlob(async (blob) => {
            if (navigator.share) {
                try {
                    await navigator.share({
                        files: [new File([blob], 'reembolsos.png', { type: 'image/png' })]
                    });
                } catch (err) { console.error('Erro ao partilhar:', err); }
            } else {
                const link = document.createElement('a');
                link.download = 'reembolsos.png';
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
// LÓGICA DO SEPARADOR REFEIÇÕES
// =================================================================================
let historicoRefeicoes = JSON.parse(localStorage.getItem("historicoRefeicoes")) || [];
let ultimoCalculoRefeicao = null;

const pesosEquivalentes = {
    Bifanas: 80,
    Entremeadas: 70,
    Hambúrgueres: 110,
    Salsichas: 60,
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
        aperitivos: '🧀 Aperitivos',
        bebidas: '🍻 Bebidas',
        carnes: '🥩 Carnes',
        acompanhamentos: '🥗 Acompanhamentos'
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

// ... Resto do ficheiro JS (histórico, compras, etc.) permanece igual ...

