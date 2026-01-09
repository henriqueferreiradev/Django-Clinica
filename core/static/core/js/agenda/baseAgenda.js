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


const form = document.querySelector('form[action*="criar_agendamento"]');

if (form) {
    form.addEventListener('submit', async function (e) {
        e.preventDefault(); // 🔴 ESSENCIAL

        const formData = new FormData(this);

        try {
            const response = await fetch(this.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await response.json();

            if (response.ok && data.ok) {
                mostrarMensagem('✅ Agendamento criado com sucesso!', 'success');
                // opcional:
                // location.reload();
            } else {
                mostrarMensagem(data.error || '❌ Erro ao criar agendamento', 'error');
            }

        } catch (err) {
            console.error(err);
            mostrarMensagem('❌ Erro de conexão com o servidor', 'error');
        }
    });
}




// =============================================
// FUNÇÕES UTILITÁRIAS

function limparTudo() {
    console.log('Limpando tudo...');

    // 1. Limpar campo de busca e sugestões
    const buscaInput = document.getElementById('busca');
    const sugestoes = document.getElementById('sugestoes');
    if (buscaInput) buscaInput.value = '';
    if (sugestoes) {
        sugestoes.innerHTML = '';
        sugestoes.style.display = 'none';
    }

    // 2. Limpar paciente_id
    const pacienteIdInput = document.getElementById('paciente_id');
    if (pacienteIdInput) pacienteIdInput.value = '';

    // 3. Limpar avisos de pacote
    const avisoPacote = document.getElementById('aviso-pacote');
    const mensagemPacote = document.getElementById('mensagem-pacote');
    if (avisoPacote) avisoPacote.style.display = 'none';
    if (mensagemPacote) mensagemPacote.innerHTML = '';

    // 4. Limpar avisos de desmarcações
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const mensagemDesmarcacoes = document.getElementById('mensagem-desmarcacoes');
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (mensagemDesmarcacoes) mensagemDesmarcacoes.innerHTML = '';

    // 5. Limpar avisos de benefício
    const avisoBeneficio = document.getElementById('aviso-beneficio');
    if (avisoBeneficio) avisoBeneficio.style.display = 'none';

    // 6. Limpar seleção de serviço
    const servicoSelect = document.getElementById('pacotesInput');
    const servicoHidden = document.getElementById('servico_id_hidden');
    if (servicoSelect) {
        servicoSelect.querySelectorAll('option[data-pacote="true"]').forEach(op => op.remove());
        servicoSelect.disabled = false;
        servicoSelect.readOnly = false;
        servicoSelect.value = '';
    }
    if (servicoHidden) servicoHidden.value = '';

    // 7. Limpar inputs de valor
    const valorPacote = document.getElementById('valor_pacote');
    const desconto = document.getElementById('desconto');
    const valorFinal = document.getElementById('valor_final');
    if (valorPacote) valorPacote.value = '';
    if (desconto) desconto.value = '';
    if (valorFinal) valorFinal.value = '';

    // 8. Limpar campos de pacote
    const campoPacote = document.getElementById('pacote_codigo');
    const formValor = document.getElementById('formValor');
    const infoPacote = document.getElementById('info_pacote');
    const pacoteAtual = document.getElementById('pacote_atual');
    if (campoPacote) campoPacote.value = '';
    if (formValor) formValor.classList.remove('hidden');
    if (infoPacote) infoPacote.classList.add('hidden');
    if (pacoteAtual) {
        pacoteAtual.textContent = '';
        pacoteAtual.style.display = 'none';
    }

    // 9. Limpar campos de benefício
    const beneficioTipo = document.getElementById('beneficio_tipo');
    const beneficioPercentual = document.getElementById('beneficio_percentual');
    if (beneficioTipo) beneficioTipo.value = '';
    if (beneficioPercentual) beneficioPercentual.value = '';

    // 10. Resetar tipo de agendamento para "novo"
    const radioNovo = document.querySelector('input[name="tipo_agendamento"][value="novo"]');
    if (radioNovo) {
        radioNovo.checked = true;
        // Disparar evento change para resetar interface
        if (radioNovo.dispatchEvent) {
            radioNovo.dispatchEvent(new Event('change'));
        }
    }

    // 11. Resetar botão de usar pacote
    const usarPacoteBtn = document.getElementById('usar-pacote-btn');
    if (usarPacoteBtn) {
        usarPacoteBtn.disabled = true;
        usarPacoteBtn.style.opacity = '0.5';
        usarPacoteBtn.style.cursor = 'not-allowed';
        usarPacoteBtn.textContent = 'Usar pacote';
        usarPacoteBtn.onclick = null;
    }

    // 12. Resetar info de reposição
    const infoReposicao = document.getElementById('info_reposicao');
    if (infoReposicao) infoReposicao.style.display = 'none';

    // 13. Resetar label de tipo de sessão
    const tipoSessaoLabel = document.getElementById('tipo_sessao');
    if (tipoSessaoLabel) tipoSessaoLabel.textContent = 'Tipo de sessão';

    // 14. Limpar benefício selecionado
    limparBeneficioSelecionado();

    // 15. Resetar campos de agendamento recorrente
    const checkRecorrente = document.getElementById('recorrente');
    const divRecorrente = document.getElementById('week-recorrente');
    if (checkRecorrente) checkRecorrente.checked = false;
    if (divRecorrente) divRecorrente.classList.remove('active');

    // 16. Resetar botões de benefício
    const beneficioBotoes = document.getElementById('beneficio-botoes');
    if (beneficioBotoes) beneficioBotoes.innerHTML = '';

    // 17. Remover erros de validação
    document.querySelectorAll('.erro-validacao').forEach(erro => erro.remove());

    // 18. Resetar bordas dos inputs
    document.querySelectorAll('input').forEach(input => {
        input.style.borderColor = '';
    });

    // 19. Limpar dados globais
    window.saldosDesmarcacoes = null;

    console.log('Limpeza completa!');
}
// Função para limpar apenas os avisos
function limparAvisos() {
    console.log('Limpando avisos...');

    // 1. Limpar avisos de pacote
    const avisoPacote = document.getElementById('aviso-pacote');
    const mensagemPacote = document.getElementById('mensagem-pacote');
    if (avisoPacote) avisoPacote.style.display = 'none';
    if (mensagemPacote) mensagemPacote.innerHTML = '';

    // 2. Limpar avisos de desmarcações
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const mensagemDesmarcacoes = document.getElementById('mensagem-desmarcacoes');
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (mensagemDesmarcacoes) mensagemDesmarcacoes.innerHTML = '';

    // 3. Limpar avisos de benefício
    const avisoBeneficio = document.getElementById('aviso-beneficio');
    if (avisoBeneficio) avisoBeneficio.style.display = 'none';

    // 4. Limpar info de reposição
    const infoReposicao = document.getElementById('info_reposicao');
    if (infoReposicao) infoReposicao.style.display = 'none';

    // 5. Limpar sem_pacote div
    const semPacoteDiv = document.getElementById('sem_pacote');
    if (semPacoteDiv) {
        semPacoteDiv.innerHTML = '';
        semPacoteDiv.style.display = 'none';
    }

    // 6. Resetar botão de usar pacote
    const usarPacoteBtn = document.getElementById('usar-pacote-btn');
    if (usarPacoteBtn) {
        usarPacoteBtn.disabled = true;
        usarPacoteBtn.style.opacity = '0.5';
        usarPacoteBtn.style.cursor = 'not-allowed';
        usarPacoteBtn.textContent = 'Usar pacote';
        usarPacoteBtn.onclick = null;
    }

    // 7. Resetar botão de usar remarcação
    const usarRemarcacaoBtn = document.getElementById('usar-reposicao-btn');
    if (usarRemarcacaoBtn) {
        usarRemarcacaoBtn.onclick = null;
    }

    console.log('Avisos limpos!');
}

// Função para mostrar mensagem no div sem_pacote
function mostrarMensagemSemPacote(mensagem) {
    const semPacoteDiv = document.getElementById('sem_pacote');
    if (semPacoteDiv) {
        semPacoteDiv.innerHTML = `
            <div class="pacote-info sem-pacote">
                <div class="pacote-header">
                    <i class="fas fa-plus-circle aviso-icon"></i>
                    <strong>${mensagem}</strong>
                </div>
 
            </div>
        `;
        semPacoteDiv.style.display = 'block';
    }
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

    // Elementos para mostrar informações de saldos
    const saldoDesistencia = document.getElementById('saldo_d');
    const saldoDCR = document.getElementById('saldo_dcr');
    const saldoFCR = document.getElementById('saldo_fcr');
    const diasRestantesD = document.getElementById('dias_restantes_d');
    const diasRestantesDCR = document.getElementById('dias_restantes_dcr');
    const diasRestantesFCR = document.getElementById('dias_restantes_fcr');

    // Reset inicial
    if (avisoDiv) avisoDiv.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (servicoSelect) servicoSelect.disabled = false;
    if (formValor) formValor.classList.remove('hidden');
    if (infoPacote) infoPacote.classList.add('hidden');

    // Resetar display de saldos
    if (saldoDesistencia) saldoDesistencia.textContent = '0';
    if (saldoDCR) saldoDCR.textContent = '0';
    if (saldoFCR) saldoFCR.textContent = '0';
    if (diasRestantesD) diasRestantesD.textContent = '0';
    if (diasRestantesDCR) diasRestantesDCR.textContent = '0';
    if (diasRestantesFCR) diasRestantesFCR.textContent = '0';

    limparOpcaoPacoteServico();

    // Configurar toggles dos tipos de sessão
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            if (!servicoSelect) return;

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
                if (tipoSessaoLabel) tipoSessaoLabel.textContent = 'Tipo de reposição';
                if (infoReposicao) {
                    infoReposicao.innerHTML = `<strong>Reposição de sessão</strong>`;
                    infoReposicao.style.display = 'block';
                }
            } else {
                // Mostra opções normais
                servicosBancoAtual.forEach(opt => opt.hidden = false);
                optgroupsPacotes.forEach(optgroup => optgroup.style.display = 'block');
                if (optgroupReposicao) optgroupReposicao.style.display = 'none';
                servicosReposicaoAtual.forEach(opt => opt.hidden = true);
                servicoSelect.value = "";
                if (tipoSessaoLabel) tipoSessaoLabel.textContent = 'Tipo de sessão';
                if (infoReposicao) infoReposicao.style.display = 'none';
            }
        });
    });

    if (!pacienteId) return;

    try {
        const response = await fetch(`/api/verificar_pacotes_ativos/${pacienteId}`);
        const data = await response.json();

        // Armazena os saldos globalmente para usar depois
        window.saldosDesmarcacoes = data.saldos || {};

        // ============================
        // LÓGICA DE PACOTES ATUALIZADA
        // ============================

        // Caso 1: Tem pacote ativo
        if (data.tem_pacote_ativo && servicoSelect && data.pacotes.length > 0) {
            const pacote = data.pacotes[0];
            const sessaoAtual = (pacote.quantidade_usadas || 0) + 1;
            const sessoesRestantes = pacote.quantidade_total - pacote.quantidade_usadas;

            // Verifica se o pacote está ATIVO no banco de dados
            const pacoteEstaAtivo = pacote.ativo === true || pacote.ativo === undefined;

            // Atualiza o ícone e título do aviso
            if (avisoDiv) {
                // Remove classes antigas
                avisoDiv.classList.remove('aviso-premium', 'aviso-danger', 'aviso-warning');

                if (sessoesRestantes > 0 && pacoteEstaAtivo) {
                    // PACOTE ATIVO COM SESSÕES DISPONÍVEIS
                    avisoDiv.classList.add('aviso-premium');

                    if (mensagemPacote) {
                        mensagemPacote.innerHTML =
                            `<div class="pacote-info ativo">
                                <div class="pacote-header">
                                    <i class="fas fa-check-circle aviso-icon"></i>
                                    <strong>Pacote Ativo Disponível!</strong>
                                </div>
                                <div class="pacote-detalhes">
                                    <div><span class="label">Código:</span> <span class="valor">${pacote.codigo}</span></div>
                                    <div><span class="label">Sessões totais:</span> <span class="valor">${pacote.quantidade_total}</span></div>
                                    <div><span class="label">Sessões usadas:</span> <span class="valor">${pacote.quantidade_usadas}</span></div>
                                    <div><span class="label">Sessões disponíveis:</span> <span class="valor disponivel">${sessoesRestantes}</span></div>
                                    <div><span class="label">Próxima sessão:</span> <span class="valor">${sessaoAtual}</span></div>
                                </div>
                                <div class="pacote-aviso">
                                    <em>Deseja usar este pacote?</em>
                                </div>
                            </div>`;
                    }

                    // Habilita o botão
                    if (usarPacoteBtn) {
                        usarPacoteBtn.disabled = false;
                        usarPacoteBtn.style.opacity = '1';
                        usarPacoteBtn.style.cursor = 'pointer';
                        usarPacoteBtn.textContent = `Usar pacote (${sessoesRestantes} disponíveis)`;
                        usarPacoteBtn.onclick = () => usarPacoteAtivo(pacote, sessaoAtual, sessoesRestantes);


                    }

                } else if (!pacoteEstaAtivo || sessoesRestantes <= 0) {
                    // PACOTE ESGOTADO OU DESATIVADO
                    avisoDiv.classList.remove('aviso-w-pac')
                    avisoDiv.classList.add('aviso-c-pac');

                    if (mensagemPacote) {
                        const motivo = !pacoteEstaAtivo ? "DESATIVADO" : "ESGOTADO";
                        mensagemPacote.innerHTML =
                            `<div class="pacote-info esgotado">
                                <div class="pacote-header">
                                    <i class="fas fa-exclamation-triangle aviso-icon"></i>
                                    <strong>PACOTE ${motivo}</strong>
                                </div>
                                <div class="pacote-detalhes">
                                    <div><span class="label">Código:</span> <span class="valor">${pacote.codigo}</span></div>
                                    <div><span class="label">Sessões totais:</span> <span class="valor">${pacote.quantidade_total}</span></div>
                                    <div><span class="label">Sessões usadas:</span> <span class="valor">${pacote.quantidade_usadas}</span></div>
                                    <div><span class="label">Sessões restantes:</span> <span class="valor esgotado">${sessoesRestantes}</span></div>
                                    ${!pacoteEstaAtivo ? '<div><span class="label">Status:</span> <span class="valor esgotado">DESATIVADO</span></div>' : ''}
                                </div>
                                <div class="pacote-aviso">
                                    <em>${!pacoteEstaAtivo ? 'Este pacote foi desativado automaticamente.' : 'Não é possível usar este pacote.'}</em>
                                    <br>
                                    <strong>Crie um novo pacote.</strong>
                                </div>
                            </div>`;
                    }

                    // Desabilita o botão
                    if (usarPacoteBtn) {
                        usarPacoteBtn.disabled = true;
                        usarPacoteBtn.style.opacity = '0.5';
                        usarPacoteBtn.style.cursor = 'not-allowed';
                        usarPacoteBtn.textContent = !pacoteEstaAtivo ? 'Pacote desativado' : 'Pacote esgotado';
                        usarPacoteBtn.onclick = null;
                    }
                }
            }

            if (avisoDiv) avisoDiv.style.display = 'block';

        } else {
            // Caso 2: Nenhum pacote ativo
            if (avisoDiv) {

                avisoDiv.classList.remove('aviso-c-pac');
                avisoDiv.classList.add('aviso-w-pac');
                avisoDiv.style.display = 'block';

                if (mensagemPacote) {
                    mensagemPacote.innerHTML =
                        `<div class="pacote-info sem-pacote">
                            <div class="pacote-header">
                                <i class="fas fa-info-circle aviso-icon"></i>
                                <strong>Nenhum pacote ativo detectado!</strong>
                            </div>
                            <div class="pacote-detalhes">
                                <div>Este paciente não possui pacotes ativos no momento.</div>
                            </div>
                            <div class="pacote-aviso">
                                <em>Para criar um novo agendamento, selecione um serviço abaixo.</em>
                            </div>
                        </div>`;
                }

                if (usarPacoteBtn) {

                    usarPacoteBtn.textContent = 'Criar Novo Pacote';
                    usarPacoteBtn.onclick = function () {
                        // Limpa todos os avisos
                        limparAvisos();

                        // Mostra mensagem no div sem_pacote
                        mostrarMensagemSemPacote('Criando novo pacote');

                        // Opcional: focar no campo de seleção de serviço
                        const servicoSelect = document.getElementById('pacotesInput');
                        if (servicoSelect) {
                            servicoSelect.focus();
                        }

                        // Opcional: marcar tipo de agendamento como "novo"
                        const radioNovo = document.querySelector('input[name="tipo_agendamento"][value="novo"]');
                        if (radioNovo) {
                            radioNovo.checked = true;
                            if (radioNovo.dispatchEvent) {
                                radioNovo.dispatchEvent(new Event('change'));
                            }
                        }
                    };
                }
            }
        }

        // ==================== SALDOS DE DESMARCACOES ====================
        const saldos = data.saldos || {};

        // Atualizar os displays de saldos
        if (saldoDesistencia) saldoDesistencia.textContent = saldos.desistencia?.quantidade || 0;
        if (saldoDCR) saldoDCR.textContent = saldos.desistencia_remarcacao?.quantidade || 0;
        if (saldoFCR) saldoFCR.textContent = saldos.falta_remarcacao?.quantidade || 0;

        // Atualizar dias restantes
        if (diasRestantesD && saldos.desistencia?.mais_proxima) {
            const diasD = saldos.desistencia.mais_proxima.dias_restantes || 0;
            diasRestantesD.textContent = diasD;
            if (diasD <= 7) diasRestantesD.classList.add('text-danger', 'font-weight-bold');
            else if (diasD <= 30) diasRestantesD.classList.add('text-warning');
        }

        if (diasRestantesDCR && saldos.desistencia_remarcacao?.mais_proxima) {
            const diasDCR = saldos.desistencia_remarcacao.mais_proxima.dias_restantes || 0;
            diasRestantesDCR.textContent = diasDCR;
            if (diasDCR <= 7) diasRestantesDCR.classList.add('text-danger', 'font-weight-bold');
            else if (diasDCR <= 30) diasRestantesDCR.classList.add('text-warning');
        }

        if (diasRestantesFCR && saldos.falta_remarcacao?.mais_proxima) {
            const diasFCR = saldos.falta_remarcacao.mais_proxima.dias_restantes || 0;
            diasRestantesFCR.textContent = diasFCR;
            if (diasFCR <= 7) diasRestantesFCR.classList.add('text-danger', 'font-weight-bold');
            else if (diasFCR <= 30) diasRestantesFCR.classList.add('text-warning');
        }

        // Mostrar aviso consolidado
        verificarSaldosDesmarcacoesComDetalhes(saldos);

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
// Nova função para mostrar saldos com detalhes
function verificarSaldosDesmarcacoesComDetalhes(saldos) {
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const mensagemDesmarcacoes = document.getElementById('mensagem-desmarcacoes');

    const mensagens = [];
    const tipos = [
        { key: 'desistencia', sigla: 'D', nome: 'Desistência' },
        { key: 'desistencia_remarcacao', sigla: 'DCR', nome: 'Desistência com Remarcação' },
        { key: 'falta_remarcacao', sigla: 'FCR', nome: 'Falta com Remarcação' }
    ];

    tipos.forEach(tipo => {
        if (saldos[tipo.key]?.quantidade > 0) {
            const saldo = saldos[tipo.key];
            const diasRestantes = saldo.mais_proxima?.dias_restantes || saldo.dias_validade || 0;

            let status = '🟢'; // Verde por padrão
            if (saldo.mais_proxima?.vencido) {
                status = '🔴'; // Vermelho se vencido
            } else if (diasRestantes <= 7) {
                status = '🟠'; // Laranja se faltando 7 dias ou menos
            } else if (diasRestantes <= 30) {
                status = '🟡'; // Amarelo se faltando 30 dias ou menos
            }

            let texto = `${status} ${tipo.sigla}: ${saldo.quantidade} (${diasRestantes}d)`;

            // Adicionar data de vencimento se disponível
            if (saldo.mais_proxima?.vencimento) {
                texto += ` - Vence: ${saldo.mais_proxima.vencimento}`;
            }

            mensagens.push(texto);
        }
    });

    if (mensagens.length > 0) {
        if (mensagemDesmarcacoes) {
            mensagemDesmarcacoes.innerHTML = `
                <div class="pacote-header">
                    <i class="fas fa-check-circle aviso-icon"></i>
                    <strong>Saldos de sessões desmarcadas detectados!</strong>
                </div>
               
                <div class="pacote-detalhes">
                    ${mensagens.map(mensagem => {

                return `<div>${mensagem}</div>`;

            }).join('')}
                </div>

            `;
        }
        if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'block';
    } else {
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

    };

    const tipoApi = mapeamentoTipos[tipo];

    // CORREÇÃO: Acesse a propriedade quantidade dentro do objeto
    if (tipoApi && window.saldosDesmarcacoes[tipoApi]) {
        return window.saldosDesmarcacoes[tipoApi].quantidade > 0;
    }

    return false;
}

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
            limparTudo()
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

        const box = document.getElementById('aviso-beneficio');
        if (!box) return;

        const beneficiosDisponiveis = data.beneficios.filter(b =>
            !b.usado && b.esta_valido
        );

        if (!beneficiosDisponiveis.length) {
            box.innerHTML = '';
            box.style.display = 'none';
            return;
        }


        // Criar linhas dos benefícios
        let linhasHTML = '';
        let temAniversario = false;

        data.beneficios.forEach(b => {
            let icon = '';
            let texto = '';

            if (b.tipo === 'relaxante') {
                icon = 'fa-spa';
                texto = `Sessão Relaxante`;
            }
            else if (b.tipo === 'sessao_livre') {
                icon = 'fa-wind';
                texto = `Sessão Livre`;
            }
            else if (b.tipo === 'desconto') {
                icon = 'fa-tag';
                texto = `${b.percentual}% de Desconto`;
            }
            else if (b.tipo === 'brinde') {
                icon = 'fa-gift';
                texto = `Brinde`;
            }
            else if (b.tipo === 'sessao_aniversario') {
                icon = 'fa-cake-candles';
                texto = `Sessão Aniversário 🎂`;
                temAniversario = true;
            }

            // Formatar data
            const dataValidade = new Date(b.valido_ate);
            const dataFormatada = dataValidade.toLocaleDateString('pt-BR');

            // Determinar status e botão
            let statusClass = '';
            let statusText = '';
            let botaoHTML = '';

            if (b.usado) {
                statusClass = 'usado';
                statusText = 'USADO';
                botaoHTML = `<button class="btn-premium btn-outline" disabled>
                               <i class="fas fa-check"></i> Usado
                             </button>`;
            } else if (!b.esta_valido) {
                statusClass = 'expirado';
                statusText = 'EXPIRADO';
                botaoHTML = `<button class="btn-premium btn-outline" disabled>
                               <i class="fas fa-clock"></i> Expirado
                             </button>`;
            } else {
                statusClass = 'disponivel';
                statusText = 'DISPONÍVEL';
                botaoHTML = `<button type="button" class="btn-premium btn-primary btn-usar-beneficio" 
                   data-tipo="${b.tipo}" 
                   data-percentual="${b.percentual || ''}">
               <i class="fas fa-check-circle"></i> Usar
             </button>`;
            }

            linhasHTML += `
                <div class="beneficio-linha ${statusClass} ${b.tipo === 'sessao_aniversario' ? 'beneficio-aniversario' : ''}">
                    <div class="beneficio-info">
                        <div class="beneficio-tipo">
                            <i class="fas ${icon}"></i>
                            <span class="beneficio-titulo">${texto}</span>
                        </div>
                        <div class="beneficio-validade">
                            <span class="label">Validade:</span>
                            <span class="valor">${dataFormatada}</span>
                        </div>
                    </div>
                    <div class="beneficio-status ${statusClass}">
                        ${statusText}
                    </div>
                    <div class="beneficio-acao">
                        ${botaoHTML}
                    </div>
                </div>`;
        });

        // Header com status
        let headerText = `Benefícios ${data.status ? data.status.toUpperCase() : ''}`;
        let headerIcon = 'fa-gift';

        if (temAniversario) {
            headerText += ' 🎂 ANIVERSARIANTE';
            headerIcon = 'fa-cake-candles';
        }

        box.innerHTML = `
            <div class="pacote-info ativo com-beneficios">
                <div class="pacote-header">
                    <i class="fas ${headerIcon} aviso-icon"></i>
                    <strong>${headerText}</strong>
                </div>
                <div class="pacote-detalhes beneficios-lista">
                    ${linhasHTML}
                </div>
                <div class="pacote-aviso">
                    <em>Clique em "Usar" para aproveitar um benefício disponível.</em>
                </div>
            </div>`;

        // Adicionar eventos aos botões "Usar"

        document.querySelectorAll('.btn-usar-beneficio').forEach(btn => {
            // Substitua o evento de clique atual por:
            btn.onclick = function () {
                const tipo = this.getAttribute('data-tipo');
                const percentual = this.getAttribute('data-percentual');

                // Verifica se já está usando (botão já clicado)
                if (this.disabled) return;

                switch (tipo) {
                    case 'relaxante':
                        selecionarServicoRelaxanteETravarsValor();
                        ocultarPagamentoERecorrencia();
                        break;
                    case 'sessao_livre':
                    case 'sessao_aniversario':
                        marcarSessaoLivre(tipo === 'sessao_aniversario' ? 'aniversario' : null);
                        ocultarPagamentoERecorrencia();
                        break;
                    case 'desconto':
                        aplicarDescontoBloqueado(parseInt(percentual));
                        break;
                    case 'brinde':
                        registrarBrinde();
                        // Brinde não desabilita outros, pode combinar com sessão
                        break;
                }

                // Atualiza este botão
                this.innerHTML = '<i class="fas fa-check"></i> Usando';
                this.disabled = true;
                this.className = 'btn-premium btn-outline';

                if (tipo !== 'brinde') {
                    desabilitarBeneficiosIncompativeis(tipo);
                }
            };
        });


        box.style.display = 'block';
    } catch (e) {
        console.error('Erro ao verificar benefícios:', e);
    }
}


function ocultarPagamentoERecorrencia() {
    // Pagamento
    const formValor = document.getElementById('formValor');
    const valorPago = document.getElementById('valor_pago_input');
    const formaPagamento = document.getElementById('forma_pagamento_select');
    const recebimentoForm = document.getElementById('receb_sect')
    const recorrenteCheck = document.getElementById('recorrente_sect')
    const avisoPacote = document.getElementById('aviso-pacote')
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes')


    if (formValor) formValor.style.display = 'none';
    if (recebimentoForm) recebimentoForm.style.display = 'none';
    if (recorrenteCheck) recorrenteCheck.style.display = 'none';
    if (avisoPacote) avisoPacote.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (valorPago) valorPago.value = '';
    if (formaPagamento) formaPagamento.value = '';

    // Recorrência
    const checkRecorrente = document.getElementById('recorrente');
    const weekRecorrente = document.getElementById('week-recorrente');

    if (checkRecorrente) checkRecorrente.checked = false;
    if (weekRecorrente) weekRecorrente.classList.remove('active');
}

function aplicarDescontoBloqueado(percent) {
    const descontoInput = document.getElementById('desconto');
    descontoInput.value = Number(percent).toFixed(2);
    window.modoPercentual = true;
    window.calcularDesconto();
    document.getElementById('beneficio_tipo').value = 'desconto';
    document.getElementById('beneficio_percentual').value = percent;
}
function desabilitarBeneficiosIncompativeis(tipoSelecionado) {
    // Se selecionou uma SESSÃO, desabilita desconto
    if (tipoSelecionado.includes('sessao') || tipoSelecionado === 'relaxante') {
        document.querySelectorAll('.btn-usar-beneficio').forEach(btn => {
            const tipoBtn = btn.getAttribute('data-tipo');
            // Desabilita desconto e outras sessões
            if (tipoBtn === 'desconto' ||
                (tipoBtn.includes('sessao') && tipoBtn !== tipoSelecionado) ||
                (tipoBtn === 'relaxante' && tipoSelecionado !== 'relaxante')) {
                btn.innerHTML = '<i class="fas fa-ban"></i> Indisponível';
                btn.disabled = true;
                btn.className = 'btn-premium btn-outline';
            }
        });
    }

    // Se selecionou DESCONTO, desabilita sessões
    if (tipoSelecionado === 'desconto') {
        document.querySelectorAll('.btn-usar-beneficio').forEach(btn => {
            const tipoBtn = btn.getAttribute('data-tipo');
            if (tipoBtn.includes('sessao') || tipoBtn === 'relaxante') {
                btn.innerHTML = '<i class="fas fa-ban"></i> Indisponível';
                btn.disabled = true;
                btn.className = 'btn-premium btn-outline';
            }
        });
    }
}
function registrarBrinde() {
    // aceita id antigo e novo
    const el = document.getElementById('incluir_brinde') || document.getElementById('brinde_incluido');

    if (!el) {
        console.error('Input hidden do brinde não existe (incluir_brinde / brinde_incluido).');
        mostrarMensagem('⚠️ Não encontrei o campo hidden do brinde. Verifique o HTML.', 'warning');
        return;
    }

    el.value = 'true';
    mostrarMensagem('🎁 Brinde adicionado ao agendamento!', 'info');
}

function revelarBeneficioOption(value) {
    const sel = document.getElementById('pacotesInput');
    const opt = sel.querySelector(`option[value="${value}"]`);
    if (!opt) {
        console.error(`Opção ${value} não encontrada no select!`);
        return;
    }
    opt.hidden = false;
    sel.value = value;
    sel.disabled = true;
    sel.readOnly = true;
}
function limparBeneficiosSelecionados() {
    // Resetar todos os botões
    document.querySelectorAll('.btn-usar-beneficio').forEach(btn => {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Usar';
        btn.disabled = false;
        btn.className = 'btn-premium btn-primary btn-usar-beneficio';
    });

    // Resetar campos hidden
    document.getElementById('beneficio_tipo').value = '';
    document.getElementById('beneficio_percentual').value = '';
    document.getElementById('incluir_brinde').value = 'false';

    // Limpar seleção no select
    limparBeneficioSelecionado();
}
function limparBeneficioSelecionado() {
    const sel = document.getElementById('pacotesInput');
    // Esconde TODAS as opções de benefício
    document.querySelectorAll('.servico-beneficio').forEach(o => {
        o.hidden = true;
    });
    sel.disabled = false;
    sel.readOnly = false;
    document.getElementById('beneficio_tipo').value = '';
    document.getElementById('beneficio_percentual').value = '';
}
function marcarSessaoLivre(tipoEspecial = null) {
    // AQUI ESTÁ A MUDANÇA IMPORTANTE:
    if (tipoEspecial === 'aniversario') {
        revelarBeneficioOption('beneficio_sessao_aniversario');
        document.getElementById('beneficio_tipo').value = 'sessao_aniversario';

        // Mensagem
        if (typeof mostrarMensagem === 'function') {
            mostrarMensagem('🎂 Sessão de aniversário ativa!', 'info');
        }

        // Observação
        if (typeof adicionarObservacao === 'function') {
            adicionarObservacao('🎂 Sessão de aniversário - gratuita');
        }
    } else {
        revelarBeneficioOption('beneficio_sessao_livre');
        document.getElementById('beneficio_tipo').value = 'sessao_livre';

        if (typeof mostrarMensagem === 'function') {
            mostrarMensagem('💨 Sessão livre ativa!', 'info');
        }
    }

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
// Elementos do formulário
const dataInput = document.querySelector('input[name="data"]');
const horaInicioInput = document.querySelector('input[name="hora_inicio"]');
const horaFimInput = document.querySelector('input[name="hora_fim"]');
const form = document.querySelector('form[action*="criar_agendamento"]');

let configClinica = null;

// Função para buscar configurações da clínica
async function carregarConfigClinica() {
    try {
        const response = await fetch('/api/config-agenda/');
        if (response.ok) {
            configClinica = await response.json();
            console.log('Configurações carregadas:', configClinica);

            // Mostra informações na tela
            mostrarInfoConfig();

            // Adiciona validação em tempo real
            adicionarValidacaoTempoReal();
        }
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

// Função para mostrar informações das configurações
function mostrarInfoConfig() {
    const infoDiv = document.createElement('div');
    infoDiv.className = 'config-info-alert';
    infoDiv.style.cssText = `
            background: #f8f9fa;
            border-left: 4px solid #007bff;
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 4px;
            font-size: 14px;
            color: #333;
        `;

    infoDiv.innerHTML = `
            <i class='bx bx-info-circle' style="color: #007bff; margin-right: 8px;"></i>
            <strong>Horário da Clínica:</strong> ${configClinica.dias_formatados} 
            das ${configClinica.horario_abertura} às ${configClinica.horario_fechamento}
        `;

    // Insere após o título ou em algum lugar visível
    const titulo = document.querySelector('.form-header h2');
    if (titulo) {
        titulo.parentNode.insertBefore(infoDiv, titulo.nextSibling);
    }
}

function parseDataLocal(dataStr) {
    // Formato esperado: "YYYY-MM-DD"
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    // Cria data LOCAL (sem problemas de fuso)
    return new Date(ano, mes - 1, dia); // Mês é 0-indexed
}

// FUNÇÃO VALIDAR DIA CORRIGIDA
function validarDia(dataStr) {
    if (!configClinica || !dataStr) return true;

    const data = parseDataLocal(dataStr);

    // Mapeamento CORRETO para JavaScript
    const diasMap = {
        0: 'domingo',   // 0 = Domingo
        1: 'segunda',   // 1 = Segunda-feira
        2: 'terca',     // 2 = Terça-feira
        3: 'quarta',    // 3 = Quarta-feira
        4: 'quinta',    // 4 = Quinta-feira
        5: 'sexta',     // 5 = Sexta-feira
        6: 'sabado'     // 6 = Sábado
    };

    const diaNumero = data.getDay();
    const diaSemana = diasMap[diaNumero];

    console.log(`DEBUG validarDia: ${dataStr} -> dia ${diaNumero} (${diaSemana})`);
    return configClinica.dias_funcionamento.includes(diaSemana);
}

// FUNÇÃO GET NOME DIA CORRIGIDA
function getNomeDia(dataStr) {
    const data = parseDataLocal(dataStr);

    const diasNomes = {
        0: 'Domingo',
        1: 'Segunda-feira',
        2: 'Terça-feira',
        3: 'Quarta-feira',
        4: 'Quinta-feira',
        5: 'Sexta-feira',
        6: 'Sábado'
    };

    const diaNumero = data.getDay();
    return diasNomes[diaNumero] || '';
}
// Função para validar horário
function validarHorario(horarioStr) {
    if (!configClinica || !horarioStr) return true;

    const [hora, minuto] = horarioStr.split(':').map(Number);
    const [aberturaHora, aberturaMin] = configClinica.horario_abertura.split(':').map(Number);
    const [fechamentoHora, fechamentoMin] = configClinica.horario_fechamento.split(':').map(Number);

    const horarioMinutos = hora * 60 + minuto;
    const aberturaMinutos = aberturaHora * 60 + aberturaMin;
    const fechamentoMinutos = fechamentoHora * 60 + fechamentoMin;

    return horarioMinutos >= aberturaMinutos && horarioMinutos <= fechamentoMinutos;
}

// Função para mostrar erro
function mostrarErro(elemento, mensagem) {
    // Remove erro anterior
    removerErro(elemento);

    const erroDiv = document.createElement('div');
    erroDiv.className = 'erro-validacao';
    erroDiv.textContent = mensagem;
    erroDiv.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 5px;
            padding: 5px;
            background: #f8d7da;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
        `;

    elemento.parentNode.appendChild(erroDiv);
    elemento.style.borderColor = '#dc3545';
}

// Função para remover erro
function removerErro(elemento) {
    const erroDiv = elemento.parentNode.querySelector('.erro-validacao');
    if (erroDiv) {
        erroDiv.remove();
    }
    elemento.style.borderColor = '';
}

// Função para validar em tempo real
function adicionarValidacaoTempoReal() {
    if (dataInput) {
        dataInput.addEventListener('change', function () {
            console.log(`Data alterada: ${this.value}`);

            if (!validarDia(this.value)) {
                const nomeDia = getNomeDia(this.value);
                mostrarErro(this, `⚠️ A clínica não funciona às ${nomeDia}s`);
            } else {
                removerErro(this);
            }

            // DEBUG adicional
            const dataTeste = parseDataLocal(this.value);
            console.log(`DEBUG: Input=${this.value}, getDay()=${dataTeste.getDay()}, Nome=${getNomeDia(this.value)}`);
        });
    }

    if (horaInicioInput) {
        horaInicioInput.addEventListener('change', function () {
            if (!validarHorario(this.value)) {
                mostrarErro(this, `⚠️ Fora do horário de funcionamento (${configClinica.horario_abertura} às ${configClinica.horario_fechamento})`);
            } else {
                removerErro(this);
            }
        });
    }

    if (horaFimInput) {
        horaFimInput.addEventListener('change', function () {
            if (!validarHorario(this.value)) {
                mostrarErro(this, `⚠️ Fora do horário de funcionamento (${configClinica.horario_abertura} às ${configClinica.horario_fechamento})`);
            } else {
                removerErro(this);
            }

            // Valida se horário fim é depois do início
            if (horaInicioInput && horaInicioInput.value && this.value) {
                const inicio = horaInicioInput.value.split(':').map(Number);
                const fim = this.value.split(':').map(Number);

                const inicioMin = inicio[0] * 60 + inicio[1];
                const fimMin = fim[0] * 60 + fim[1];

                if (fimMin <= inicioMin) {
                    mostrarErro(this, '⚠️ Horário de término deve ser após o início');
                }
            }
        });
    }
}

 
// Carrega as configurações quando a página carrega
carregarConfigClinica();
// Inicializar eventos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    // Adicionar evento aos botões de salvar status
    document.querySelectorAll('.btn-salvar-status').forEach(button => {
        button.addEventListener('click', async function () {
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
        select.addEventListener('change', async function () {
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


