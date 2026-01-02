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
let modoPercentual = true;

// =============================================
// FUNÇÕES GLOBAIS (usadas no HTML)
// =============================================
window.calcularDesconto = function () {
    const valorInput = document.getElementById('valor_pacote');
    const descontoInput = document.getElementById('desconto');
    const valorFinalInput = document.getElementById('valor_final');
    if (!valorInput || !descontoInput || !valorFinalInput) return;

    const valorPacote = parseFloat(valorInput.value) || 0;
    const desconto = parseFloat(descontoInput.value) || 0;
    const valorFinal = modoPercentual
        ? (valorPacote - (valorPacote * (desconto / 100)))
        : (valorPacote - desconto);

    valorFinalInput.value = valorFinal.toFixed(2);
};

window.alternarModoDesconto = function () {
    const descontoLabel = document.getElementById('desconto_label');
    const descontoButton = document.getElementById('desconto_button');

    modoPercentual = !modoPercentual;

    if (descontoLabel) descontoLabel.textContent = modoPercentual ? 'Desconto (%)' : 'Desconto (R$)';
    if (descontoButton) descontoButton.textContent = modoPercentual ? 'R$' : '%';

    window.calcularDesconto();
};

window.alterarDesconto = function () {
    const valorInput = document.getElementById('valor_pacote');
    const valorFinalInput = document.getElementById('valor_final');
    const descontoInput = document.getElementById('desconto');
    if (!valorInput || !valorFinalInput || !descontoInput) return;

    const valorPacote = parseFloat(valorInput.value) || 0;
    const valorFinal = parseFloat(valorFinalInput.value) || 0;

    const descontoCalculado = (modoPercentual && valorPacote !== 0)
        ? ((valorPacote - valorFinal) / valorPacote) * 100
        : (valorPacote - valorFinal);

    descontoInput.value = (descontoCalculado || 0).toFixed(2);
};

// =============================================
// FUNÇÕES UTILITÁRIAS
// =============================================
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            if (cookie.trim().startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.trim().substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
async function verificarPacoteAtivo() {
    const pacienteIdInput = document.getElementById('paciente_id');
    if (!pacienteIdInput) return;

    const pacienteId = pacienteIdInput.value;
    const servicoSelect = document.getElementById('pacotesInput');
    const formValor = document.getElementById('formValor');
    const infoPacote = document.getElementById('info_pacote');
    const pacoteAtual = document.getElementById('pacote_atual');
    const avisoDiv = document.getElementById('aviso-pacote');
    const mensagemPacote = document.getElementById('mensagem-pacote');
    const usarPacoteBtn = document.getElementById('usar-pacote-btn');
    const campoPacote = document.getElementById('pacote_codigo');
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const radioButtons = document.querySelectorAll('input[name="tipo_agendamento"]');
    const usarRemarcacaoBtn = document.getElementById('usar-reposicao-btn');
    const infoReposicao = document.getElementById('info_reposicao');
    const tipoSessaoLabel = document.getElementById('tipo_sessao');
    const valorFinalInput = document.getElementById('valor_final');

    // Reset inicial
    if (avisoDiv) avisoDiv.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (servicoSelect) servicoSelect.disabled = false;
    if (formValor) formValor.classList.remove('hidden');
    if (infoPacote) infoPacote.classList.add('hidden');
    limparOpcaoPacoteServico();

    // Configurar toggles dos tipos de sessão
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            if (!servicoSelect) return;
            
            // Busca os elementos
            const servicosBancoAtual = document.querySelectorAll('.servico-banco');
            const servicosReposicaoAtual = document.querySelectorAll('.servico-reposicao');
            const optgroupReposicao = document.querySelector('.optgroup-reposicao');
            const optgroupsPacotes = document.querySelectorAll('optgroup[label="Pacotes"], optgroup[label="Sessões Avulsas"]');
            
            if (this.value === 'reposicao') {
                // Esconde opções normais
                servicosBancoAtual.forEach(opt => opt.hidden = true);
                optgroupsPacotes.forEach(optgroup => optgroup.style.display = 'none');
                
                // Mostra optgroup de reposição
                if (optgroupReposicao) {
                    optgroupReposicao.style.display = 'block';
                    
                    // Mostra APENAS as opções de reposição que estão disponíveis
                    servicosReposicaoAtual.forEach(opt => {
                        const tipoReposicao = opt.getAttribute('data-tipo');
                        if (tipoReposicao && window.saldosDesmarcacoes) {
                            const temSaldo = verificarSeTemSaldoParaTipo(tipoReposicao);
                            opt.hidden = !temSaldo;
                        } else {
                            opt.hidden = false;
                        }
                    });
                }
                
                servicoSelect.value = "";
                
                // Atualiza label
                if (tipoSessaoLabel) {
                    tipoSessaoLabel.textContent = 'Tipo de reposição';
                }
                
                // Mostra info de reposição
                if (infoReposicao) {
                    infoReposicao.innerHTML = `<strong>Reposição de sessão</strong>`;
                    infoReposicao.style.display = 'block';
                }
            } else {
                // Mostra opções normais
                servicosBancoAtual.forEach(opt => opt.hidden = false);
                optgroupsPacotes.forEach(optgroup => optgroup.style.display = 'block');
                
                // Esconde optgroup de reposição
                if (optgroupReposicao) {
                    optgroupReposicao.style.display = 'none';
                }
                
                servicosReposicaoAtual.forEach(opt => opt.hidden = true);
                servicoSelect.value = "";
                
                // Volta label
                if (tipoSessaoLabel) {
                    tipoSessaoLabel.textContent = 'Tipo de sessão';
                }
                
                // Esconde info de reposição
                if (infoReposicao) {
                    infoReposicao.style.display = 'none';
                }
            }
        });
    });

    if (!pacienteId) return;

    try {
        const response = await fetch(`/api/verificar_pacotes_ativos/${pacienteId}`);
        const data = await response.json();

        // Armazena os saldos globalmente para usar depois
        window.saldosDesmarcacoes = data.saldos_desmarcacoes || {};

        // Pacote ativo
        if (data.tem_pacote_ativo && servicoSelect) {
            const pacote = data.pacotes[0];
            const sessaoAtual = (pacote.quantidade_usadas || 0) + 1;
            const sessoesRestantes = pacote.quantidade_total - pacote.quantidade_usadas;
            
            // VERIFICA SE O PACOTE TEM SESSÕES DISPONÍVEIS
            const pacoteEsgotado = sessoesRestantes <= 0;
            
            if (mensagemPacote) {
                if (pacoteEsgotado) {
                    mensagemPacote.innerHTML = 
                        `<div style="color: #dc3545; font-weight: bold; padding: 10px; border: 2px solid #dc3545; border-radius: 5px; background-color: #f8d7da;">
                        ⚠️ <strong>PACOTE ESGOTADO!</strong><br>
                        Código: ${pacote.codigo}<br>
                        Total de sessões: ${pacote.quantidade_total}<br>
                        Sessões usadas: ${pacote.quantidade_usadas}<br>
                        Sessões restantes: ${sessoesRestantes}<br><br>
                        <em>Não é possível usar este pacote. Crie um novo.</em>
                        </div>`;
                    
                    // Desabilita o botão de usar pacote
                    if (usarPacoteBtn) {
                        usarPacoteBtn.disabled = true;
                        usarPacoteBtn.style.opacity = '0.5';
                        usarPacoteBtn.style.cursor = 'not-allowed';
                        usarPacoteBtn.textContent = 'Pacote esgotado';
                        usarPacoteBtn.onclick = null;
                    }
                } else {
                    mensagemPacote.innerHTML = 
                        `<div style="color: #0c5460; padding: 10px; border: 2px solid #bee5eb; border-radius: 5px; background-color: #d1ecf1;">
                        <strong>PACOTE ATIVO DISPONÍVEL</strong><br>
                        Código: ${pacote.codigo}<br>
                        Sessões totais: ${pacote.quantidade_total}<br>
                        Sessões usadas: ${pacote.quantidade_usadas}<br>
                        Sessões disponíveis: ${sessoesRestantes}<br>
                        Próxima sessão: ${sessaoAtual}<br><br>
                        Deseja usar este pacote?
                        </div>`;
                    
                    // Habilita o botão
                    if (usarPacoteBtn) {
                        usarPacoteBtn.disabled = false;
                        usarPacoteBtn.style.opacity = '1';
                        usarPacoteBtn.style.cursor = 'pointer';
                        usarPacoteBtn.textContent = `Usar pacote (${sessoesRestantes} disponíveis)`;
                        usarPacoteBtn.onclick = () => usarPacoteAtivo(pacote, sessaoAtual, sessoesRestantes);
                    }
                }
            }

            if (avisoDiv) avisoDiv.style.display = 'block';
        }

        // Saldos de desmarcações
        verificarSaldosDesmarcacoes(data.saldos_desmarcacoes || {});

        // Configurar botão de reposição
        if (usarRemarcacaoBtn) {
            usarRemarcacaoBtn.onclick = () => configurarReposicao();
        }
    } catch (error) {
        console.error('Erro ao verificar pacote:', error);
        if (formValor) formValor.classList.remove('hidden');
        if (infoPacote) infoPacote.classList.add('hidden');
        if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    }
}

// Nova função para verificar se tem saldo para um tipo específico
function verificarSeTemSaldoParaTipo(tipo) {
    if (!window.saldosDesmarcacoes) return false;
    
    const mapeamentoTipos = {
        'd': 'desistencia',
        'dcr': 'desistencia_remarcacao', 
        'fcr': 'falta_remarcacao',
        'fc': 'falta_cobrada'
    };
    
    const tipoApi = mapeamentoTipos[tipo];
    return tipoApi && window.saldosDesmarcacoes[tipoApi] > 0;
}
// REMOVA ESTA FUNÇÃO DUPLICADA (linhas ~255-298):
// function usarPacoteAtivo(pacote, sessaoAtual) { ... }

// Mantenha apenas a função com 3 parâmetros (linha ~193):
function usarPacoteAtivo(pacote, sessaoAtual, sessoesDisponiveis) {
    const servicoSelect = document.getElementById('pacotesInput');
    const formValor = document.getElementById('formValor');
    const infoPacote = document.getElementById('info_pacote');
    const valorFinalInput = document.getElementById('valor_final');
    const campoPacote = document.getElementById('pacote_codigo');
    const pacoteAtual = document.getElementById('pacote_atual');
    const avisoDiv = document.getElementById('aviso-pacote');
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const servicoHidden = document.getElementById('servico_id_hidden');

    // VALIDAÇÃO: verifica se há sessões disponíveis
    if (sessoesDisponiveis <= 0) {
        alert(`❌ PACOTE ESGOTADO!\n\nCódigo: ${pacote.codigo}\nSessões disponíveis: ${sessoesDisponiveis}`);
        
        // Esconde o aviso
        if (avisoDiv) avisoDiv.style.display = 'none';
        return;
    }

    // VALIDAÇÃO: verifica se a sessão atual é válida
    if (sessaoAtual > pacote.quantidade_total) {
        alert(`❌ ERRO: Sessão inválida!\n\nPróxima sessão: ${sessaoAtual}\nTotal de sessões: ${pacote.quantidade_total}`);
        return;
    }

    const option = document.createElement('option');
    option.value = String(pacote.servico_id);
    option.textContent = `Sessão ${sessaoAtual} de ${pacote.quantidade_total} (${sessoesDisponiveis} disponíveis)`;
    option.hidden = true;
    option.disabled = false;
    option.setAttribute("data-pacote", "true");

    servicoSelect.prepend(option);
    servicoSelect.value = option.value;

    if (servicoHidden) servicoHidden.value = pacote.servico_id;
    servicoSelect.disabled = true;
    servicoSelect.readOnly = true;

    atualizarInfoPacote(pacote, sessaoAtual, sessoesDisponiveis);

    if (formValor) formValor.classList.add('hidden');
    if (infoPacote) infoPacote.classList.remove('hidden');
    if (valorFinalInput) valorFinalInput.value = (pacote.valor_total - pacote.valor_pago).toFixed(2);
    if (campoPacote) campoPacote.value = pacote.codigo;

    if (pacoteAtual) {
        pacoteAtual.innerHTML = `<strong>Pacote ativo:</strong> Código <strong>${pacote.codigo}</strong> — Sessão ${sessaoAtual} de ${pacote.quantidade_total} (${sessoesDisponiveis} disponíveis)`;
        pacoteAtual.style.display = 'block';
    }

    const radioExistente = document.querySelector('input[name="tipo_agendamento"][value="existente"]');
    if (radioExistente) radioExistente.checked = true;

    if (avisoDiv) avisoDiv.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    
    // BLOQUEIA O BOTÃO APÓS SELECIONAR
    const usarPacoteBtn = document.getElementById('usar-pacote-btn');
    if (usarPacoteBtn) {
        usarPacoteBtn.disabled = true;
        usarPacoteBtn.textContent = 'Pacote em uso';
    }
}

function atualizarInfoPacote(pacote, sessaoAtual, sessoesDisponiveis) {
    const elementos = {
        codigo: document.getElementById('codigo_pacote_display'),
        valorPago: document.getElementById('valor_pago_display'),
        valorRestante: document.getElementById('valor_restante_display'),
        sessaoAtual: document.getElementById('sessao_atual_display'),
        totalSessoes: document.getElementById('total_sessoes_display'),
        sessoesDisponiveis: document.getElementById('sessoes_disponiveis_display') // Adicione este campo no HTML se necessário
    };

    if (elementos.codigo) elementos.codigo.textContent = pacote.codigo;
    if (elementos.valorPago) elementos.valorPago.textContent = Number(pacote.valor_pago).toFixed(2);
    if (elementos.valorRestante) elementos.valorRestante.textContent = (pacote.valor_total - pacote.valor_pago).toFixed(2);
    if (elementos.sessaoAtual) elementos.sessaoAtual.textContent = sessaoAtual;
    if (elementos.totalSessoes) elementos.totalSessoes.textContent = pacote.quantidade_total;
    if (elementos.sessoesDisponiveis) elementos.sessoesDisponiveis.textContent = sessoesDisponiveis;
}

function verificarSaldosDesmarcacoes(saldos) {
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const mensagemDesmarcacoes = document.getElementById('mensagem-desmarcacoes');

    const mensagens = [];
    if ((saldos.desistencia || 0) > 0) mensagens.push(`❌ D: ${saldos.desistencia}`);
    if ((saldos.desistencia_remarcacao || 0) > 0) mensagens.push(`⚠ DCR: ${saldos.desistencia_remarcacao}`);
    if ((saldos.falta_remarcacao || 0) > 0) mensagens.push(`⚠ FCR: ${saldos.falta_remarcacao}`);
    if ((saldos.falta_cobrada || 0) > 0) mensagens.push(`❌ FC: ${saldos.falta_cobrada}`);

    if (mensagens.length > 0) {
        if (mensagemDesmarcacoes) {
            mensagemDesmarcacoes.textContent =
                `Este paciente possui sessões desmarcadas registradas: ${mensagens.join(' | ')}`;
        }
        if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'block';
    } else {
        if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    }
}

function configurarReposicao() {
    const radioReposicao = document.querySelector('input[name="tipo_agendamento"][value="reposicao"]');
    const infoReposicao = document.getElementById('info_reposicao');
    const avisoDiv = document.getElementById('aviso-pacote');
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const tipoSessaoLabel = document.getElementById('tipo_sessao');

    if (radioReposicao) {
        radioReposicao.checked = true;
        radioReposicao.dispatchEvent(new Event('change'));
    }

    if (infoReposicao) {
        infoReposicao.innerHTML = `<strong>Reposição de sessão</strong>`;
        infoReposicao.style.display = 'block';
    }

    if (avisoDiv) avisoDiv.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (tipoSessaoLabel) tipoSessaoLabel.textContent = 'Tipo de reposição';
}

function limparOpcaoPacoteServico() {
    const servicoSelect = document.getElementById('pacotesInput');
    const formValor = document.getElementById('formValor');
    const infoPacote = document.getElementById('info_pacote');
    if (!servicoSelect) return;

    servicoSelect.querySelectorAll('option[data-pacote="true"]').forEach(opt => opt.remove());
    servicoSelect.disabled = false;
    servicoSelect.readOnly = false;
    servicoSelect.value = '';

    if (formValor) formValor.classList.remove('hidden');
    if (infoPacote) infoPacote.classList.add('hidden');


}

// =============================================
// FUNÇÕES DE INTERFACE E INTERATIVIDADE
// =============================================
function configurarSidebar() {
    const openBtn = document.getElementById('openBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebar = document.getElementById('sidebar');

    if (openBtn && sidebar) {
        openBtn.addEventListener('click', () => {
            sidebar.removeAttribute('hidden');
            sidebar.classList.add('active');
            document.body.classList.add('modal-open');
        });
    }

    if (closeBtn && sidebar) {
        closeBtn.addEventListener('click', () => {

            sidebar.classList.remove('active');
            sidebar.setAttribute('hidden', '');

            document.body.classList.remove('modal-open');
        });
    }
}

function configurarSubmenus() {
    document.querySelectorAll('.submenu-header').forEach(header => {
        header.addEventListener('click', function () {
            const submenu = this.parentElement;
            submenu.classList.toggle('open');
        });
    });
}

function configurarAutocompletePacientes() {
    const input = document.getElementById('busca');
    const sugestoes = document.getElementById('sugestoes');
    const pacienteIdInput = document.getElementById('paciente_id');
    const avisoDiv = document.getElementById('aviso-pacote');
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const pacoteAtual = document.getElementById('pacote_atual');
    const avisoBeneficio = document.getElementById('aviso-beneficio'); // Adicione esta linha

    if (!input || !sugestoes || !pacienteIdInput) return;

    // Função para resetar tudo quando o campo de busca estiver vazio
    const resetarFormulario = () => {
        pacienteIdInput.value = '';
        if (avisoDiv) avisoDiv.style.display = 'none';
        if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
        if (avisoBeneficio) avisoBeneficio.style.display = 'none'; // Esconde benefícios
        if (pacoteAtual) pacoteAtual.style.display = 'none';

        // Resetar todos os campos relacionados ao pacote
        const servicoSelect = document.getElementById('pacotesInput');
        const servicoHidden = document.getElementById('servico_id_hidden');
        const formValor = document.getElementById('formValor');
        const infoPacote = document.getElementById('info_pacote');
        const valorFinalInput = document.getElementById('valor_final');
        const campoPacote = document.getElementById('pacote_codigo');

        if (servicoSelect) {
            servicoSelect.disabled = false;
            servicoSelect.readOnly = false;
            servicoSelect.querySelectorAll('option[data-pacote="true"]').forEach(op => op.remove());
            servicoSelect.value = '';
        }

        if (servicoHidden) servicoHidden.value = "";
        if (formValor) formValor.classList.remove('hidden');
        if (infoPacote) infoPacote.classList.add('hidden');
        if (valorFinalInput) valorFinalInput.value = "";
        if (campoPacote) campoPacote.value = '';

        // Resetar campos de benefício
        const beneficioTipo = document.getElementById('beneficio_tipo');
        const beneficioPercentual = document.getElementById('beneficio_percentual');
        if (beneficioTipo) beneficioTipo.value = '';
        if (beneficioPercentual) beneficioPercentual.value = '';

        // Resetar tipo de agendamento para "novo"
        const radioNovo = document.querySelector('input[name="tipo_agendamento"][value="novo"]');
        if (radioNovo) radioNovo.checked = true;

        // Resetar serviço para mostrar apenas opções normais
        const servicosBanco = document.querySelectorAll('.servico-banco');
        const servicosReposicao = document.querySelectorAll('.servico-reposicao');
        servicosBanco.forEach(opt => opt.hidden = false);
        servicosReposicao.forEach(opt => opt.hidden = true);

        // Resetar valor do serviço
        const valorPacote = document.getElementById('valor_pacote');
        if (valorPacote) valorPacote.value = "";

        // Resetar desconto
        const desconto = document.getElementById('desconto');
        if (desconto) desconto.value = "";

        // Esconder info de reposição
        const infoReposicao = document.getElementById('info_reposicao');
        if (infoReposicao) infoReposicao.style.display = 'none';

        // Resetar label de tipo de sessão
        const tipoSessaoLabel = document.getElementById('tipo_sessao');
        if (tipoSessaoLabel) tipoSessaoLabel.textContent = 'Tipo de sessão';

        // Limpar benefício selecionado
        limparBeneficioSelecionado();
    };

    input.addEventListener('input', async () => {
        const query = input.value.trim();

        // Se o campo estiver vazio, resetar tudo
        if (query.length === 0) {
            sugestoes.innerHTML = '';
            sugestoes.style.display = 'none';
            resetarFormulario();
            return;
        }

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
                    verificarBeneficiosAtivos(pacienteIdInput.value);
                });

                sugestoes.appendChild(div);
            });
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
    });

    // Adicionar evento para quando o campo perde o foco e está vazio
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (input.value.trim().length === 0) {
                resetarFormulario();
            }
        }, 200);
    });
}
function configurarSelecaoServico() {
    const pacotesInput = document.getElementById('pacotesInput');
    const valorInput = document.getElementById('valor_pacote');

    if (pacotesInput && valorInput) {
        pacotesInput.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const valor = parseFloat(selectedOption?.getAttribute('data-valor')) || 0;
            valorInput.value = valor.toFixed(2);
            window.calcularDesconto();
        });
    }
}

function configurarTipoAgendamentoNovo() {
    const radioNovo = document.querySelector('input[name="tipo_agendamento"][value="novo"]');
    if (!radioNovo) return;

    radioNovo.addEventListener('click', () => {
        const servicoSelect = document.getElementById('pacotesInput');
        const servicoHidden = document.getElementById('servico_id_hidden');
        const formValor = document.getElementById('formValor');
        const infoPacote = document.getElementById('info_pacote');
        const valorFinalInput = document.getElementById('valor_final');
        const pacoteAtual = document.getElementById('pacote_atual');
        const campoPacote = document.getElementById('pacote_codigo');
        const avisoDiv = document.getElementById('aviso-pacote');

        if (servicoSelect) {
            servicoSelect.disabled = false;
            servicoSelect.readOnly = false;
            servicoSelect.querySelectorAll('option[data-pacote="true"]').forEach(op => op.remove());
            servicoSelect.value = '';
        }

        if (servicoHidden) servicoHidden.value = "";
        if (formValor) formValor.classList.remove('hidden');
        if (infoPacote) infoPacote.classList.add('hidden');

        ['codigo_pacote_display', 'valor_pago_display', 'valor_restante_display',
            'sessao_atual_display', 'total_sessoes_display'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = "";
            });

        if (valorFinalInput) valorFinalInput.value = "";
        if (pacoteAtual) {
            pacoteAtual.textContent = "";
            pacoteAtual.style.display = 'none';
        }
        if (campoPacote) campoPacote.value = '';
        if (avisoDiv) avisoDiv.style.display = 'none';
    });
}

// =============================================
// FUNÇÕES DE EDIÇÃO DE AGENDAMENTOS
// =============================================
function configurarEdicaoAgendamentos() {
    document.querySelectorAll('.btn-editar-agendamento').forEach(botao => {
        botao.addEventListener("click", function () {
            const agendamentoId = this.dataset.id;
            window.currentAgendamentoId = agendamentoId;

            fetch(`/agendamento/json/${agendamentoId}/`)
                .then(response => response.json())
                .then(data => preencherModalEdicao(data))
                .catch(error => console.error('Erro ao carregar dados do agendamento:', error));
        });
    });

    configurarBotoesEditarHorario();
    configurarFormularioEdicao();
}

function preencherModalEdicao(data) {
    const setVal = (sel, val) => {
        const el = document.querySelector(sel);
        if (el) el.value = val ?? '';
    };

    setVal("#profissional1InputEdicao", data.profissional1_id);
    setVal("#dataInputEdicao", data.data);
    setVal("#horaInicioPrincipal", data.hora_inicio);
    setVal("#horaFimPrincipal", data.hora_fim);
    setVal("#profissional2InputEdicao", data.profissional2_id);
    setVal("#horaInicioAjuda", data.hora_inicio_aux);
    setVal("#horaFimAjuda", data.hora_fim_aux);

    const lista = document.querySelector("#lista-pagamentos");
    if (lista) {
        const pagamentos = (data.pagamentos || []).map(pag => `
      <tr>
        <td>${pag.data}</td>
        <td>R$ ${Number(pag.valor).toFixed(2)}</td>
        <td>${pag.forma_pagamento_display}</td>
      </tr>`).join('');

        lista.innerHTML = `
      <div class="formField">
        <table class="tabela-pagamentos">
          <thead>
            <tr><th>Data</th><th>Valor</th><th>Forma de Pagamento</th></tr>
          </thead>
          <tbody>
            ${pagamentos || `<tr><td colspan="3" style="text-align:center;">Nenhum pagamento registrado.</td></tr>`}
          </tbody>
        </table>
      </div>`;
    }

    const modal = document.querySelector("#modalEditAgenda");
    if (modal) modal.classList.add("active");
}

function configurarBotoesEditarHorario() {
    document.querySelectorAll('.editar-horario-btn').forEach(button => {

        button.addEventListener('click', function () {
            const container = this.closest('.agenda-hora');
            if (!container) return;

            const spanHora = container.querySelector('.hora-text');
            const inputInicio = container.querySelector('.hora-inicio-input');
            const inputFim = container.querySelector('.hora-fim-input');

            if (spanHora && inputInicio && inputFim) {
                if (!this.classList.contains('salvar-mode')) {
                    spanHora.classList.add('hidden');
                    inputInicio.classList.remove('hidden');
                    inputFim.classList.remove('hidden');
                    this.innerHTML = "<i class='bx bx-check'></i>";
                    this.classList.add('salvar-mode');
                }
            }
        });

        // Salvar
        button.addEventListener('click', async function () {
            if (!this.classList.contains('salvar-mode')) return;

            const container = this.closest('.agenda-hora');
            if (!container) return;

            const spanHora = container.querySelector('.hora-text');
            const inputInicio = container.querySelector('.hora-inicio-input');
            const inputFim = container.querySelector('.hora-fim-input');
            const agendamentoId = container?.dataset?.agendamentoId;
            if (!inputInicio || !inputFim || !spanHora || !agendamentoId) return;

            try {
                const response = await fetch('/agendamento/editar-horario/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': getCookie('csrftoken')
                    },
                    body: JSON.stringify({
                        agendamento_id: agendamentoId,
                        hora_inicio: inputInicio.value,
                        hora_fim: inputFim.value
                    })
                });

                if (response.ok) {
                    spanHora.textContent = `${inputInicio.value} – ${inputFim.value}`;
                    spanHora.classList.remove('hidden');
                    inputInicio.classList.add('hidden');
                    inputFim.classList.add('hidden');
                    this.innerHTML = "<i class='bx bx-edit'></i>";
                    this.classList.remove('salvar-mode');
                } else {
                    alert('Erro ao salvar horário.');
                }
            } catch (e) {
                alert('Erro ao salvar horário.');
            }
        });
    });
}

function configurarFormularioEdicao() {
    const formEdicao = document.getElementById('form-edicao');
    if (!formEdicao) return;

    formEdicao.addEventListener('submit', async function (e) {
        e.preventDefault();
        const agendamentoId = window.currentAgendamentoId;
        if (!agendamentoId) return;

        try {
            const response = await fetch(`/agendamento/editar/${agendamentoId}/`, {
                method: 'POST',
                body: new FormData(this),
                headers: { 'X-CSRFToken': getCookie('csrftoken') }
            });

            const data = await response.json();
            if (data.status === 'ok') {
                location.reload();
            } else {
                console.error('Erro ao editar agendamento:', data);
            }
        } catch (error) {
            console.error('Erro ao editar agendamento:', error);
        }
    });
}

// =============================================
// INICIALIZAÇÃO PRINCIPAL
// =============================================
document.addEventListener("DOMContentLoaded", async function () {
    configurarSidebar();
    configurarSubmenus();
    configurarAutocompletePacientes();
    configurarSelecaoServico();
    configurarTipoAgendamentoNovo();
    configurarEdicaoAgendamentos();

    // Se já tiver paciente selecionado ao abrir o modal
    const pacienteIdInput = document.getElementById('paciente_id');
    if (pacienteIdInput && pacienteIdInput.value) {
        await verificarPacoteAtivo();
        await verificarBeneficiosAtivos(pacienteIdInput.value); // <-- corrige aqui
    }
});

// =============================================
// BENEFÍCIOS
// =============================================
async function verificarBeneficiosAtivos(pacienteId) {
    if (!pacienteId) return;

    try {
        const resp = await fetch(`/api/verificar_beneficios_mes/${pacienteId}`);
        if (!resp.ok) return;
        const data = await resp.json();

        if (!data.tem_beneficio) return;

        const box = document.getElementById('aviso-beneficio');
        const msg = document.getElementById('mensagem-beneficio');
        const btns = document.getElementById('beneficio-botoes');
        if (!box || !msg || !btns) return;

        msg.innerHTML = `Benefícios de <strong>${data.status.toUpperCase()}</strong> disponíveis este mês:`;
        btns.innerHTML = '';

        data.beneficios.forEach(b => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn btn-sm';
            btn.disabled = !!b.usado;

            let iconClass = '';
            let label = '';
            let onClickAction = null;

            if (b.tipo === 'relaxante') {
                iconClass = 'fa-solid fa-spa'; // ícone relaxante (FA)
                label = b.usado ? 'Relaxante (usado)' : 'Usar sessão relaxante';
                onClickAction = () => selecionarServicoRelaxanteETravarsValor();
            }
            if (b.tipo === 'sessao_livre') {
                iconClass = 'fa-solid fa-wind'; // ícone livre (FA)
                label = b.usado ? 'Sessão livre (usada)' : 'Usar sessão livre';
                onClickAction = () => marcarSessaoLivre();
            }
            if (b.tipo === 'desconto') {
                iconClass = 'fa-solid fa-tag'; // ícone desconto (FA)
                label = b.usado ? `Desconto ${b.percentual}% (usado)` : `Aplicar ${b.percentual}% de desconto`;
                onClickAction = () => aplicarDescontoBloqueado(b.percentual);
            }
            if (b.tipo === 'brinde') {
                iconClass = 'fa-solid fa-gift'; // ícone brinde (FA)
                label = b.usado ? 'Brinde (registrado)' : 'Registrar brinde';
                onClickAction = () => registrarBrinde();
            }


            btn.innerHTML = `<i class='${iconClass}'></i> ${label}`;
            if (onClickAction) btn.onclick = onClickAction;

            btns.appendChild(btn);
        });


        box.style.display = 'block';
    } catch (e) {
        console.error('Erro ao verificar benefícios:', e);
    }
}

function selecionarServicoRelaxanteETravarsValor() {
    const servicoSelect = document.getElementById('pacotesInput');
    const servicoHidden = document.getElementById('servico_id_hidden');
    if (!servicoSelect) return;

    const RELAXANTE_ID = 'X'; // TODO: ajuste para o ID real
    const opt = [...servicoSelect.options].find(o => Number(o.value) === Number(RELAXANTE_ID));
    if (!opt) { alert('Serviço relaxante não encontrado'); return; }
    servicoSelect.value = opt.value;
    if (servicoHidden) servicoHidden.value = opt.value;
}

function marcarSessaoLivre() {
    document.getElementById('valor_final').value = '0.00';
    document.getElementById('beneficio_tipo').value = 'sessao_livre';
}

function aplicarDescontoBloqueado(percent) {
    const descontoInput = document.getElementById('desconto');
    descontoInput.value = Number(percent).toFixed(2);
    window.modoPercentual = true;
    window.calcularDesconto();
    document.getElementById('beneficio_tipo').value = 'desconto';
    document.getElementById('beneficio_percentual').value = percent;
}

async function registrarBrinde() {
    document.getElementById('beneficio_tipo').value = 'brinde';
    alert('Brinde marcado para este agendamento. Será registrado ao salvar.');
}

function revelarBeneficioOption(value) {
    const sel = document.getElementById('pacotesInput');
    const opt = sel.querySelector(`option[value="${value}"]`);
    if (!opt) return;
    opt.hidden = false;
    sel.value = value;
    sel.disabled = true;
    sel.readOnly = true;
}

function limparBeneficioSelecionado() {
    const sel = document.getElementById('pacotesInput');
    document.querySelectorAll('.servico-beneficio').forEach(o => { o.hidden = true; });
    sel.disabled = false;
    sel.readOnly = false;
    document.getElementById('beneficio_tipo').value = '';
    document.getElementById('beneficio_percentual').value = '';
}

function marcarSessaoLivre() {
    revelarBeneficioOption('beneficio_sessao_livre');
    document.getElementById('beneficio_tipo').value = 'sessao_livre';
    document.getElementById('valor_pacote').value = '0.00';
    document.getElementById('valor_final').value = '0.00';
}

function selecionarServicoRelaxanteETravarsValor() {
    revelarBeneficioOption('beneficio_relaxante');
    document.getElementById('beneficio_tipo').value = 'relaxante';
    document.getElementById('valor_pacote').value = '0.00';
    document.getElementById('valor_final').value = '0.00';
}

// quando o usuário muda para “Nova Sessão”, “Reposição” etc., limpar
// (você já tem algo parecido em configurarTipoAgendamentoNovo)

function openRecorrente() {
    const checkRecorrente = document.getElementById('recorrente')
    const divRecorrente = document.getElementById('week-recorrente')

    if (!checkRecorrente || !divRecorrente) return;
    divRecorrente.classList.toggle('active', checkRecorrente.checked)
}





// Função para atualizar status via AJAX
async function atualizarStatusAgendamento(agendamentoId, novoStatus) {
    const csrfToken = getCookie('csrftoken');
    
    try {
        const response = await fetch(`/agendamentos/${agendamentoId}/alterar-status/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                status: novoStatus
            })
        });

        const result = await response.json();
        
        if (result.success) {
            mostrarMensagem(result.message || 'Status atualizado com sucesso!', 'success');
            
            // Atualizar a aparência visual do item na lista
            atualizarAparenciaStatus(agendamentoId, novoStatus);
            
            return true;
        } else {
            mostrarMensagem('Erro: ' + (result.error || 'Erro desconhecido'), 'error');
            return false;
        }
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        mostrarMensagem('Erro ao conectar com o servidor', 'error');
        return false;
    }
}

// Função para atualizar a aparência do item na lista
function atualizarAparenciaStatus(agendamentoId, novoStatus) {
    // Encontrar o item do agendamento
    const item = document.querySelector(`.agenda-item [data-agendamento-id="${agendamentoId}"]`);
    if (!item) return;
    
    // Encontrar o elemento pai (agenda-item)
    const agendaItem = item.closest('.agenda-item');
    if (!agendaItem) return;
    
    // Remover todas as classes de status
    agendaItem.classList.remove(
        'status-pre',
        'status-agendado', 
        'status-finalizado',
        'status-desistencia',
        'status-dcr',
        'status-fcr',
        'status-falta'
    );
    
    // Adicionar a nova classe de status
    const statusClassMap = {
        'pre': 'status-pre',
        'agendado': 'status-agendado',
        'finalizado': 'status-finalizado',
        'desistencia': 'status-desistencia',
        'desistencia_remarcacao': 'status-dcr',
        'falta_remarcacao': 'status-fcr',
        'falta_cobrada': 'status-falta'
    };
    
    if (statusClassMap[novoStatus]) {
        agendaItem.classList.add(statusClassMap[novoStatus]);
    }
}

// Função para obter cookie CSRF
function getCookie(name) {
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

// Inicializar eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    // Adicionar evento aos botões de salvar status
    document.querySelectorAll('.btn-salvar-status').forEach(button => {
        button.addEventListener('click', async function() {
            const agendamentoId = this.dataset.agendamentoId;
            const select = document.querySelector(`select[data-agendamento-id="${agendamentoId}"]`);
            
            if (!select) {
                mostrarMensagem('Elemento de status não encontrado', 'error');
                return;
            }
            
            const novoStatus = select.value;
            
            // Desabilitar botão durante a requisição
            this.disabled = true;
            this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            
            const sucesso = await atualizarStatusAgendamento(agendamentoId, novoStatus);
            
            // Re-habilitar botão
            this.disabled = false;
            this.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i><span class="tooltiptext">Salvar Status</span>';
        });
    });
    
    // Opcional: Atualizar status ao mudar o select (sem precisar clicar em salvar)
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async function() {
            const agendamentoId = this.dataset.agendamentoId;
            const novoStatus = this.value;
            
            // Encontrar o botão correspondente
            const button = document.querySelector(`.btn-salvar-status[data-agendamento-id="${agendamentoId}"]`);
            
            if (button) {
                // Simular clique no botão
                button.click();
            } else {
                // Ou atualizar diretamente
                await atualizarStatusAgendamento(agendamentoId, novoStatus);
            }
        });
    });
});

 