function mostrarMensagem(mensagem, tipo = 'success') {
    const toastContainer = document.getElementById('toast-container') || criarToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo} toast-slide-in`;
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-header">
                <div class="toast-icon">
                    ${getIcon(tipo)}
                </div>
                <div class="toast-title">
                    ${getTitle(tipo)}
                </div>
                <button class="toast-close" onclick="this.parentElement.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div>${mensagem}</div>
        </div>
    `;

    toastContainer.appendChild(toast);

    // Remove após 5 segundos
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('toast-slide-out');
            setTimeout(() => toast.remove(), 500);
        }
    }, 5000);
}
// Sistema de tabs com URL e persistência
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        // Prevenir comportamento padrão de links
        if (tab.tagName === 'A') {
            e.preventDefault();
        }

        const targetSection = tab.dataset.section || tab.dataset.target;

        // Atualizar tabs ativas
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');

        // Atualizar URL sem recarregar a página
        const newUrl = `${window.location.pathname}#${targetSection}`;
        window.history.pushState({}, '', newUrl);

        // Salvar no localStorage para persistência
        localStorage.setItem('activeTab', targetSection);
    });
});

// Restaurar tab ativa ao carregar a página
document.addEventListener('DOMContentLoaded', function () {
    // Verificar hash na URL primeiro
    const hash = window.location.hash.substring(1);
    // Se não tiver hash, verificar localStorage
    const savedTab = hash || localStorage.getItem('activeTab') || 'especialidades';

    const targetTab = document.querySelector(`.tab[data-section="${savedTab}"]`) ||
        document.querySelector(`.tab[data-target="${savedTab}"]`);

    if (targetTab) {
        // Ativar a tab salva
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        targetTab.classList.add('active');
        document.getElementById(targetTab.dataset.target).classList.add('active');

        // Atualizar URL se necessário
        if (!hash && savedTab !== 'especialidades') {
            const newUrl = `${window.location.pathname}#${savedTab}`;
            window.history.replaceState({}, '', newUrl);
        }
    }

    // Scroll para tab ativa em mobile
    scrollToActiveTab();
});

// Lidar com navegação pelo botão voltar/avancar
window.addEventListener('popstate', function () {
    const hash = window.location.hash.substring(1);
    if (hash) {
        const targetTab = document.querySelector(`.tab[data-section="${hash}"]`) ||
            document.querySelector(`.tab[data-target="${hash}"]`);
        if (targetTab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            targetTab.classList.add('active');
            document.getElementById(targetTab.dataset.target).classList.add('active');
            localStorage.setItem('activeTab', hash);
        }
    }
});

function scrollToActiveTab() {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        activeTab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}
// Preview de cor para especialidades
const colorInput = document.getElementById('especialidade-cor');
const colorPreview = document.getElementById('color-preview');

if (colorInput && colorPreview) {
    colorInput.addEventListener('input', function () {
        colorPreview.style.backgroundColor = this.value;
    });
}

// Validação de formulário de usuário
function carregarDadosUsuario() {
    const select = document.getElementById("usuario-select");
    const selectedOption = select.options[select.selectedIndex];
    const tipoSelect = document.getElementById("tipo-select");
    const valorHoraInput = document.getElementById("valor-hora-input");
    const novaSenhaInput = document.getElementById("nova_senha");
    const confirmaSenhaInput = document.getElementById("confirma_senha");
    const btnSalvar = document.getElementById("btn-salvar-usuario");
    const senhaMsg = document.getElementById("senha-msg");

    if (select.value) {
        // Habilitar campos
        [tipoSelect, valorHoraInput, novaSenhaInput, confirmaSenhaInput].forEach(field => {
            field.disabled = false;
            field.classList.remove('error');
        });

        // Preencher dados
        tipoSelect.value = selectedOption.getAttribute("data-tipo");
        valorHoraInput.value = selectedOption.getAttribute("data-hora") || "";

        // Limpar mensagens e habilitar botão
        senhaMsg.textContent = "";
        senhaMsg.className = "form-message";
        btnSalvar.disabled = false;

        // Adicionar validação de senha em tempo real
        confirmaSenhaInput.addEventListener('input', validarSenha);
    } else {
        // Desabilitar campos se nenhum usuário selecionado
        [tipoSelect, valorHoraInput, novaSenhaInput, confirmaSenhaInput, btnSalvar].forEach(field => {
            field.disabled = true;
        });
    }
}

function validarSenha() {
    const senha = document.getElementById("nova_senha").value;
    const confirmaSenha = document.getElementById("confirma_senha").value;
    const senhaMsg = document.getElementById("senha-msg");
    const btnSalvar = document.getElementById("btn-salvar-usuario");

    if (!senha && !confirmaSenha) {
        senhaMsg.textContent = "";
        senhaMsg.className = "form-message";
        btnSalvar.disabled = false;
        return;
    }

    if (senha !== confirmaSenha) {
        senhaMsg.textContent = "As senhas não coincidem!";
        senhaMsg.className = "form-message error";
        btnSalvar.disabled = true;
    } else {
        senhaMsg.textContent = "Senhas coincidem!";
        senhaMsg.className = "form-message success";
        btnSalvar.disabled = false;
    }
}

// Validação básica de formulários
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', function (e) {
        const requiredFields = this.querySelectorAll('[required]');
        let valid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                valid = false;
                field.style.borderColor = '#EF4444';
            } else {
                field.style.borderColor = '';
            }
        });

        if (!valid) {
            e.preventDefault();
            const msg = document.createElement('div');
            msg.className = 'form-message error';
            msg.textContent = 'Por favor, preencha todos os campos obrigatórios.';
            this.insertBefore(msg, this.firstChild);

            setTimeout(() => msg.remove(), 5000);
        }
    });
});

// Efeitos hover nas linhas da tabela
document.querySelectorAll('tbody tr').forEach(row => {
    row.addEventListener('mouseenter', function () {
        this.style.transform = 'translateX(4px)';
    });

    row.addEventListener('mouseleave', function () {
        this.style.transform = 'translateX(0)';
    });
});

// Auto-scroll para tabs ativas em mobile
function scrollToActiveTab() {
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        activeTab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }
}

// Inicializar scroll quando a página carregar
document.addEventListener('DOMContentLoaded', scrollToActiveTab);
// Sistema de edição em linha
let editingRow = null;
let originalValues = {};

function iniciarEdicao(button) {
    const row = button.closest('tr');
    if (editingRow && editingRow !== row) {
        cancelarEdicao(editingRow.querySelector('.cancelar'));
    }

    editingRow = row;
    originalValues = {};

    // Esconder botão editar e mostrar salvar/cancelar
    row.querySelector('.btn-acao.editar').style.display = 'none';
    row.querySelector('.btn-acao.salvar').style.display = 'inline-flex';
    row.querySelector('.btn-acao.cancelar').style.display = 'inline-flex';

    // Ativar todos os campos editáveis da linha
    const editableCells = row.querySelectorAll('.editable');
    editableCells.forEach(cell => {
        cell.classList.add('editing');
        const displayText = cell.querySelector('.display-text');
        const editInput = cell.querySelector('.edit-input');

        // Salvar valor original
        originalValues[cell.dataset.field] = editInput.value;

        // Mostrar input, esconder texto
        displayText.style.display = 'none';
        editInput.style.display = 'block';
        editInput.focus();
    });
}

function cancelarEdicao(button) {
    const row = button.closest('tr');

    // Restaurar valores originais
    const editableCells = row.querySelectorAll('.editable');
    editableCells.forEach(cell => {
        cell.classList.remove('editing');
        const displayText = cell.querySelector('.display-text');
        const editInput = cell.querySelector('.edit-input');

        editInput.value = originalValues[cell.dataset.field];
        displayText.style.display = 'block';
        editInput.style.display = 'none';
    });

    // Restaurar botões
    row.querySelector('.btn-acao.editar').style.display = 'inline-flex';
    row.querySelector('.btn-acao.salvar').style.display = 'none';
    row.querySelector('.btn-acao.cancelar').style.display = 'none';

    editingRow = null;
    originalValues = {};
}

function salvarEdicao(button) {
    const row = button.closest('tr');
    const model = row.querySelector('.editable').dataset.model;
    const id = row.querySelector('.editable').dataset.id;

    const formData = new FormData();
    formData.append('tipo', `editar_${model}`);
    formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
    formData.append(`${model}_id`, id);

    // Coletar dados dos campos editáveis
    const editableCells = row.querySelectorAll('.editable');
    let hasChanges = false;

    editableCells.forEach(cell => {
        const field = cell.dataset.field;
        const editInput = cell.querySelector('.edit-input');
        const displayText = cell.querySelector('.display-text');

        if (editInput.value !== originalValues[field]) {
            hasChanges = true;
        }

        formData.append(field, editInput.value);

        // Atualizar display
        if (field === 'cor') {
            displayText.innerHTML = `<div style="background-color: ${editInput.value}; width: 60px; height: 24px; border-radius: var(--borda-radius); border: 2px solid var(--cinza-borda);"></div>`;
        } else if (field === 'valor') {
            displayText.textContent = `R$ ${parseFloat(editInput.value).toFixed(2)}`;
        } else {
            displayText.textContent = editInput.value;
        }

        // Esconder input, mostrar texto
        displayText.style.display = 'block';
        editInput.style.display = 'none';
        cell.classList.remove('editing');
    });

    if (!hasChanges) {
        cancelarEdicao(button);
        return;
    }

    // Enviar para o servidor
    fetch('', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                mostrarMensagem('Alterações salvas com sucesso!', 'success');

                // Restaurar botões
                row.querySelector('.btn-acao.editar').style.display = 'inline-flex';
                row.querySelector('.btn-acao.salvar').style.display = 'none';
                row.querySelector('.btn-acao.cancelar').style.display = 'none';

                editingRow = null;
                originalValues = {};
            } else {
                mostrarMensagem('Erro ao salvar alterações: ' + data.error, 'error');
                cancelarEdicao(button);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            mostrarMensagem('Erro ao salvar alterações', 'error');
            cancelarEdicao(button);
        });
}

// Duplo clique para editar
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.editable').forEach(cell => {
        cell.addEventListener('dblclick', function () {
            const row = this.closest('tr');
            const editButton = row.querySelector('.btn-acao.editar');
            if (editButton && editButton.style.display !== 'none') {
                iniciarEdicao(editButton);
            }
        });
    });
});


// Tecla ESC para cancelar edição
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && editingRow) {
        const cancelButton = editingRow.querySelector('.btn-acao.cancelar');
        if (cancelButton) {
            cancelarEdicao(cancelButton);
        }
    }
});


// =============================
// SISTEMA DE SEÇÕES RETRÁTEIS
// =============================

// Função para alternar uma seção
function toggleFormSection(header) {
    const formSection = header.parentElement;
    const content = formSection.querySelector('.form-content');
    const icon = header.querySelector('.form-toggle i');

    if (formSection.classList.contains('expanded')) {
        // Fecha a seção
        formSection.classList.remove('expanded');
        content.style.maxHeight = "0";
        content.style.opacity = "0";
        content.style.paddingTop = "0";
        content.style.paddingBottom = "0";

        icon.style.transform = "rotate(0deg)";
    } else {
        // Abre a seção
        formSection.classList.add('expanded');

        // Força o cálculo da altura
        content.style.display = 'block';
        const scrollHeight = content.scrollHeight;
        content.style.maxHeight = scrollHeight + "px";
        content.style.opacity = "1";
        content.style.padding = "var(--espaco-lg)";

        icon.style.transform = "rotate(180deg)";

        // Aguarda a transição e remove o maxHeight fixo
        setTimeout(() => {
            if (formSection.classList.contains('expanded')) {
                content.style.maxHeight = "none";
            }
        }, 500);
    }
}
// Função para abrir todas as seções de uma aba
function expandAllSections(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.querySelectorAll('.form').forEach(formSection => {
            if (!formSection.classList.contains('expanded')) {
                const content = formSection.querySelector('.form-content');
                const icon = formSection.querySelector('.form-toggle i');

                // Força o display block antes de calcular
                content.style.display = 'block';

                formSection.classList.add('expanded');
                const scrollHeight = content.scrollHeight;
                content.style.maxHeight = scrollHeight + "px";
                content.style.opacity = "1";
                content.style.padding = "var(--espaco-lg)";
                icon.style.transform = "rotate(180deg)";

                // Remove o maxHeight fixo após animação
                setTimeout(() => {
                    if (formSection.classList.contains('expanded')) {
                        content.style.maxHeight = "none";
                    }
                }, 500);
            }
        });
    }
}

function collapseAllSections(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.querySelectorAll('.form.expanded').forEach(formSection => {
            const content = formSection.querySelector('.form-content');
            const icon = formSection.querySelector('.form-toggle i');

            // Calcula altura atual antes de fechar
            content.style.maxHeight = content.scrollHeight + "px";

            // Força reflow
            void content.offsetHeight;

            formSection.classList.remove('expanded');
            content.style.maxHeight = "0";
            content.style.opacity = "0";
            content.style.paddingTop = "0";
            content.style.paddingBottom = "0";
            icon.style.transform = "rotate(0deg)";
        });
    }
}
// Função para fechar todas as seções de uma aba
function collapseAllSections(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
        tab.querySelectorAll('.form.expanded').forEach(formSection => {
            const content = formSection.querySelector('.form-content');
            const icon = formSection.querySelector('.form-toggle i');

            formSection.classList.remove('expanded');
            content.style.maxHeight = "0";
            content.style.opacity = "0";
            content.style.padding = "0";
            icon.style.transform = "rotate(0deg)";
        });
    }
}

// Inicialização das seções
document.addEventListener('DOMContentLoaded', function () {

    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const firstForm = activeTab.querySelector('.form');
        if (firstForm && !firstForm.classList.contains('expanded')) {
            const content = firstForm.querySelector('.form-content');
            const icon = firstForm.querySelector('.form-toggle i');

            content.style.display = 'block';
            firstForm.classList.add('expanded');
            content.style.maxHeight = content.scrollHeight + "px";
            content.style.opacity = "1";
            content.style.padding = "var(--espaco-lg)";

            if (icon) icon.style.transform = "rotate(180deg)";

            // Remove maxHeight fixo após animação
            setTimeout(() => {
                content.style.maxHeight = "none";
            }, 500);
        }
    }

    // Adiciona botões de expandir/recolher todos (opcional)
    addExpandCollapseButtons();

    // Ajusta altura das seções ao redimensionar
    window.addEventListener('resize', function () {
        document.querySelectorAll('.form.expanded .form-content').forEach(content => {
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });

    // Atalhos de teclado
    document.addEventListener('keydown', function (e) {
        // Ctrl + E expande todas as seções da aba ativa
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                expandAllSections(activeTab.id);
            }
        }

        // Ctrl + R recolhe todas as seções da aba ativa
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                collapseAllSections(activeTab.id);
            }
        }
    });
});

// Função para adicionar botões de expandir/recolher todos (opcional)
function addExpandCollapseButtons() {
    const tabsContainer = document.querySelector('.tabs');
    if (tabsContainer) {
        // Cria container para os botões
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'expand-collapse-buttons';
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '10px';
        buttonsContainer.style.marginLeft = 'auto';
        buttonsContainer.style.alignItems = 'center';

        // Botão Expandir Todos
        const expandBtn = document.createElement('button');
        expandBtn.className = 'btn-small';
        expandBtn.innerHTML = '<i class="bx bx-chevrons-down"></i> Expandir';
        expandBtn.title = 'Expandir todas as seções (Ctrl+E)';
        expandBtn.onclick = function () {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) expandAllSections(activeTab.id);
        };

        // Botão Recolher Todos
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'btn-small';
        collapseBtn.innerHTML = '<i class="bx bx-chevrons-up"></i> Recolher';
        collapseBtn.title = 'Recolher todas as seções (Ctrl+R)';
        collapseBtn.onclick = function () {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) collapseAllSections(activeTab.id);
        };

        buttonsContainer.appendChild(expandBtn);
        buttonsContainer.appendChild(collapseBtn);

        // Adiciona após o último elemento nas tabs
        tabsContainer.appendChild(buttonsContainer);
    }
}

// Estilo para os botões pequenos
const style = document.createElement('style');
style.textContent = `
.btn-small {
    background: var(--roxoPrincipal);
    color: white;
    border: none;
    padding: 0.4rem 0.8rem;
    border-radius: var(--borda-radius);
    font-size: 0.8rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.3rem;
    transition: var(--transicao);
}

.btn-small:hover {
    background: var(--roxo-primary-hover);
    transform: translateY(-1px);
}

.expand-collapse-buttons {
    margin-left: auto;
}

@media (max-width: 768px) {
    .expand-collapse-buttons {
        display: none !important;
    }
}
`;
document.head.appendChild(style);

function abrirModalSelecao(botao) {
    const form = botao.closest('form');

    campoCodigoAtual = form.querySelector('.conta-codigo');
    campoDescAtual = form.querySelector('.conta-desc');

    window.PlanoContasModal.open(function (contaSelecionada) {
        campoCodigoAtual.value = contaSelecionada.codigo;
        campoDescAtual.value = `${contaSelecionada.codigo_display} - ${contaSelecionada.descricao}`;
    });
}

// Se já tiver uma conta pré-selecionada, pode configurar assim:
function preSelecionarConta(codigo, descricao) {
    document.getElementById('conta_selecionada_codigo').value = codigo;
    document.getElementById('conta_selecionada_desc').value = descricao;
}


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

// Inicialização
function init() {
    // Event Listeners
    openModalBtn.addEventListener('click', () => openModal(handleAccountSelection));

    closeBtn.addEventListener('click', closeModal);

    cancelBtn.addEventListener('click', closeModal);

    confirmBtn.addEventListener('click', confirmSelection);

    searchInput.addEventListener('input', filterAccounts);

    // Fechar modal ao clicar fora
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // Fechar modal com a tecla ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.style.display === 'flex') {
            closeModal();
        }
    });

    // Pré-carregar dados (opcional)
    // carregarContas();
}

// Função de exemplo para tratar a seleção
function handleAccountSelection(accountData) {
    console.log('Conta selecionada:', accountData);
    alert(`Conta selecionada: ${accountData.codigo_display} - ${accountData.descricao}`);

    // Aqui você pode integrar com seu sistema:
    // Exemplo: document.getElementById('campoConta').value = accountData.codigo;
    // Exemplo: document.getElementById('campoDescricao').value = accountData.descricao;
}

// Inicializar a aplicação
init();

// Exportar função openModal para uso externo
window.PlanoContasModal = {
    open: (callback) => openModal(callback || handleAccountSelection),
    close: closeModal,
    getSelected: () => selectedAccountData,
    refresh: carregarContas
};