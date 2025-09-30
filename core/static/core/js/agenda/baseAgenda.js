// =============================================
// VARIÁVEIS GLOBAIS E CONFIGURAÇÕES
// =============================================
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

// =============================================
// FUNÇÕES DE GESTÃO DE PACOTES
// =============================================
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
    const mensagemDesmarcacoes = document.getElementById('mensagem-desmarcacoes');
    const radioButtons = document.querySelectorAll('input[name="tipo_agendamento"]');
    const servicosBanco = document.querySelectorAll('.servico-banco');
    const servicosReposicao = document.querySelectorAll('.servico-reposicao');
    const usarRemarcacaoBtn = document.getElementById('usar-reposicao-btn');
    const infoReposicao = document.getElementById('info_reposicao');
    const tipoSessaoLabel = document.getElementById('tipo_sessao');
    const valorFinalInput = document.getElementById('valor_final');

    // Toggle de opções por tipo de agendamento
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function () {
            if (!servicoSelect) return;
            if (this.value === 'reposicao') {
                servicosBanco.forEach(opt => opt.hidden = true);
                servicosReposicao.forEach(opt => opt.hidden = false);
                servicoSelect.value = "";
            } else {
                servicosBanco.forEach(opt => opt.hidden = false);
                servicosReposicao.forEach(opt => opt.hidden = true);
                servicoSelect.value = "";
            }
        });
    });

    // Reset inicial
    if (avisoDiv) avisoDiv.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
    if (servicoSelect) servicoSelect.disabled = false;
    if (formValor) formValor.classList.remove('hidden');
    if (infoPacote) infoPacote.classList.add('hidden');
    limparOpcaoPacoteServico();

    if (!pacienteId) return;

    try {
        const response = await fetch(`/api/verificar_pacotes_ativos/${pacienteId}`);
        const data = await response.json();

        // Pacote ativo
        if (data.tem_pacote_ativo && servicoSelect) {
            const pacote = data.pacotes[0];
            const sessaoAtual = (pacote.quantidade_usadas || 0) + 1;

            if (mensagemPacote) {
                mensagemPacote.textContent =
                    `Este paciente possui um pacote ativo (Código: ${pacote.codigo}) — Sessão ${sessaoAtual} de ${pacote.quantidade_total}. Deseja usá-lo?`;
            }

            if (avisoDiv) avisoDiv.style.display = 'block';
            if (usarPacoteBtn) usarPacoteBtn.onclick = () => usarPacoteAtivo(pacote, sessaoAtual);
        }

        // Saldos de desmarcações
        verificarSaldosDesmarcacoes(data.saldos_desmarcacoes || {});

        // Reposição por padrão escondida
        servicosReposicao.forEach(opt => opt.hidden = true);

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

function usarPacoteAtivo(pacote, sessaoAtual) {
    const servicoSelect = document.getElementById('pacotesInput');
    const formValor = document.getElementById('formValor');
    const infoPacote = document.getElementById('info_pacote');
    const valorFinalInput = document.getElementById('valor_final');
    const campoPacote = document.getElementById('pacote_codigo');
    const pacoteAtual = document.getElementById('pacote_atual');
    const avisoDiv = document.getElementById('aviso-pacote');
    const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
    const servicoHidden = document.getElementById('servico_id_hidden');

    const option = document.createElement('option');
    option.value = String(pacote.servico_id);
    option.textContent = `Sessão ${sessaoAtual} de ${pacote.quantidade_total} (pacote ativo)`;
    option.hidden = true;
    option.disabled = false;
    option.setAttribute("data-pacote", "true");

    servicoSelect.prepend(option);
    servicoSelect.value = option.value;

    if (servicoHidden) servicoHidden.value = pacote.servico_id;
    servicoSelect.disabled = true;
    servicoSelect.readOnly = true;

    atualizarInfoPacote(pacote, sessaoAtual);

    if (formValor) formValor.classList.add('hidden');
    if (infoPacote) infoPacote.classList.remove('hidden');
    if (valorFinalInput) valorFinalInput.value = (pacote.valor_total - pacote.valor_pago).toFixed(2);
    if (campoPacote) campoPacote.value = pacote.codigo;

    if (pacoteAtual) {
        pacoteAtual.innerHTML = `<strong>Pacote ativo:</strong> Código <strong>${pacote.codigo}</strong> — Sessão ${sessaoAtual} de ${pacote.quantidade_total}`;
        pacoteAtual.style.display = 'block';
    }

    const radioExistente = document.querySelector('input[name="tipo_agendamento"][value="existente"]');
    if (radioExistente) radioExistente.checked = true;

    if (avisoDiv) avisoDiv.style.display = 'none';
    if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
}

function atualizarInfoPacote(pacote, sessaoAtual) {
    const elementos = {
        codigo: document.getElementById('codigo_pacote_display'),
        valorPago: document.getElementById('valor_pago_display'),
        valorRestante: document.getElementById('valor_restante_display'),
        sessaoAtual: document.getElementById('sessao_atual_display'),
        totalSessoes: document.getElementById('total_sessoes_display')
    };

    if (elementos.codigo) elementos.codigo.textContent = pacote.codigo;
    if (elementos.valorPago) elementos.valorPago.textContent = Number(pacote.valor_pago).toFixed(2);
    if (elementos.valorRestante) elementos.valorRestante.textContent = (pacote.valor_total - pacote.valor_pago).toFixed(2);
    if (elementos.sessaoAtual) elementos.sessaoAtual.textContent = sessaoAtual;
    if (elementos.totalSessoes) elementos.totalSessoes.textContent = pacote.quantidade_total;
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

    if (!input || !sugestoes || !pacienteIdInput) return;

    input.addEventListener('input', async () => {
        const query = input.value.trim();

        if (query.length === 0) {
            sugestoes.innerHTML = '';
            sugestoes.style.display = 'none';
            pacienteIdInput.value = '';
            if (avisoDiv) avisoDiv.style.display = 'none';
            if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
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
                    verificarBeneficiosAtivos(pacienteIdInput.value); // <-- chama aqui também
                });

                sugestoes.appendChild(div);
            });
        } catch (error) {
            console.error('Erro ao buscar pacientes:', error);
        }
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

    if (checkRecorrente === true) {
        divRecorrente.classList.add('active')
    }
}

