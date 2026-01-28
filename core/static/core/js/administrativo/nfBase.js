// Função para mostrar mensagens
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

// Funções auxiliares
function criarToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getIcon(tipo) {
    const icons = {
        'success': '<i class="fas fa-check-circle"></i>',
        'warning': '<i class="fas fa-exclamation-triangle"></i>',
        'error': '<i class="fas fa-exclamation-circle"></i>',
        'info': '<i class="fas fa-info-circle"></i>'
    };
    return icons[tipo] || icons['info'];
}

function getTitle(tipo) {
    const titles = {
        'success': 'Sucesso',
        'warning': 'Aviso',
        'error': 'Erro',
        'info': 'Informação'
    };
    return titles[tipo] || 'Mensagem';
}

function formatarDataBR(dataISO) {
    if (!dataISO) return '';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

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
    row.querySelector('.action-btn.resolve').style.display = 'none'
    row.querySelector('.action-btn.cancel').style.display = 'none'
    // Ativar todos os campos editáveis da linha
    const editableCells = row.querySelectorAll('.editable');
    editableCells.forEach(cell => {
        cell.classList.add('editing');
        const displayText = cell.querySelector('.display-text');
        const editInput = cell.querySelector('.edit-input');
        const editSelect = cell.querySelector('.edit-select');
        const editContaContainer = cell.querySelector('.edit-conta-container');

        // Salvar valor original
        if (editInput) {
            originalValues[cell.dataset.field] = editInput.value;
        } else if (editSelect) {
            originalValues[cell.dataset.field] = editSelect.value;
        } else if (editContaContainer) {
            const contaCodigo = editContaContainer.querySelector('.edit-conta-codigo');
            const contaDesc = editContaContainer.querySelector('.edit-conta-desc');

            // Salvar ambos: código e descrição
            originalValues[cell.dataset.field] = contaCodigo ? contaCodigo.value : '';
            originalValues[cell.dataset.field + '_desc'] = contaDesc ? contaDesc.value : '';
        }

        // Mostrar campo apropriado, esconder texto
        displayText.style.display = 'none';

        if (editSelect) {
            editSelect.style.display = 'block';
            editSelect.focus();
        } else if (editContaContainer) {
            editContaContainer.style.display = 'flex';
            editContaContainer.style.alignItems = 'center';
            editContaContainer.style.gap = '5px';
        } else if (editInput) {
            editInput.style.display = 'block';
            editInput.focus();
        }
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
        const editSelect = cell.querySelector('.edit-select');
        const editContaContainer = cell.querySelector('.edit-conta-container');
        const emitNota = cell.querySelector

        if (editSelect) {
            editSelect.value = originalValues[cell.dataset.field] || '';
            displayText.style.display = 'block';
            editSelect.style.display = 'none';
        } else if (editContaContainer) {
            // Restaurar valores originais para conta
            const contaCodigo = editContaContainer.querySelector('.edit-conta-codigo');
            const contaDesc = editContaContainer.querySelector('.edit-conta-desc');

            if (contaCodigo) {
                contaCodigo.value = originalValues[cell.dataset.field] || '';
            }
            if (contaDesc) {
                contaDesc.value = originalValues[cell.dataset.field + '_desc'] || '';
            }

            displayText.style.display = 'block';
            editContaContainer.style.display = 'none';
        } else if (editInput) {
            editInput.value = originalValues[cell.dataset.field] || '';
            displayText.style.display = 'block';
            editInput.style.display = 'none';
        }
    });

    // Restaurar botões
    row.querySelector('.btn-acao.editar').style.display = 'inline-flex';
    row.querySelector('.action-btn.resolve').style.display = 'inline-flex'
    row.querySelector('.action-btn.cancel').style.display = 'inline-flex'
    row.querySelector('.btn-acao.salvar').style.display = 'none';
    row.querySelector('.btn-acao.cancelar').style.display = 'none';


    editingRow = null;
    originalValues = {};
}
function salvarEdicao(button) {
    const row = button.closest('tr');
    const model = row.querySelector('.editable').dataset.model;
    const id = row.querySelector('.editable').dataset.id;

    console.log('Salvando edição para:', { model, id });

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
        const editSelect = cell.querySelector('.edit-select');
        const editContaContainer = cell.querySelector('.edit-conta-container');
        const displayText = cell.querySelector('.display-text');

        let currentValue = '';
        let valueToSend = '';

        console.log('Processando campo:', field);

        if (editSelect) {
            currentValue = editSelect.value;
            valueToSend = currentValue;

            console.log('Campo select:', { currentValue, valueToSend });

            // Atualizar display
            const selectedOption = editSelect.options[editSelect.selectedIndex];
            displayText.textContent = selectedOption.textContent;

            // Esconder select, mostrar texto
            displayText.style.display = 'block';
            editSelect.style.display = 'none';

        } else if (editContaContainer) {
            const contaCodigo = editContaContainer.querySelector('.edit-conta-codigo');
            const contaDesc = editContaContainer.querySelector('.edit-conta-desc');

            currentValue = contaCodigo ? contaCodigo.value : '';
            valueToSend = currentValue;

            console.log('Campo conta:', {
                contaCodigo: contaCodigo ? contaCodigo.value : 'não encontrado',
                contaDesc: contaDesc ? contaDesc.value : 'não encontrado',
                currentValue,
                valueToSend
            });

            // Atualizar display
            if (contaDesc && contaDesc.value) {
                displayText.textContent = contaDesc.value;
            } else {
                displayText.textContent = 'Nenhuma conta selecionada';
            }

            // Esconder container, mostrar texto
            displayText.style.display = 'block';
            editContaContainer.style.display = 'none';

            // IMPORTANTE: Enviar como conta_codigo para o backend
            formData.append('conta_codigo', valueToSend);

        } else if (editInput) {
            currentValue = editInput.value;
            valueToSend = currentValue;

            console.log('Campo input:', { currentValue, valueToSend });

            // Atualizar display
            displayText.textContent = formatarDataBR(currentValue);

            // Esconder input, mostrar texto
            displayText.style.display = 'block';
            editInput.style.display = 'none';
        }

        // Verificar se houve mudanças
        if (currentValue !== originalValues[field]) {
            hasChanges = true;
            console.log('Campso alterado:', field, 'de', originalValues[field], 'para', currentValue);
        }

        // Adicionar ao FormData (exceto para conta_codigo que já foi adicionado acima)
        if (field !== 'conta_codigo') {
            formData.append(field, valueToSend);
        }

        cell.classList.remove('editing');
    });

    console.log('FormData para envio:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }

    if (!hasChanges) {
        console.log('Nenhuma alteração detectada');
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
            console.log('Resposta do servidor:', data);
            if (data.success) {
                mostrarMensagem('Alterações salvas com sucesso!', 'success');

                // Restaurar botões
                row.querySelector('.btn-acao.editar').style.display = 'inline-flex';
                row.querySelector('.action-btn.resolve').style.display = 'inline-flex'
                row.querySelector('.action-btn.cancel').style.display = 'inline-flex'
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


// Funções para controle dos modais
function openEmitModal() {

    document.getElementById('emitModal').classList.add('active');
}

function openResolveModal() {


    document.getElementById('resolveModal').classList.add('active');
}

function openCancelModal() {
    document.getElementById('cancelModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Funções para ações dos botões (simulação)
function emitNote() {
    alert('Nota fiscal emitida com sucesso! Esta pendência será marcada como resolvida.');
    closeModal('emitModal');
}

function resolvePendency() {
    const modal = document.getElementById('resolveModal')
    const notaId = document.getElementById('notaId')
    numero = document.getElementById('numero_nota')
    link = document.getElementById('link_nota')
    data_emissao = document.getElementById('emissao_nota')
    observacao = document.getElementById('observacao_nota')
    console.log(`Abriu: ${notaId}`)


    alert('Pendência marcada como resolvida!');
    closeModal('resolveModal');
}

function cancelPendency() {
    alert('Pendência justificada/cancelada!');
    closeModal('cancelModal');
}

// Fechar modal ao clicar fora
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Atualizar contadores (exemplo de interação)
document.querySelectorAll('.filter-select, .filter-input').forEach(element => {
    element.addEventListener('change', function () {
        // Simula uma filtragem
        document.querySelector('.counter-number').textContent = '8';
        document.querySelector('.card.open .card-value').textContent = '8';
    });
});

// Limpar filtros
document.querySelector('.clear-filters').addEventListener('click', function () {
    document.querySelectorAll('.filter-select').forEach(select => {
        select.value = '';
    });
    document.querySelector('.filter-input').value = '2023-10-01';

    // Restaura contadores
    document.querySelector('.counter-number').textContent = '12';
    document.querySelector('.card.open .card-value').textContent = '12';
});