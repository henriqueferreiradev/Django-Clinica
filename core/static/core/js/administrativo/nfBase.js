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

            // Se ainda não foi inicializado
            if (!editInput._flatpickr) {
                flatpickr(editInput, {
                    dateFormat: "d/m/Y",
                    allowInput: true
                });
            }

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
    configurarAutocompletePacientes();
}


async function openInfoModal(button) {
    const pendenciaId = button.dataset.notaId;

    // salva no hidden se precisar depois
    document.getElementById('notaId').value = pendenciaId;

    document.getElementById('infoModal').classList.add('active');

    try {
        const res = await apiRequest(`/api/detalhe-nf-emitida/pendencia/${pendenciaId}/`);

        if (!res.success || !res.nota) {
            console.warn('Nenhuma nota encontrada');
            return;
        }

        console.log('Detalhes da nota:', res.nota);

        document.getElementById('nfNumero').innerText = res.nota.numero;
        document.getElementById('nfPaciente').innerText = res.nota.paciente;
        document.getElementById('nfDocumento').innerText = res.nota.documento;

        document.getElementById('nfData').innerText = formatarDataBR(res.nota.data_emissao);
        document.getElementById('nfLink').innerText = res.nota.link;
        document.getElementById('nfObs').innerText = res.nota.observacao;

    } catch (err) {
        console.error('Erro ao buscar nota fiscal:', err);
    }
}

function openResolveModal(btn) {
    const notaId = btn.dataset.notaId;
    document.getElementById('notaId').value = notaId;
    document.getElementById('resolveModal').classList.add('active');
}
function openCancelModal(btn) {
    const notaId = btn.dataset.notaId;
    document.getElementById('notaId').value = notaId;
    document.getElementById('cancelModal').classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
function getCSRFToken() {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
async function apiRequest(url, data, method = 'POST') {
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest'
            },

            body: JSON.stringify(data)

        });

        return await response.json();
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { success: false, error: 'Erro de conexão' };
    }
}
// Funções para ações dos botões (simulação)
function emitNote() {
    alert('Nota fiscal emitida com sucesso! Esta pendência será marcada como resolvida.');
    closeModal('emitModal');
}

async function resolvePendency() {
    const notaId = document.getElementById('notaId').value;

    const dados = {
        pendencia: notaId,
        numero: document.getElementById('numero_nota').value,
        link: document.getElementById('link_nota').value,
        data_emissao: document.getElementById('emissao_nota').value,
        observacao: document.getElementById('observacao_nota').value
    };

    console.log(dados);

    const res = await apiRequest('/api/salvar-nf/', dados);

    if (res.success) {
        mostrarMensagem('Dados enviados com sucesso', 'success');
        closeModal('resolveModal');
        // opcional: atualizar a linha ou dar reload
    } else {
        mostrarMensagem('Erro ao salvar: ' + res.error, 'error');
    }
}
async function cancelPendency() {
    const notaId = document.getElementById('notaId').value;

    const dados = {
        pendencia: notaId,
        motivo_cancelamento: document.getElementById('motivo_canc').value,
        observacao: document.getElementById('obs_canc').value,

    };

    console.log(dados);

    const res = await apiRequest('/api/cancelar-nf/', dados);

    if (res.success) {
        mostrarMensagem('Dados enviados com sucesso', 'success');
        closeModal('cancelModal');
        // opcional: atualizar a linha ou dar reload
    } else {
        mostrarMensagem('Erro ao salvar: ' + res.error, 'error');
    }
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



// Função para copiar mensagem ao clicar no item
function configurarCliqueParaCopiarMensagem() {
    // Usar delegação de eventos para funcionar com elementos dinâmicos
    document.addEventListener('click', function (e) {
        // Verificar se o clique foi em um item de mensagem (não no template original)
        const messageItem = e.target.closest('.message-item:not(.template)');

        if (messageItem) {
            copiarTextoMensagem(messageItem);
        }
    });
}

// Função principal para copiar o texto da mensagem
function copiarTextoMensagem(messageItem) {
    // Encontrar o elemento que contém o texto da mensagem
    const messageTextElement = messageItem.querySelector('p');

    if (!messageTextElement) {
        mostrarMensagem('Elemento da mensagem não encontrado', 'error');
        return;
    }

    // Pegar o texto da mensagem
    const textoMensagem = messageTextElement.textContent.trim();

    if (!textoMensagem) {
        mostrarMensagem('Mensagem vazia', 'warning');
        return;
    }

    // Usar a Clipboard API para copiar
    navigator.clipboard.writeText(textoMensagem)
        .then(() => {
            // Feedback de sucesso usando a função existente
            mostrarMensagem('Mensagem copiada para a área de transferência!', 'success');

            // Adicionar feedback visual temporário no item
            adicionarFeedbackVisual(messageItem);
        })
        .catch(err => {
            console.error('Erro ao copiar:', err);

            // Fallback para navegadores mais antigos
            copiarComFallback(textoMensagem, messageItem);
        });
}

// Fallback para navegadores sem Clipboard API
function copiarComFallback(texto, messageItem) {
    try {
        // Criar um textarea temporário
        const textarea = document.createElement('textarea');
        textarea.value = texto;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);

        // Selecionar e copiar
        textarea.select();
        textarea.setSelectionRange(0, 99999); // Para mobile

        const sucesso = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (sucesso) {
            mostrarMensagem('Mensagem copiada para a área de transferência!', 'success');
            adicionarFeedbackVisual(messageItem);
        } else {
            mostrarMensagem('Erro ao copiar a mensagem', 'error');
        }
    } catch (err) {
        console.error('Erro no fallback:', err);
        mostrarMensagem('Erro ao copiar a mensagem', 'error');
    }
}

// Adicionar feedback visual temporário no item
function adicionarFeedbackVisual(messageItem) {
    // Adicionar classe de destaque
    messageItem.classList.add('copied');

    // Remover destaque após 1.5 segundos
    setTimeout(() => {
        messageItem.classList.remove('copied');
    }, 1500);
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', configurarCliqueParaCopiarMensagem);

function configurarAutocompletePacientes() {
    const input = document.getElementById('busca');
    const sugestoes = document.getElementById('sugestoes');
    const pacienteIdInput = document.getElementById('paciente_id');


    if (!input || !sugestoes || !pacienteIdInput) return;

    input.addEventListener('input', async () => {
        const query = input.value.trim();



        try {
            const res = await fetch(`/api/buscar-pacientes/?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

            const data = await res.json();
            sugestoes.innerHTML = '';
            sugestoes.style.display = 'block';
            (data.resultados || []).forEach(paciente => {
                const div = document.createElement('div');
                div.textContent = `${paciente.nome} ${paciente.sobrenome}`;
                div.style.padding = '.7em';
                div.style.cursor = 'pointer';

                div.onclick = () => {
                    input.value = `${paciente.nome} ${paciente.sobrenome}`;
                    pacienteIdInput.value = paciente.id;

                    sugestoes.innerHTML = '';
                    sugestoes.style.display = 'none';

                    carregarServicosPaciente(paciente.id);
                };

                sugestoes.appendChild(div);
            });

        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
    });
}

async function carregarServicosPaciente(pacienteId) {
    const select = document.getElementById('servicoSelect');
    select.innerHTML = '<option>Carregando...</option>';

    const res = await fetch(`/api/paciente/${pacienteId}/servicos/`);
    const data = await res.json();

    select.innerHTML = '<option value="">Selecione um serviço</option>';

    data.servicos.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.nome;
        opt.dataset.valor = s.valor;
        opt.dataset.data = s.data_pagamento;
        select.appendChild(opt);

    });
}

document.getElementById('servicoSelect').addEventListener('change', () => {
    const select = document.getElementById('servicoSelect');
    const opt = select.options[select.selectedIndex];

    // pega do dataset da option
    const valor = opt.dataset.valor;
    const data = opt.dataset.data;

    // preenche inputs
    document.getElementById('valorPago').value = valor ? `R$ ${valor}` : '';
    document.getElementById('dataPag').value = data || '';
});
