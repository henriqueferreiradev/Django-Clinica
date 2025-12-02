function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(function () {
        const feedback = document.getElementById("feedback");
        feedback.style.display = "block";
        setTimeout(() => {
            feedback.style.display = "none";
        }, 1500);
    }).catch(function (err) {
        console.error("Erro ao copiar: ", err);
    });
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

    // Função para mostrar mensagens
    function mostrarMensagem(mensagem, tipo) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${tipo}`;
        messageDiv.textContent = mensagem;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1000';

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    // Tecla ESC para cancelar edição
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && editingRow) {
            const cancelButton = editingRow.querySelector('.btn-acao.cancelar');
            if (cancelButton) {
                cancelarEdicao(cancelButton);
            }
        }
    });
 