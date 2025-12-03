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
    
    // Fecha todas as outras seções na mesma aba (opcional - descomente se quiser accordion)
    /*
    const parentTab = formSection.closest('.tab-content');
    if (parentTab) {
        parentTab.querySelectorAll('.form.expanded').forEach(otherSection => {
            if (otherSection !== formSection) {
                otherSection.classList.remove('expanded');
                otherSection.querySelector('.form-content').style.maxHeight = "0";
                otherSection.querySelector('.form-content').style.opacity = "0";
                otherSection.querySelector('.form-content').style.padding = "0";
            }
        });
    }
    */
    
    // Alterna a seção atual
    if (formSection.classList.contains('expanded')) {
        // Fecha a seção
        formSection.classList.remove('expanded');
        content.style.maxHeight = "0";
        content.style.opacity = "0";
        content.style.padding = "0";
        
        // Animação suave para o ícone
        icon.style.transform = "rotate(0deg)";
    } else {
        // Abre a seção
        formSection.classList.add('expanded');
        const scrollHeight = content.scrollHeight;
        content.style.maxHeight = scrollHeight + "px";
        content.style.opacity = "1";
        content.style.padding = "var(--espaco-lg)";
        
        // Animação suave para o ícone
        icon.style.transform = "rotate(180deg)";
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
                
                formSection.classList.add('expanded');
                content.style.maxHeight = content.scrollHeight + "px";
                content.style.opacity = "1";
                content.style.padding = "var(--espaco-lg)";
                icon.style.transform = "rotate(180deg)";
            }
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
document.addEventListener('DOMContentLoaded', function() {
    // Abre a primeira seção da primeira aba ativa
    const activeTab = document.querySelector('.tab-content.active');
    if (activeTab) {
        const firstForm = activeTab.querySelector('.form');
        if (firstForm) {
            firstForm.classList.add('expanded');
            const content = firstForm.querySelector('.form-content');
            content.style.maxHeight = content.scrollHeight + "px";
            content.style.opacity = "1";
            content.style.padding = "var(--espaco-lg)";
            
            // Ajusta o ícone
            const icon = firstForm.querySelector('.form-toggle i');
            if (icon) icon.style.transform = "rotate(180deg)";
        }
    }
    
    // Adiciona botões de expandir/recolher todos (opcional)
    addExpandCollapseButtons();
    
    // Ajusta altura das seções ao redimensionar
    window.addEventListener('resize', function() {
        document.querySelectorAll('.form.expanded .form-content').forEach(content => {
            content.style.maxHeight = content.scrollHeight + "px";
        });
    });
    
    // Atalhos de teclado
    document.addEventListener('keydown', function(e) {
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
        expandBtn.onclick = function() {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) expandAllSections(activeTab.id);
        };
        
        // Botão Recolher Todos
        const collapseBtn = document.createElement('button');
        collapseBtn.className = 'btn-small';
        collapseBtn.innerHTML = '<i class="bx bx-chevrons-up"></i> Recolher';
        collapseBtn.title = 'Recolher todas as seções (Ctrl+R)';
        collapseBtn.onclick = function() {
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