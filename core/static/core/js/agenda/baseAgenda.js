let modoPercentual = true;

document.addEventListener("DOMContentLoaded", function () {
    // --- Referências (muitas podem ser opcionais, então validamos antes de usar)
    const pacotesInput = document.getElementById('pacotesInput');
    const valorInput = document.getElementById('valor_pacote');
    const descontoInput = document.getElementById('desconto');
    const valorFinalInput = document.getElementById('valor_final');
    const descontoButton = document.getElementById('desconto_button');
    const descontoLabel = document.getElementById('desconto_label');

    const openBtn = document.getElementById('openBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebar = document.getElementById('sidebar');

    const input = document.getElementById('busca');
    const sugestoes = document.getElementById('sugestoes');
    const pacienteIdInput = document.getElementById('paciente_id');
    const avisoDiv = document.getElementById('aviso-pacote');
    const mensagemPacote = document.getElementById('mensagem-pacote');
    const usarPacoteBtn = document.getElementById('usar-pacote-btn');
    const campoPacote = document.getElementById('pacote_codigo');

    // Funções globais usadas no HTML
    window.calcularDesconto = function () {
        if (!valorInput || !descontoInput || !valorFinalInput) return;
        const valorPacote = parseFloat(valorInput.value) || 0;
        const desconto = parseFloat(descontoInput.value) || 0;
        const valorFinal = modoPercentual ? (valorPacote - (valorPacote * (desconto / 100)))
            : (valorPacote - desconto);
        valorFinalInput.value = valorFinal.toFixed(2);
    };

    window.alternarModoDesconto = function () {
        modoPercentual = !modoPercentual;
        if (descontoLabel) descontoLabel.textContent = modoPercentual ? 'Desconto (%)' : 'Desconto (R$)';
        if (descontoButton) descontoButton.textContent = modoPercentual ? 'R$' : '%';
        window.calcularDesconto();
    };

    window.alterarDesconto = function () {
        if (!valorInput || !valorFinalInput || !descontoInput) return;
        const valorPacote = parseFloat(valorInput.value) || 0;
        const valorFinal = parseFloat(valorFinalInput.value) || 0;
        let descontoCalculado = 0;
        if (modoPercentual && valorPacote !== 0) {
            descontoCalculado = ((valorPacote - valorFinal) / valorPacote) * 100;
        } else {
            descontoCalculado = valorPacote - valorFinal;
        }
        descontoInput.value = descontoCalculado.toFixed(2);
    };

    async function verificarPacoteAtivo() {
        if (!pacienteIdInput) return;
        const pacienteId = pacienteIdInput.value;

        const servicoSelect = document.getElementById('pacotesInput');
        const formValor = document.getElementById('formValor');
        const infoPacote = document.getElementById('info_pacote');
        const pacoteAtual = document.getElementById('pacote_atual');
        const avisoDesmarcacoes = document.getElementById('aviso-desmarcacoes');
        const mensagemDesmarcacoes = document.getElementById('mensagem-desmarcacoes');

        const radioButtons = document.querySelectorAll('input[name="tipo_agendamento"]');
        const servicosBanco = document.querySelectorAll('.servico-banco');
        const servicosReposicao = document.querySelectorAll('.servico-reposicao');
        const usarRemarcacaoBtn = document.getElementById('usar-reposicao-btn');
        const avisoRepo = document.getElementById('aviso-desmarcacoes');
        const tipoSessaoLabel = document.getElementById('tipo_sessao');
        const infoReposicao = document.getElementById('info_reposicao');

        // Toggle de opções por tipo de agendamento
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function () {
                if (!servicoSelect) return;
                if (this.value === 'reposicao') {
                    servicosBanco.forEach(opt => opt.hidden = true);
                    servicosReposicao.forEach(opt => opt.hidden = false);
                    servicoSelect.value = ""; // <-- corrigido (antes "select")
                } else {
                    servicosBanco.forEach(opt => opt.hidden = false);
                    servicosReposicao.forEach(opt => opt.hidden = true);
                    servicoSelect.value = ""; // <-- corrigido
                }
            });
        });

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

                if (usarPacoteBtn) {
                    usarPacoteBtn.onclick = () => {
                        const option = document.createElement('option');
                        option.value = pacote.servico_id.toString();
                        option.textContent = `Sessão ${sessaoAtual} de ${pacote.quantidade_total} (pacote ativo)`;
                        option.hidden = true;
                        option.disabled = false;
                        option.setAttribute("data-pacote", "true");

                        servicoSelect.prepend(option);
                        servicoSelect.value = option.value;

                        const servicoHidden = document.getElementById('servico_id_hidden');
                        if (servicoHidden) servicoHidden.value = pacote.servico_id;

                        servicoSelect.disabled = true;
                        servicoSelect.readOnly = true;

                        const codigoDisp = document.getElementById('codigo_pacote_display');
                        const valorPagoDisp = document.getElementById('valor_pago_display');
                        const valorRestanteDisp = document.getElementById('valor_restante_display');
                        const sessaoAtualDisp = document.getElementById('sessao_atual_display');
                        const totalSessoesDisp = document.getElementById('total_sessoes_display');

                        if (codigoDisp) codigoDisp.textContent = pacote.codigo;
                        if (valorPagoDisp) valorPagoDisp.textContent = Number(pacote.valor_pago).toFixed(2);
                        if (valorRestanteDisp) valorRestanteDisp.textContent = (pacote.valor_total - pacote.valor_pago).toFixed(2);
                        if (sessaoAtualDisp) sessaoAtualDisp.textContent = sessaoAtual;
                        if (totalSessoesDisp) totalSessoesDisp.textContent = pacote.quantidade_total;

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
                        if (avisoRepo) avisoRepo.style.display = 'none';
                    };
                }
            }

            // Saldos de desmarcações
            const sd = data.saldos_desmarcacoes || {};
            const mensagens = [];
            if ((sd.desistencia || 0) > 0) mensagens.push(`❌ D: ${sd.desistencia}`);
            if ((sd.desistencia_remarcacao || 0) > 0) mensagens.push(`⚠ DCR: ${sd.desistencia_remarcacao}`);
            if ((sd.falta_remarcacao || 0) > 0) mensagens.push(`⚠ FCR: ${sd.falta_remarcacao}`);
            if ((sd.falta_cobrada || 0) > 0) mensagens.push(`❌ FC: ${sd.falta_cobrada}`);

            if (mensagens.length > 0) {
                if (mensagemDesmarcacoes) mensagemDesmarcacoes.textContent =
                    `Este paciente possui sessões desmarcadas registradas: ${mensagens.join(' | ')}`;
                if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'block';
            } else {
                if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
            }

            // Esconde reposição por padrão
            servicosReposicao.forEach(opt => opt.hidden = true);

            if (usarRemarcacaoBtn) {
                usarRemarcacaoBtn.onclick = () => {
                    const radioReposicao = document.querySelector('input[name="tipo_agendamento"][value="reposicao"]');
                    if (radioReposicao) {
                        radioReposicao.checked = true;
                        radioReposicao.dispatchEvent(new Event('change'));
                    }

                    if (infoReposicao) {
                        infoReposicao.innerHTML = `<strong>Reposição de sessão</strong>`;
                        infoReposicao.style.display = 'block';
                    }

                    if (avisoDiv) avisoDiv.style.display = 'none';
                    if (avisoRepo) avisoRepo.style.display = 'none';
                    if (tipoSessaoLabel) tipoSessaoLabel.textContent = 'Tipo de reposição';
                };
            }

        } catch (error) {
            console.error('Erro ao verificar pacote:', error);
            if (formValor) formValor.classList.remove('hidden');
            if (infoPacote) infoPacote.classList.add('hidden');
            if (avisoDesmarcacoes) avisoDesmarcacoes.style.display = 'none';
        }
    }

    function limparOpcaoPacoteServico() {
        const servicoSelect = document.getElementById('pacotesInput');
        if (!servicoSelect) return;
        servicoSelect.querySelectorAll('option[data-pacote="true"]').forEach(opt => opt.remove());
        servicoSelect.disabled = false;
        servicoSelect.readOnly = false;
        servicoSelect.value = '';

        const formValor = document.getElementById('formValor');
        const infoPacote = document.getElementById('info_pacote');
        if (formValor) formValor.classList.remove('hidden');
        if (infoPacote) infoPacote.classList.add('hidden');
    }

    // tipo_agendamento = novo
    const radioNovo = document.querySelector('input[name="tipo_agendamento"][value="novo"]');
    if (radioNovo) {
        radioNovo.addEventListener('click', () => {
            const servicoSelect = document.getElementById('pacotesInput');
            if (servicoSelect) {
                servicoSelect.disabled = false;
                servicoSelect.readOnly = false;
                servicoSelect.querySelectorAll('option[data-pacote="true"]').forEach(op => op.remove());
                servicoSelect.value = '';
            }

            const servicoHidden = document.getElementById('servico_id_hidden');
            if (servicoHidden) servicoHidden.value = "";

            const formValor = document.getElementById('formValor');
            const infoPacote = document.getElementById('info_pacote');
            if (formValor) formValor.classList.remove('hidden');
            if (infoPacote) infoPacote.classList.add('hidden');

            const campos = ['codigo_pacote_display', 'valor_pago_display', 'valor_restante_display', 'sessao_atual_display', 'total_sessoes_display'];
            campos.forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ""; });

            if (valorFinalInput) valorFinalInput.value = "";

            const pacoteAtual = document.getElementById('pacote_atual');
            if (pacoteAtual) { pacoteAtual.textContent = ""; pacoteAtual.style.display = 'none'; }

            if (campoPacote) campoPacote.value = '';

            if (avisoDiv) avisoDiv.style.display = 'none';
        });
    }

    // Mostrar valor do serviço selecionado
    if (pacotesInput && valorInput) {
        pacotesInput.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const valor = parseFloat(selectedOption?.getAttribute('data-valor')) || 0;
            valorInput.value = valor.toFixed(2);
            window.calcularDesconto();
        });
    }

    // Sidebar open/close (com hidden para evitar FOUC)
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

    // Submenus (opcional)
    document.querySelectorAll('.submenu-header').forEach(header => {
        header.addEventListener('click', function () {
            const submenu = this.parentElement;
            submenu.classList.toggle('open');
        });
    });

    // Autocomplete paciente
    if (input && sugestoes && pacienteIdInput) {
        input.addEventListener('input', async () => {
            const query = input.value.trim();
            if (query.length === 0) {
                sugestoes.innerHTML = '';
                sugestoes.style.display = 'none';
                pacienteIdInput.value = '';
                if (avisoDiv) avisoDiv.style.display = 'none';
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
                    div.style.padding = '5px';
                    div.style.cursor = 'pointer';
                    div.addEventListener('click', () => {
                        input.value = `${paciente.nome} ${paciente.sobrenome}`;
                        pacienteIdInput.value = paciente.id;
                        sugestoes.innerHTML = '';
                        sugestoes.style.display = 'none';
                        verificarPacoteAtivo();
                    });
                    sugestoes.appendChild(div);
                });
            } catch (error) {
                console.error('Erro ao buscar pacientes:', error);
            }
        });
    }

    // Abrir modal de edição (event delegation já está ok)
    document.querySelectorAll('.btn-editar-agendamento').forEach(botao => {
        botao.addEventListener("click", function () {
            const agendamentoId = this.dataset.id;
            window.currentAgendamentoId = agendamentoId;
            fetch(`/agendamento/json/${agendamentoId}/`)
                .then(response => response.json())
                .then(data => {
                    const setVal = (sel, val) => { const el = document.querySelector(sel); if (el) el.value = val ?? ''; };

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
                });
        });
    });
});

// Funções auxiliares fora do DOMContentLoaded
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

// Editar horário (protege quando não existem esses botões na página)
document.querySelectorAll('.editar-horario-btn').forEach(button => {
    button.addEventListener('click', function () {
        const container = this.closest('.agenda-hora');
        if (!container) return;
        const spanHora = container.querySelector('.hora-text');
        const inputInicio = container.querySelector('.hora-inicio-input');
        const inputFim = container.querySelector('.hora-fim-input');

        if (spanHora && inputInicio && inputFim) {
            spanHora.classList.add('hidden');
            inputInicio.classList.remove('hidden');
            inputFim.classList.remove('hidden');
            this.innerHTML = "<i class='bx bx-check'></i>";
            this.classList.add('salvar-mode');
        }
    });
});

document.querySelectorAll('.editar-horario-btn').forEach(button => {
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

// Form de edição (existe só quando o modal é renderizado)
const formEdicao = document.getElementById('form-edicao');
if (formEdicao) {
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
            if (data.status === 'ok') location.reload();
        } catch (error) {
            console.error(error);
        }
    });
}
