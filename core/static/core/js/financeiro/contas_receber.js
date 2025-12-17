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

async function openReceitaPayment(itemId, tipo) {
    console.log('Abrindo item:', tipo, 'ID:', itemId);

    let endpoint;

    // Decide qual endpoint chamar baseado no tipo
    if (tipo === 'pacote_direto') {
        endpoint = `/pacote/${itemId}/dados-pagamento/`;
    } else if (tipo === 'pacote_via_receita') {
        endpoint = `/receita/${itemId}/dados-pagamento/`;
    } else if (tipo === 'receita_manual') {
        endpoint = `/receita/${itemId}/dados-pagamento/`;
    } else {
        // Fallback para compatibilidade
        endpoint = `/receita/${itemId}/dados-pagamento/`;
    }

    try {
        const resp = await fetch(endpoint);
        const data = await resp.json();
        console.log('Dados recebidos:', data);

        if (data.success) {
            const container = document.getElementById('modalPagamento');

            // Template com informações mais completas
            const descricaoExtra = tipo === 'receita_manual' ?
                '<small class="text-muted d-block mt-1">(Receita Manual)</small>' :
                '';

            container.innerHTML = `
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">
                        <i class="fas fa-cash-register"></i> Registrar Recebimento
                        ${tipo === 'receita_manual' ? '<span class="badge bg-info ms-2">Manual</span>' : ''}
                        ${tipo === 'pacote_via_receita' ? '<span class="badge bg-warning ms-2">Pacote</span>' : ''}
                        ${tipo === 'pacote_direto' ? '<span class="badge bg-warning ms-2">Pacote Direto</span>' : ''}
                    </h3>
                    <button class="modal-close" id="closePaymentModal">&times;</button>
                </div>

                <div class="modal-body">
                    <form id="formPagamento">
                        <input type="hidden" id="receitaId" value="${itemId}">
                        <input type="hidden" id="tipoReceita" value="${tipo}">
                        
                        <div class="form-grid">
                            <div class="form-group">
                                <label class="form-label"><i class="fas fa-user"></i> Paciente</label>
                                <input type="text" class="form-control" 
                                       value="${data.paciente.nome}" readonly>
                            </div>

                            <div class="form-group">
                                <label class="form-label"><i class="fa fa-align-left"></i> Descrição</label>
                                <input type="text" class="form-control" 
                                       value="${data.receita.descricao}" readonly>
                                ${descricaoExtra}
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label"><i class="fas fa-dollar-sign"></i> Valor Total</label>
                                    <input type="text" class="form-control" 
                                           value="R$ ${parseFloat(data.receita.valor).toFixed(2)}" readonly>
                                </div>
                                <div class="form-group">
                                    <label class="form-label"><i class="fas fa-dollar-sign"></i> Saldo Restante</label>
                                    <input type="text" class="form-control" 
                                           value="R$ ${parseFloat(data.receita.saldo).toFixed(2)}" readonly>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label">Data do Recebimento<span class='required'>*</span></label>
                                    <input type="date" class="form-control" id="dataPagamento" required>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Data de Vencimento</label>
                                    <input type="date" class="form-control" 
                                           value="${data.receita.vencimento || ''}" readonly>
                                </div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="form-label"><i class="fa fa-credit-card"></i> Forma de Pagamento<span class='required'>*</span></label>
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
                                    <label class="form-label"><i class="fas fa-dollar-sign"></i> Valor Recebido<span class='required'>*</span></label>
                                    <input type="number" class="form-control" id="valorPago" 
                                           placeholder="0,00" step="0.01" 
                                           max="${data.receita.saldo}" required>
                                </div>
                            </div>

                            <div class="form-group">
                                <label class="form-label">Observações</label>
                                <textarea class="form-control" id="observacoes" rows="2"></textarea>
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

            // Mostra o modal
            container.classList.add('active');

            // Configura eventos
            setupPaymentModal();

            // Preenche data atual
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('dataPagamento').value = hoje;

        } else {
            alert('Erro: ' + (data.error || 'Não foi possível carregar os dados'));
        }

    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao carregar dados');
    }
}

async function processarRecebimentoManual() {
    console.log('processarRecebimentoManual chamado!');

    // Coletar dados do formulário
    const pacienteId = document.getElementById('paciente_id').value;
    const categoriaId = document.getElementById('categoria_tipo').value;
    const dataVencimento = document.getElementById('data_vencimento').value;
    const descricao = document.getElementById('descricao_produto').value;
    const valor = parseFloat(document.getElementById('valor_recebido').value);
    const formaPagamento = document.getElementById('forma_pagamento').value;
    const dataRecebimento = document.getElementById('data_recebimento').value;
    const statusPagamento = document.getElementById('status_pagamento').value;
    const gerarComprovante = document.getElementById('gerarComprovante').checked;

    // Validações básicas
    if (!pacienteId || !categoriaId || !dataVencimento || !descricao || !valor || !statusPagamento) {
        mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'warning');
        return;
    }

    if (valor <= 0) {
        mostrarMensagem('O valor deve ser maior que zero.', 'warning');
        return;
    }

    try {
        // Preparar payload para envio
        const payload = {
            paciente_id: pacienteId,
            categoria_id: categoriaId,
            data_vencimento: dataVencimento,
            descricao: descricao,
            valor: valor,
            forma_pagamento: formaPagamento,
            status: statusPagamento,
            gerar_comprovante: gerarComprovante,
            tipo: 'receita_manual'  // Importante para identificar que é uma receita manual
        };

        // Se já foi recebido (status = "pago"), incluir data do recebimento
        if (statusPagamento === 'pago' && dataRecebimento) {
            payload.data_pagamento = dataRecebimento;
        } else if (statusPagamento === 'pago') {
            // Se não informou data de recebimento, usa a data atual
            const hoje = new Date().toISOString().split('T')[0];
            payload.data_pagamento = hoje;
        }

        console.log('Enviando dados:', payload);

        // Enviar para o backend
        const response = await fetch('/receita/criar-receita-manual/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensagem('Receita manual criada com sucesso!', 'success');

            // Fechar modal
            document.getElementById('modalRecebimento').classList.remove('active');

            // Limpar formulário
            document.getElementById('formRecebimento').reset();
            document.getElementById('paciente_id').value = '';

            // Recarregar a página após 1 segundo para ver os novos dados
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } else {
            mostrarMensagem('Erro: ' + (result.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('Erro ao processar recebimento manual:', error);
        mostrarMensagem('Erro ao processar requisição. Tente novamente.', 'error');
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
function setupRecebimentoModal() {
    console.log('setupRecebimentoModal chamado!'); // MOVER PARA AQUI

    const closeBtn = document.getElementById('closeRecebimentoModal');
    const cancelBtn = document.getElementById('cancelRecebimentoModal');
    const saveBtnManual = document.getElementById('saveRecebimento');



    if (closeBtn) {
        console.log('Close button encontrado');
        closeBtn.addEventListener('click', function () {
            document.getElementById('modalRecebimento').classList.remove('active');
        });
    }

    if (cancelBtn) {
        console.log('Cancel button encontrado');
        cancelBtn.addEventListener('click', function () {
            document.getElementById('modalRecebimento').classList.remove('active');
        });
    }

    if (saveBtnManual) {
        console.log('Save button encontrado, configurando evento...');
        saveBtnManual.addEventListener('click', function (e) {
            e.preventDefault(); // Adicionar para prevenir comportamento padrão
            console.log('Botão Salvar clicado!');
            processarRecebimentoManual();
        });
    } else {
        console.error('Botão saveRecebimento NÃO encontrado!');
    }
}

async function processarRecebimento() {
    const receitaId = document.getElementById('receitaId').value;
    const tipoReceita = document.getElementById('tipoReceita').value;
    const dataPagamento = document.getElementById('dataPagamento').value;
    const formaPagamento = document.getElementById('formaPagamento').value;
    const valorPago = parseFloat(document.getElementById('valorPago').value);
    const observacoes = document.getElementById('observacoes')?.value || '';

    // Validação básica
    if (!dataPagamento || !formaPagamento || !valorPago || valorPago <= 0) {
        mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'info');
        return;
    }

    try {
        const endpoint = `/receita/${receitaId}/registrar-pagamento/`;

        const payload = {
            data_pagamento: dataPagamento,
            forma_pagamento: formaPagamento,
            valor_pago: valorPago,
            observacoes: observacoes,
            tipo_receita: tipoReceita  // IMPORTANTE: Envia o tipo!
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            mostrarMensagem('Recebimento registrado com sucesso!', 'success');
            document.getElementById('modalPagamento').classList.remove('active');
            setTimeout(() => window.location.reload(), 1000);
        } else {
            mostrarMensagem('Erro: ' + (result.message || 'Erro desconhecido'), 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao processar requisição.', 'error');
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

    if (document.getElementById('modalRecebimento')) {
        setupRecebimentoModal();
        console.log('Modal de recebimento configurado');
    }
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


