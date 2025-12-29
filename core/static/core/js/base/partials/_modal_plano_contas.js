// ================================================
// SISTEMA DE MODAL DE PLANO DE CONTAS
// ================================================

// Elementos DOM
const modalOverlay = document.getElementById('modalOverlay');
const openModalBtn = document.querySelector('.open-modal-btn');
const closeBtn = document.querySelector('.close-btn');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');
const accountTree = document.getElementById('accountTree');
const selectedAccount = document.getElementById('selectedAccount');
const searchInput = document.getElementById('searchInput');
const loadingContainer = document.getElementById('loadingContainer');

// Estado da aplicação
let selectedAccountData = null;
let contasData = null;
let callbackConfirmacao = null;

// Configuração da URL da API
const API_URL = '/api/plano-contas/';  // Ajuste para sua URL real

// Função para carregar dados do backend
async function carregarContas() {
    try {
        loadingContainer.style.display = 'block';
        accountTree.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div><p>Carregando plano de contas...</p></div>';

        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        contasData = data;

        // Organiza os dados no formato esperado
        organizarDadosParaRenderizacao(data);

    } catch (error) {
        console.error('Erro ao carregar plano de contas:', error);
        mostrarErro('Erro ao carregar o plano de contas. Tente novamente.');
    } finally {
        loadingContainer.style.display = 'none';
    }
}

// Função para organizar dados vindo do Django
function organizarDadosParaRenderizacao(data) {
    const estrutura = {
        "centros_de_custo": {
            "receitas": {},
            "despesas": {}
        }
    };

    // Se os dados já estiverem no formato esperado
    if (data.centros_de_custo) {
        estrutura.centros_de_custo = data.centros_de_custo;
        renderAccountTree(estrutura);
        return;
    }

    // Se vier no formato dos models Django, converter
    if (data.categorias && data.grupos && data.contas) {
        // Processar receitas
        const categoriasReceita = data.categorias.filter(c => c.tipo === 'receita');
        categoriasReceita.forEach(categoria => {
            const gruposReceita = data.grupos.filter(g => g.categoria_id === categoria.id);

            gruposReceita.forEach(grupo => {
                estrutura.centros_de_custo.receitas[grupo.codigo] = {
                    descricao: grupo.descricao,
                    subgrupos: {}
                };

                const contasGrupo = data.contas.filter(c => c.grupo_id === grupo.id);
                contasGrupo.forEach(conta => {
                    estrutura.centros_de_custo.receitas[grupo.codigo].subgrupos[`${grupo.codigo}.${conta.codigo}`] = conta.descricao;
                });
            });
        });

        // Processar despesas
        const categoriasDespesa = data.categorias.filter(c => c.tipo === 'despesa');
        categoriasDespesa.forEach(categoria => {
            const gruposDespesa = data.grupos.filter(g => g.categoria_id === categoria.id);

            gruposDespesa.forEach(grupo => {
                estrutura.centros_de_custo.despesas[grupo.codigo] = {
                    descricao: grupo.descricao,
                    subgrupos: {}
                };

                const contasGrupo = data.contas.filter(c => c.grupo_id === grupo.id);
                contasGrupo.forEach(conta => {
                    estrutura.centros_de_custo.despesas[grupo.codigo].subgrupos[`${grupo.codigo}.${conta.codigo}`] = conta.descricao;
                });
            });
        });

        renderAccountTree(estrutura);
        return;
    }

    // Se vier no formato simplificado (array de contas)
    if (Array.isArray(data)) {
        const receitas = data.filter(item => item.tipo === 'receita' || item.tipo === 'R');
        const despesas = data.filter(item => item.tipo === 'despesa' || item.tipo === 'D');

        // Agrupar por grupo
        receitas.forEach(item => {
            const codigoParts = item.codigo_completo ? item.codigo_completo.split('.') : [];
            if (codigoParts.length >= 2) {
                const grupoCodigo = codigoParts[1];
                if (!estrutura.centros_de_custo.receitas[grupoCodigo]) {
                    estrutura.centros_de_custo.receitas[grupoCodigo] = {
                        descricao: `Grupo ${grupoCodigo}`,
                        subgrupos: {}
                    };
                }
                estrutura.centros_de_custo.receitas[grupoCodigo].subgrupos[item.codigo_completo || item.codigo] = item.descricao;
            }
        });

        despesas.forEach(item => {
            const codigoParts = item.codigo_completo ? item.codigo_completo.split('.') : [];
            if (codigoParts.length >= 2) {
                const grupoCodigo = codigoParts[1];
                if (!estrutura.centros_de_custo.despesas[grupoCodigo]) {
                    estrutura.centros_de_custo.despesas[grupoCodigo] = {
                        descricao: `Grupo ${grupoCodigo}`,
                        subgrupos: {}
                    };
                }
                estrutura.centros_de_custo.despesas[grupoCodigo].subgrupos[item.codigo_completo || item.codigo] = item.descricao;
            }
        });

        renderAccountTree(estrutura);
        return;
    }

    // Se não reconhecer o formato, mostra erro
    mostrarErro('Formato de dados não reconhecido');
}

// Função para mostrar erro
function mostrarErro(mensagem) {
    accountTree.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${mensagem}</p>
            <button onclick="carregarContas()" style="margin-top: 10px; padding: 8px 16px; background: #4776E6; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Tentar novamente
            </button>
        </div>
    `;
}

// Função para renderizar a árvore de contas
function renderAccountTree(planoContas) {
    accountTree.innerHTML = '';

    // Verificar se há dados
    if (!planoContas.centros_de_custo ||
        (!planoContas.centros_de_custo.receitas && !planoContas.centros_de_custo.despesas)) {
        accountTree.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-chart-pie"></i>
                <p>Nenhuma conta cadastrada no plano de contas.</p>
            </div>
        `;
        return;
    }

    // Adicionar RECEITAS se existirem
    if (planoContas.centros_de_custo.receitas && Object.keys(planoContas.centros_de_custo.receitas).length > 0) {
        const receitasHeader = document.createElement('div');
        receitasHeader.className = 'category-header';
        receitasHeader.innerHTML = `
            <i class="fas fa-money-bill-wave"></i>
            RECEITAS
        `;
        accountTree.appendChild(receitasHeader);

        // Renderizar contas de receitas
        Object.entries(planoContas.centros_de_custo.receitas).forEach(([codigo, grupo]) => {
            const grupoId = `receita-${codigo}`;

            // Item do grupo principal
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'account-item';
            grupoDiv.setAttribute('data-tipo', 'receita');

            const grupoContent = document.createElement('div');
            grupoContent.className = 'account-content receita';
            grupoContent.setAttribute('data-value', `R${codigo}`);
            grupoContent.setAttribute('data-tipo', 'receita');

            grupoContent.innerHTML = `
                <span class="toggle-icon">
                    <i class="fas fa-chevron-right"></i>
                </span>
                <span class="account-icon folder-icon">
                    <i class="fas fa-folder"></i>
                </span>
                <span class="account-code">${codigo}</span>
                <span class="account-name">${grupo.descricao}</span>
                <span class="account-badge badge-receita">Receita</span>
            `;

            // Container para subitens
            const subItensContainer = document.createElement('div');
            subItensContainer.className = 'children';
            subItensContainer.id = `children-${grupoId}`;

            // Adicionar subitens
            if (grupo.subgrupos) {
                Object.entries(grupo.subgrupos).forEach(([subcodigo, descricao]) => {
                    const subItemDiv = document.createElement('div');
                    subItemDiv.className = 'account-item';
                    subItemDiv.setAttribute('data-tipo', 'receita');

                    const subItemContent = document.createElement('div');
                    subItemContent.className = 'account-content receita';
                    subItemContent.setAttribute('data-value', `R${subcodigo.replace('.', '')}`);
                    subItemContent.setAttribute('data-tipo', 'receita');

                    subItemContent.innerHTML = `
                        <span class="toggle-icon"></span>
                        <span class="account-icon file-icon">
                            <i class="fas fa-file-invoice"></i>
                        </span>
                        <span class="account-code">${subcodigo}</span>
                        <span class="account-name">${descricao}</span>
                        <span class="account-badge badge-receita">Receita</span>
                    `;

                    // Evento de clique para subitens
                    subItemContent.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectAccount({
                            tipo: 'receita',
                            codigo: `R${subcodigo.replace('.', '')}`,
                            codigo_display: subcodigo,
                            descricao: descricao,
                            grupo: grupo.descricao
                        }, subItemContent);
                    });

                    subItemDiv.appendChild(subItemContent);
                    subItensContainer.appendChild(subItemDiv);
                });
            }

            // Evento de clique para o grupo
            grupoContent.addEventListener('click', (e) => {
                e.stopPropagation();
                selectAccount({
                    tipo: 'receita',
                    codigo: `R${codigo}`,
                    codigo_display: codigo,
                    descricao: grupo.descricao,
                    grupo: grupo.descricao
                }, grupoContent);
            });

            // Evento para expandir/colapsar (apenas no ícone de toggle)
            const toggleIcon = grupoContent.querySelector('.toggle-icon');
            toggleIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const childrenContainer = subItensContainer;
                if (childrenContainer.classList.contains('expanded')) {
                    childrenContainer.classList.remove('expanded');
                    toggleIcon.innerHTML = '<i class="fas fa-chevron-right"></i>';
                } else {
                    childrenContainer.classList.add('expanded');
                    toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
                }
            });

            grupoDiv.appendChild(grupoContent);
            grupoDiv.appendChild(subItensContainer);
            accountTree.appendChild(grupoDiv);
        });
    }

    // Adicionar DESPESAS se existirem
    if (planoContas.centros_de_custo.despesas && Object.keys(planoContas.centros_de_custo.despesas).length > 0) {
        const despesasHeader = document.createElement('div');
        despesasHeader.className = 'category-header';
        despesasHeader.innerHTML = `
            <i class="fas fa-file-invoice-dollar"></i>
            DESPESAS
        `;
        accountTree.appendChild(despesasHeader);

        // Renderizar contas de despesas
        Object.entries(planoContas.centros_de_custo.despesas).forEach(([codigo, grupo]) => {
            const grupoId = `despesa-${codigo}`;

            // Item do grupo principal
            const grupoDiv = document.createElement('div');
            grupoDiv.className = 'account-item';
            grupoDiv.setAttribute('data-tipo', 'despesa');

            const grupoContent = document.createElement('div');
            grupoContent.className = 'account-content despesa';
            grupoContent.setAttribute('data-value', `D${codigo}`);
            grupoContent.setAttribute('data-tipo', 'despesa');

            grupoContent.innerHTML = `
                <span class="toggle-icon">
                    <i class="fas fa-chevron-right"></i>
                </span>
                <span class="account-icon folder-icon">
                    <i class="fas fa-folder"></i>
                </span>
                <span class="account-code">${codigo}</span>
                <span class="account-name">${grupo.descricao}</span>
                <span class="account-badge badge-despesa">Despesa</span>
            `;

            // Container para subitens
            const subItensContainer = document.createElement('div');
            subItensContainer.className = 'children';
            subItensContainer.id = `children-${grupoId}`;

            // Adicionar subitens
            if (grupo.subgrupos) {
                Object.entries(grupo.subgrupos).forEach(([subcodigo, descricao]) => {
                    const subItemDiv = document.createElement('div');
                    subItemDiv.className = 'account-item';
                    subItemDiv.setAttribute('data-tipo', 'despesa');

                    const subItemContent = document.createElement('div');
                    subItemContent.className = 'account-content despesa';
                    subItemContent.setAttribute('data-value', `D${subcodigo.replace('.', '')}`);
                    subItemContent.setAttribute('data-tipo', 'despesa');

                    subItemContent.innerHTML = `
                        <span class="toggle-icon"></span>
                        <span class="account-icon file-icon">
                            <i class="fas fa-file-invoice"></i>
                        </span>
                        <span class="account-code">${subcodigo}</span>
                        <span class="account-name">${descricao}</span>
                        <span class="account-badge badge-despesa">Despesa</span>
                    `;

                    // Evento de clique para subitens
                    subItemContent.addEventListener('click', (e) => {
                        e.stopPropagation();
                        selectAccount({
                            tipo: 'despesa',
                            codigo: `D${subcodigo.replace('.', '')}`,
                            codigo_display: subcodigo,
                            descricao: descricao,
                            grupo: grupo.descricao
                        }, subItemContent);
                    });

                    subItemDiv.appendChild(subItemContent);
                    subItensContainer.appendChild(subItemDiv);
                });
            }

            // Evento de clique para o grupo
            grupoContent.addEventListener('click', (e) => {
                e.stopPropagation();
                selectAccount({
                    tipo: 'despesa',
                    codigo: `D${codigo}`,
                    codigo_display: codigo,
                    descricao: grupo.descricao,
                    grupo: grupo.descricao
                }, grupoContent);
            });

            // Evento para expandir/colapsar (apenas no ícone de toggle)
            const toggleIcon = grupoContent.querySelector('.toggle-icon');
            toggleIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                const childrenContainer = subItensContainer;
                if (childrenContainer.classList.contains('expanded')) {
                    childrenContainer.classList.remove('expanded');
                    toggleIcon.innerHTML = '<i class="fas fa-chevron-right"></i>';
                } else {
                    childrenContainer.classList.add('expanded');
                    toggleIcon.innerHTML = '<i class="fas fa-chevron-down"></i>';
                }
            });

            grupoDiv.appendChild(grupoContent);
            grupoDiv.appendChild(subItensContainer);
            accountTree.appendChild(grupoDiv);
        });
    }
}

// Função para selecionar uma conta
function selectAccount(accountData, element) {
    // Remover seleção anterior
    document.querySelectorAll('.account-content.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Adicionar seleção atual
    element.classList.add('selected');

    // Atualizar estado
    selectedAccountData = accountData;

    // Atualizar exibição da conta selecionada
    let tipoText = accountData.tipo === 'receita' ? 'Receita' : 'Despesa';
    let tipoIcon = accountData.tipo === 'receita' ? 'fa-money-bill-wave' : 'fa-file-invoice-dollar';
    let tipoColor = accountData.tipo === 'receita' ? '#4CAF50' : '#F44336';

    selectedAccount.innerHTML = `
        <i class="fas ${tipoIcon}" style="color: ${tipoColor}"></i>
        <span><strong>${accountData.codigo_display || accountData.codigo}</strong> - ${accountData.descricao}</span>
        <span class="account-badge ${accountData.tipo === 'receita' ? 'badge-receita' : 'badge-despesa'}" style="margin-left: auto;">
            ${tipoText}
        </span>
    `;

    // Atualizar borda da seleção
    selectedAccount.style.borderLeftColor = tipoColor;
}

// Função para filtrar contas
function filterAccounts() {
    const query = searchInput.value.toLowerCase();
    const allItems = document.querySelectorAll('.account-content');

    if (!query || query.trim() === '') {
        // Mostrar todos os itens se não há busca
        allItems.forEach(item => {
            item.closest('.account-item').style.display = '';
        });
        return;
    }

    allItems.forEach(item => {
        const accountName = item.querySelector('.account-name').textContent.toLowerCase();
        const accountCode = item.querySelector('.account-code').textContent.toLowerCase();

        // Verificar se corresponde à busca
        const matches = accountName.includes(query) || accountCode.includes(query);

        if (matches) {
            item.closest('.account-item').style.display = '';

            // Expandir todos os pais para garantir visibilidade
            let parentContainer = item.closest('.children');
            if (parentContainer) {
                parentContainer.classList.add('expanded');
                const parentToggle = parentContainer.previousElementSibling.querySelector('.toggle-icon');
                if (parentToggle) {
                    parentToggle.innerHTML = '<i class="fas fa-chevron-down"></i>';
                }
            }
        } else {
            item.closest('.account-item').style.display = 'none';
        }
    });
}

// Função para abrir o modal
async function openModal(callback) {
    modalOverlay.style.display = 'flex';
    selectedAccountData = null;
    selectedAccount.innerHTML = '<i class="fas fa-info-circle"></i><span>Nenhuma conta selecionada</span>';
    selectedAccount.style.borderLeftColor = '#8E54E9';

    // Salvar callback
    callbackConfirmacao = callback;

    // Limpar seleções anteriores
    document.querySelectorAll('.account-content.selected').forEach(el => {
        el.classList.remove('selected');
    });

    // Carregar dados se necessário
    if (!contasData) {
        await carregarContas();
    }

    // Focar no campo de busca
    searchInput.value = '';
    filterAccounts();
    setTimeout(() => searchInput.focus(), 100);
}

// Função para confirmar seleção
function confirmSelection() {
    if (selectedAccountData && callbackConfirmacao) {
        // Chama o callback passando os dados da conta
        callbackConfirmacao(selectedAccountData);
        closeModal();
    } else {
        alert('Por favor, selecione uma conta.');
    }
}

// Função para fechar modal
function closeModal() {
    modalOverlay.style.display = 'none';
    callbackConfirmacao = null;
}

// Função de exemplo para tratar a seleção
function handleAccountSelection(accountData) {
    console.log('Conta selecionada:', accountData);
    alert(`Conta selecionada: ${accountData.codigo_display} - ${accountData.descricao}`);

    // Aqui você pode integrar com seu sistema:
    // Exemplo: document.getElementById('campoConta').value = accountData.codigo;
    // Exemplo: document.getElementById('campoDescricao').value = accountData.descricao;
}

// Inicialização
function init() {
    // Event Listeners
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => openModal(handleAccountSelection));
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeModal);
    }

    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmSelection);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterAccounts);
    }

    if (modalOverlay) {
        // Fechar modal ao clicar fora
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    // Fechar modal com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.style.display === 'flex') {
            closeModal();
        }
    });
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', init);

// Exportar função openModal para uso externo
window.PlanoContasModal = {
    open: (callback) => openModal(callback || handleAccountSelection),
    close: closeModal,
    getSelected: () => selectedAccountData,
    refresh: carregarContas
};

// Funções auxiliares para integração com edição de linhas
function abrirModalSelecao(botao) {
    let campoCodigoAtual = null;
    let campoDescAtual = null;

    console.log('Botão clicado:', botao);

    // Verificar se está em modo de edição (dentro da tabela)
    const contaContainer = botao.closest('.edit-conta-container');
    if (contaContainer) {
        console.log('Encontrado container de edição');
        campoCodigoAtual = contaContainer.querySelector('.edit-conta-codigo');
        campoDescAtual = contaContainer.querySelector('.edit-conta-desc');
    } else {
        // Modo normal (formulário de cadastro)
        const form = botao.closest('form');
        if (form) {
            console.log('Encontrado formulário de cadastro');
            campoCodigoAtual = form.querySelector('.conta-codigo');
            campoDescAtual = form.querySelector('.conta-desc');
        }
    }

    console.log('Campos encontrados:', { campoCodigoAtual, campoDescAtual });

    if (campoCodigoAtual && campoDescAtual) {
        window.PlanoContasModal.open(function (contaSelecionada) {
            console.log('Conta selecionada:', contaSelecionada);

            // Usar o código diretamente do modal
            campoCodigoAtual.value = contaSelecionada.codigo;

            // Criar descrição formatada
            const descricaoFormatada = `${contaSelecionada.codigo_display || contaSelecionada.codigo} - ${contaSelecionada.descricao}`;
            campoDescAtual.value = descricaoFormatada;

            console.log('Valores atualizados:', {
                codigo: contaSelecionada.codigo,
                descricao: descricaoFormatada
            });
        });
    } else {
        console.error('Campos de conta não encontrados');
        alert('Não foi possível encontrar os campos para a conta');
    }
}

function abrirModalSelecaoConta(button) {
    const container = button.closest('.edit-conta-container');
    const contaCodigoInput = container.querySelector('.edit-conta-codigo');
    const contaDescInput = container.querySelector('.edit-conta-desc');

    console.log('Container encontrado:', container);
    console.log('Input de código:', contaCodigoInput);
    console.log('Input de descrição:', contaDescInput);

    if (!contaCodigoInput || !contaDescInput) {
        console.error('Inputs de conta não encontrados');
        return;
    }

    // Armazenar referências para uso no callback do modal
    window.currentEditContaContainer = {
        codigoInput: contaCodigoInput,
        descInput: contaDescInput,
        container: container
    };

    // Abrir modal existente
    if (window.PlanoContasModal && window.PlanoContasModal.open) {
        window.PlanoContasModal.open(function (contaSelecionada) {
            console.log('Conta selecionada no modal:', contaSelecionada);

            // Esta função será chamada quando uma conta for selecionada
            if (window.currentEditContaContainer) {
                const { codigoInput, descInput } = window.currentEditContaContainer;
                if (codigoInput && descInput) {
                    // Usar o código formatado corretamente
                    codigoInput.value = contaSelecionada.codigo;

                    // Criar a descrição formatada
                    const descricaoFormatada = `${contaSelecionada.codigo_display || contaSelecionada.codigo} - ${contaSelecionada.descricao}`;
                    descInput.value = descricaoFormatada;

                    console.log('Valores definidos:', {
                        codigo: contaSelecionada.codigo,
                        descricao: descricaoFormatada
                    });
                }
                window.currentEditContaContainer = null;
            }
        });
    } else {
        console.error('Modal não está disponível');
        alert('Modal de seleção de conta não está disponível');
    }
}

// Função para pré-selecionar conta
function preSelecionarConta(codigo, descricao) {
    const codigoField = document.getElementById('conta_selecionada_codigo');
    const descField = document.getElementById('conta_selecionada_desc');

    if (codigoField && descField) {
        codigoField.value = codigo;
        descField.value = descricao;
    }
}