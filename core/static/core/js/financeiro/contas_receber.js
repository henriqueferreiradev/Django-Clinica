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

async function openReceitaPayment(receitaId) {


    console.log('Abrindo receita:', receitaId);

    const container = document.getElementById('modalPagamento')
    const resp = await fetch(`/receita/${receitaId}/dados-pagamento/`);
    const data = await resp.json();
    console.log(data)

    if (data.success) {
        container.innerHTML = `
    <div class="modal-container">
        <div class="modal-header">
            <h3 class="modal-title">
                <i class="fas fa-cash-register"></i> Registrar Recebimento
            </h3>
            <button class="modal-close" id="closePaymentModal">&times;</button>
        </div>

        <div class="modal-body">
            <form id="formPagamento">
                <input type="hidden" id="receitaId" value="${receitaId}">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Paciente</label>
                        <input type="text" class="form-control" value="${data.paciente.nome}" readonly>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Descrição</label>
                        <input type="text" class="form-control" value="${data.receita.descricao}" readonly>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Valor Original</label>
                            <input type="text" class="form-control" value="${data.receita.saldo}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Data do Recebimento *</label>
                            <input type="date" class="form-control" id="dataPagamento" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Forma de Pagamento *</label>
                            <select class="form-select" id="formaPagamento" required>
                                <option value="" disabled selected>Selecione...</option>
                                <option value="pix">Pix</option>
                                <option value="credito">Cartão de Crédito</option>
                                <option value="debito">Cartão de Débito</option>
                                <option value="dinheiro">Dinheiro</option>
                                <option value="outro">Outro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Valor Recebido *</label>
                            <input type="number" class="form-control" id="valorPago" step="0.01" required>
                        </div>
                    </div>

                    <div class="form-group">
                        <div class="form-check">
                            <label class='checkbox-option'>
                                <input type="checkbox" class="form-check-input" id="gerarRecibo">
                            </label>
                            <label class="form-check-label" for="gerarRecibo">Gerar recibo</label>
                        </div>
                    </div>
                </div>
            </form>
        </div>

        <div class="modal-footer">
            <button class="btn btn-outline" id="cancelPaymentModal">Cancelar</button>
            <button class="btn btn-primary" id="savePagamento">
                <i class="fas fa-check-circle"></i> Confirmar Recebimento
            </button>
        </div>
    </div>`;

        // Mostra o modal usando o sistema do segundo script
        container.classList.add('active');

        // Configura os eventos específicos deste modal
        setupPaymentModal();
    }
}

// Função para configurar os eventos do modal de pagamento
function setupPaymentModal() {
    const closeBtn = document.getElementById('closePaymentModal');
    const cancelBtn = document.getElementById('cancelPaymentModal');
    const saveBtn = document.getElementById('savePagamento');

    // Fechar modal
    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            document.getElementById('modalPagamento').classList.remove('active');
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function () {
            document.getElementById('modalPagamento').classList.remove('active');
        });
    }

    // Salvar recebimento
    if (saveBtn) {
        saveBtn.addEventListener('click', processarRecebimento);
    }

    // Preenche data atual como padrão
    const dataInput = document.getElementById('dataPagamento');
    if (dataInput) {
        dataInput.valueAsDate = new Date();
    }
}

// Função para processar o recebimento
async function processarRecebimento() {
    const receitaId = document.getElementById('receitaId').value;
    const dataPagamento = document.getElementById('dataPagamento').value;
    const formaPagamento = document.getElementById('formaPagamento').value;
    const valorPago = parseFloat(document.getElementById('valorPago').value);
    const gerarRecibo = document.getElementById('gerarRecibo').checked;

    // Validação básica
    if (!dataPagamento || !formaPagamento || !valorPago || valorPago <= 0) {
        alert('Por favor, preencha todos os campos obrigatórios com valores válidos.');
        return;
    }

    try {
        const response = await fetch(`/receita/${receitaId}/registrar-pagamento/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                data_pagamento: dataPagamento,
                forma_pagamento: formaPagamento,
                valor_pago: valorPago,
                gerar_recibo: gerarRecibo
            })
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensagem('Recebimento registrado com sucesso!', 'success')
            alert('Recebimento registrado com sucesso!');
            // Fecha o modal usando o sistema do segundo script
            document.getElementById('modalPagamento').classList.remove('active');

            // Recarrega a página para ver as mudanças
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            alert('Erro ao registrar recebimento: ' + (result.message || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao processar recebimento.');
    }
}

// Função para obter token CSRF
function getCSRFToken() {
    const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];
    return cookieValue || '';
}
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

                div.addEventListener('click', () => {
                    input.value = `${paciente.nome} ${paciente.sobrenome}`;
                    pacienteIdInput.value = paciente.id;
                    sugestoes.innerHTML = '';
                    sugestoes.style.display = 'none';
                    verificarPacoteAtivo();
                    verificarBeneficiosAtivos(pacienteIdInput.value); // <-- chama aqui também
                });

                sugestoes.appendChild(div);
            });
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
    });
}
// Sistema de modais do segundo script (mantido intacto)
document.addEventListener('DOMContentLoaded', function () {
    // Bulk selection functionality
    const selectAll = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');
    const bulkActions = document.getElementById('bulkActions');
    const selectedCount = document.getElementById('selectedCount');

    function updateBulkActions() {
        const selected = document.querySelectorAll('.row-checkbox:checked').length;
        selectedCount.textContent = selected;

        if (selected > 0) {
            bulkActions.classList.add('active');
        } else {
            bulkActions.classList.remove('active');
        }
    }

    selectAll?.addEventListener('change', function () {
        const isChecked = this.checked;
        rowCheckboxes.forEach(checkbox => {
            if (!checkbox.disabled) {
                checkbox.checked = isChecked;
            }
        });
        updateBulkActions();
    });

    rowCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateBulkActions);
    });

    // Bulk action buttons
    document.getElementById('btnBulkReceive')?.addEventListener('click', function () {
        const selected = Array.from(document.querySelectorAll('.row-checkbox:checked'))
            .map(cb => cb.closest('tr').querySelector('td:nth-child(3)').textContent);
        alert(`Marcar como recebido: ${selected.join(', ')}`);
    });

    document.getElementById('btnBulkDeselect')?.addEventListener('click', function () {
        rowCheckboxes.forEach(cb => cb.checked = false);
        selectAll.checked = false;
        updateBulkActions();
    });

    // Filter functionality
    document.getElementById('btnFiltrar')?.addEventListener('click', function () {
        console.log('Aplicando filtros...');
    });

    document.getElementById('btnLimparFiltros')?.addEventListener('click', function () {
        document.querySelectorAll('.filter-select, .filter-input').forEach(el => {
            if (el.tagName === 'SELECT') {
                el.selectedIndex = 0;
            } else {
                el.value = '';
            }
        });
    });

    // Modal functionality - SISTEMA ORIGINAL MANTIDO
    const modals = {
        recebimento: document.getElementById('modalRecebimento'),
        pagamento: document.getElementById('modalPagamento')
    };

    // Open modals
    document.getElementById('openModalRecebimento')?.addEventListener('click',
        () => modals.recebimento.classList.add('active'));

    // REMOVI esta linha pois conflita com nosso sistema
    // document.querySelectorAll('.btn-success.btn-icon').forEach(btn => {
    //     btn.addEventListener('click', () => modals.pagamento.classList.add('active'));
    // });

    // Close modals
    document.getElementById('closeModal')?.addEventListener('click',
        () => modals.recebimento.classList.remove('active'));
    document.getElementById('cancelModal')?.addEventListener('click',
        () => modals.recebimento.classList.remove('active'));

    // REMOVI estas linhas pois usamos setupPaymentModal
    // document.getElementById('closePaymentModal')?.addEventListener('click',
    //     () => modals.pagamento.classList.remove('active'));
    // document.getElementById('cancelPaymentModal')?.addEventListener('click',
    //     () => modals.pagamento.classList.remove('active'));

    // Close modals on outside click
    Object.values(modals).forEach(modal => {
        modal?.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // Form submission
    document.getElementById('saveRecebimento')?.addEventListener('click', function (e) {
        e.preventDefault();
        const form = document.getElementById('formRecebimento');
        // Add form validation and submission logic here
        modals.recebimento.classList.remove('active');
    });

    // REMOVI esta linha pois usamos processarRecebimento
    // document.getElementById('savePagamento')?.addEventListener('click', function (e) {
    //     e.preventDefault();
    //     const form = document.getElementById('formPagamento');
    //     modals.pagamento.classList.remove('active');
    // });

    // Export functionality
    document.getElementById('btnExport')?.addEventListener('click', function () {
        alert('Exportando dados...');
    });

    // Print functionality
    document.getElementById('btnPrint')?.addEventListener('click', function () {
        window.print();
    });

    // Dropdown functionality
    document.addEventListener('click', function (e) {
        const toggle = e.target.closest('.dropdown-toggle');
        const openMenus = document.querySelectorAll('.dropdown-menu.show');

        if (toggle) {
            e.preventDefault();
            const menu = toggle.parentElement.querySelector('.dropdown-menu');
            if (menu) menu.classList.toggle('show');

            openMenus.forEach(m => {
                if (m !== menu) m.classList.remove('show');
            });
        } else {
            openMenus.forEach(m => m.classList.remove('show'));
        }
        if (document.getElementById('busca')) {
            configurarAutocompletePacientes();
        }
    });


});


