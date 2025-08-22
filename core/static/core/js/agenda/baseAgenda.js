let modoPercentual = true;

document.addEventListener("DOMContentLoaded", function () {
    // --- Referências
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

    // --- Funções
    window.calcularDesconto = function () {
        const valorPacote = parseFloat(valorInput.value) || 0;
        const desconto = parseFloat(descontoInput.value) || 0;
        let valorFinal = 0;

        if (modoPercentual) {
            valorFinal = valorPacote - (valorPacote * (desconto / 100));
        } else {
            valorFinal = valorPacote - desconto;
        }

        valorFinalInput.value = valorFinal.toFixed(2);
    };

    window.alternarModoDesconto = function () {
        modoPercentual = !modoPercentual;
        descontoLabel.textContent = modoPercentual ? 'Desconto (%)' : 'Desconto (R$)';
        descontoButton.textContent = modoPercentual ? 'R$' : '%';
        calcularDesconto();
    };

    window.alterarDesconto = function () {
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
        const usarRemarcacaoBtn = document.getElementById('usar-reposicao-btn')
        const avisoRepo = document.getElementById('aviso-desmarcacoes')
        const tipoSessaoLabel = document.getElementById('tipo_sessao')
        const infoReposicao = document.getElementById('info_reposicao')
        radioButtons.forEach(radio => {
            radio.addEventListener('change', function () {
                if (this.value === 'reposicao') {
                    servicosBanco.forEach(opt => opt.hidden = true);
                    servicosReposicao.forEach(opt => opt.hidden = false);
                    select.value = "";
                } else {
                    servicosBanco.forEach(opt => opt.hidden = false);
                    servicosReposicao.forEach(opt => opt.hidden = true);
                    select.value = "";
                }
            });
        });
        avisoDiv.style.display = 'none';
        avisoDesmarcacoes.style.display = 'none';
        servicoSelect.disabled = false;
        formValor.classList.remove('hidden');
        infoPacote.classList.add('hidden');
        limparOpcaoPacoteServico();

        if (!pacienteId) return;

        try {
            const response = await fetch(`/api/verificar_pacotes_ativos/${pacienteId}`);
            const data = await response.json();

            // Mostra pacote se existir
            if (data.tem_pacote_ativo) {
                const pacote = data.pacotes[0];
                const sessaoAtual = pacote.quantidade_usadas + 1;

                mensagemPacote.textContent = `Este paciente possui um pacote ativo (Código: ${pacote.codigo}) — Sessão ${sessaoAtual} de ${pacote.quantidade_total}. Deseja usá-lo?`;
                avisoDiv.style.display = 'block';

                usarPacoteBtn.onclick = () => {
                    const option = document.createElement('option');
                    option.value = pacote.servico_id.toString();
                    option.textContent = `Sessão ${sessaoAtual} de ${pacote.quantidade_total} (pacote ativo)`;
                    option.hidden = true;
                    option.disabled = false;
                    option.setAttribute("data-pacote", "true");

                    servicoSelect.prepend(option);
                    servicoSelect.value = option.value;
                    document.getElementById('servico_id_hidden').value = pacote.servico_id;
                    servicoSelect.disabled = true;
                    servicoSelect.readOnly = true;

                    document.getElementById('codigo_pacote_display').textContent = pacote.codigo;
                    document.getElementById('valor_pago_display').textContent = pacote.valor_pago.toFixed(2);
                    document.getElementById('valor_restante_display').textContent = (pacote.valor_total - pacote.valor_pago).toFixed(2);
                    document.getElementById('sessao_atual_display').textContent = sessaoAtual;
                    document.getElementById('total_sessoes_display').textContent = pacote.quantidade_total;

                    formValor.classList.add('hidden');
                    infoPacote.classList.remove('hidden');
                    valorFinalInput.value = (pacote.valor_total - pacote.valor_pago).toFixed(2);

                    campoPacote.value = pacote.codigo;
                    pacoteAtual.innerHTML = `<strong>Pacote ativo:</strong> Código <strong>${pacote.codigo}</strong> — Sessão ${sessaoAtual} de ${pacote.quantidade_total}`;
                    pacoteAtual.style.display = 'block';

                    document.querySelector('input[value="existente"]').checked = true;
                    avisoDiv.style.display = 'none';
                    avisoRepo.style.display = 'none';
                };
            }

            // Mostra saldos de desmarcações
            const sd = data.saldos_desmarcacoes;
            const mensagens = [];

            if (sd.desistencia > 0) mensagens.push(`❌ D: ${sd.desistencia}`);
            if (sd.desistencia_remarcacao > 0) mensagens.push(`⚠ DCR: ${sd.desistencia_remarcacao}`);
            if (sd.falta_remarcacao > 0) mensagens.push(`⚠ FCR: ${sd.falta_remarcacao}`);
            if (sd.falta_cobrada > 0) mensagens.push(`❌ FC: ${sd.falta_cobrada}`);

            if (mensagens.length > 0) {
                mensagemDesmarcacoes.textContent = `Este paciente possui sessões desmarcadas registradas: ${mensagens.join(' | ')}`;
                avisoDesmarcacoes.style.display = 'block';
            } else {
                avisoDesmarcacoes.style.display = 'none';
            }


            servicosReposicao.forEach(opt => opt.hidden = true);

            usarRemarcacaoBtn.onclick = () => {
                document.querySelector('input[value="reposicao"]').checked = true;
                const event = new Event('change');
                document.querySelector('input[value="reposicao"]').dispatchEvent(event);

                infoReposicao.innerHTML = `<strong>Reposição de sessão</strong>`;
                infoReposicao.style.display = 'block';

                avisoDiv.style.display = 'none';
                avisoRepo.style.display = 'none';
                tipoSessaoLabel.textContent = 'Tipo de reposição'
            }



        } catch (error) {
            console.error('Erro ao verificar pacote:', error);
            formValor.classList.remove('hidden');
            infoPacote.classList.add('hidden');
            avisoDesmarcacoes.style.display = 'none';
        }

    }

    function limparOpcaoPacoteServico() {
        const servicoSelect = document.getElementById('pacotesInput');
        const opcoes = servicoSelect.querySelectorAll('option[data-pacote="true"]');
        opcoes.forEach(opt => opt.remove());
        servicoSelect.disabled = false;
        servicoSelect.readOnly = false;
        servicoSelect.value = '';

        // Resetar exibição para o formulário normal
        document.getElementById('formValor').classList.remove('hidden');
        document.getElementById('info_pacote').classList.add('hidden');

    }

    document.querySelector('input[name="tipo_agendamento"][value="novo"]').addEventListener('click', () => {
        const servicoSelect = document.getElementById('pacotesInput')
        servicoSelect.disabled = false
        servicoSelect.readOnly = false

        const opcoesPacote = servicoSelect.querySelectorAll('option[data-pacote="true"]')
        opcoesPacote.forEach(op => op.remove())

        servicoSelect.value = '';
        document.getElementById('servico_id_hidden').value = ""

        const formValor = document.getElementById('formValor')
        const infoPacote = document.getElementById('info_pacote')
        formValor.classList.remove('hidden')
        infoPacote.classList.add('hidden')

        document.getElementById('codigo_pacote_display').textContent = "";
        document.getElementById('valor_pago_display').textContent = "";
        document.getElementById('valor_restante_display').textContent = "";
        document.getElementById('sessao_atual_display').textContent = "";
        document.getElementById('total_sessoes_display').textContent = "";

        if (valorFinalInput) valorFinalInput.value = ""

        const pacoteAtual = document.getElementById('pacote_atual')
        pacoteAtual.textContent = ""
        pacoteAtual.style.display = 'none'

        const campoPacote = document.getElementById('pacote_codigo')
        if (campoPacote) campoPacote.value = ''

        avisoDiv.style.display = 'none'

    })


    document.querySelectorAll('input[name="tipo_agendamento"]').forEach(radio => {
        radio.addEventListener('change', function () {
            const formValor = document.getElementById('formValor');
            const infoPacote = document.getElementById('info_pacote');

            if (this.value === 'existente') {
                // Se selecionou "pacote existente", mostrar info_pacote
                formValor.classList.add('hidden');
                infoPacote.classList.remove('hidden');
            } else {
                // Se selecionou outra opção, mostrar formValor
                formValor.classList.remove('hidden');
                infoPacote.classList.add('hidden');
            }
        });
    });
    if (pacotesInput) {
        pacotesInput.addEventListener('change', function () {
            const selectedOption = this.options[this.selectedIndex];
            const valor = parseFloat(selectedOption.getAttribute('data-valor')) || 0;
            valorInput.value = valor.toFixed(2);
            calcularDesconto();
        });
    }

    if (openBtn && closeBtn && sidebar) {
        openBtn.addEventListener('click', () => sidebar.classList.add('active'));
        closeBtn.addEventListener('click', () => sidebar.classList.remove('active'));
    }



    document.querySelectorAll('.submenu-header').forEach(header => {
        header.addEventListener('click', function () {
            const submenu = this.parentElement;
            submenu.classList.toggle('open');
        });
    });

    if (input) {
        input.addEventListener('input', async () => {
            const query = input.value.trim();
            if (query.length === 0) {
                sugestoes.innerHTML = '';
                pacienteIdInput.value = '';
                avisoDiv.style.display = 'none';
                return;
            }

            try {
                const res = await fetch(`/api/buscar-pacientes/?q=${encodeURIComponent(query)}`);
                if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
                const data = await res.json();

                sugestoes.innerHTML = '';
                sugestoes.style.display = 'block'
                data.resultados.forEach(paciente => {
                    const div = document.createElement('div');
                    div.textContent = `${paciente.nome} ${paciente.sobrenome}`;

                    div.style.padding = '5px';
                    div.style.cursor = 'pointer';

                    div.addEventListener('click', () => {
                        input.value = `${paciente.nome} ${paciente.sobrenome}`;
                        pacienteIdInput.value = paciente.id;
                        sugestoes.innerHTML = '';
                        sugestoes.style.display = 'none'
                        verificarPacoteAtivo();
                    });

                    sugestoes.appendChild(div);
                });
            } catch (error) {
                console.error('Erro ao buscar pacientes:', error);
            }
        });
    }
    document.querySelectorAll(".btn-editar-agendamento").forEach(botao => {
        botao.addEventListener("click", function () {
            const agendamentoId = this.dataset.id;
            window.currentAgendamentoId = agendamentoId;
            const dados = fetch(`/agendamento/json/${agendamentoId}/`)

                .then(response => response.json())
                .then(data => {


                    document.querySelector("#profissional1InputEdicao").value = data.profissional1_id;
                    document.querySelector("#dataInputEdicao").value = data.data;
                    document.querySelector("#horaInicioPrincipal").value = data.hora_inicio;
                    document.querySelector("#horaFimPrincipal").value = data.hora_fim;
                    document.querySelector("#profissional2InputEdicao").value = data.profissional2_id || '';
                    document.querySelector("#horaInicioAjuda").value = data.hora_inicio_aux;
                    document.querySelector("#horaFimAjuda").value = data.hora_fim_aux;


                    const lista = document.querySelector("#lista-pagamentos");
                    lista.innerHTML = ""; // Limpa o conteúdo anterior

                    // Monta a estrutura da tabela dentro de uma div.formField
                    const htmlTabela = `
                        <div class="formField">
                            <table class="tabela-pagamentos">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Valor</th>
                                        <th>Forma de Pagamento</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.pagamentos && data.pagamentos.length > 0
                            ? data.pagamentos.map(pag => `
                                            <tr>
                                                <td>${pag.data}</td>
                                                <td>R$ ${parseFloat(pag.valor).toFixed(2)}</td>
                                                <td>${pag.forma_pagamento_display}</td>
                                            </tr>
                                        `).join('')
                            : `
                                            <tr>
                                                <td colspan="3" style="text-align: center;">Nenhum pagamento registrado.</td>
                                            </tr>
                                        `
                        }
                                </tbody>
                            </table>
                        </div>
                    `;

                    lista.innerHTML = htmlTabela;


                    // abrir o modal
                    document.querySelector("#modalEditAgenda").classList.add("active");
                });
        });
    });


});

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

document.querySelectorAll('.editar-horario-btn').forEach(button => {
    button.addEventListener('click', function () {
        const container = this.closest('.agenda-hora');
        const spanHora = container.querySelector('.hora-text');
        const inputInicio = container.querySelector('.hora-inicio-input');
        const inputFim = container.querySelector('.hora-fim-input');

        // Alterna entre visualização e edição
        spanHora.classList.add('hidden');
        inputInicio.classList.remove('hidden');
        inputFim.classList.remove('hidden');

        // Muda o ícone do botão para "salvar"
        this.innerHTML = "<i class='bx bx-check'></i>";
        this.classList.add('salvar-mode');
    });
});

document.querySelectorAll('.editar-horario-btn').forEach(button => {
    button.addEventListener('click', async function () {
        if (!this.classList.contains('salvar-mode')) return;

        const container = this.closest('.agenda-hora');
        const spanHora = container.querySelector('.hora-text');
        const inputInicio = container.querySelector('.hora-inicio-input');
        const inputFim = container.querySelector('.hora-fim-input');

        const horaInicio = inputInicio.value;
        const horaFim = inputFim.value;
        const agendamentoId = container.dataset.agendamentoId; // certifique-se de setar isso no HTML

        try {
            const response = await fetch('/agendamento/editar-horario/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify({
                    agendamento_id: agendamentoId,
                    hora_inicio: horaInicio,
                    hora_fim: horaFim
                })
            });

            if (response.ok) {
                // Atualiza visualmente
                spanHora.textContent = `${horaInicio} – ${horaFim}`;
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

document.addEventListener("DOMContentLoaded", function () {

    const openBtnEdit = document.getElementById('openBtnEdit')
    const closeBtnEdit = document.getElementById('closeBtnEdit')
    const modalEditAgenda = document.getElementById('modalEditAgenda')



    // Fecha o modal
    if (closeBtnEdit) {
        closeBtnEdit.addEventListener("click", function () {
            modalEditAgenda.classList.remove("active");
        });
    }
});

document.getElementById('form-edicao').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const agendamentoId = window.currentAgendamentoId;
    try {
        const response = await fetch(`/agendamento/editar/${agendamentoId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        const data = await response.json();

        if (data.status === 'ok') {

            location.reload();
        } else {

        }
    } catch (error) {

    }
});
