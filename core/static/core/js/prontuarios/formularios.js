// core/static/core/js/api.js
document.addEventListener('DOMContentLoaded', function() {
    atualizarStatusProntuarios()
}) 
// Função para obter o token CSRF
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

// Função genérica para fazer requisições
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

// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo = 'success') {
    // Você pode usar um toast library ou criar seu próprio sistema
    const toast = document.createElement('div');
    toast.className = `alert alert-${tipo} alert-dismissible fade show`;
    toast.innerHTML = `
        ${mensagem}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(toast);

    // Remove após 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
}


async function atualizarStatusProntuarios() {
    const statusBlocks = document.querySelectorAll(".status-simple");

    for (const block of statusBlocks) {
        const agendamentoId = block.dataset.agendamentoId;
        if (!agendamentoId) continue;

        try {
            const resp = await fetch(`/api/verificar-prontuario/${agendamentoId}/`);
            if (!resp.ok) continue;

            const data = await resp.json();
            const badgeProntuario = block.querySelector(".status-badge.prontuario");
            const badgeEvolucao = block.querySelector(".status-badge.evolucao");
            if (badgeProntuario, badgeEvolucao) {
                badgeProntuario.dataset.status = data.tem_prontuario ? "true" : "false";
            }
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
        }
    }
};

async function salvarProntuario() {
    const modal = document.getElementById('newProntuarioModal');
    const profissionalId = document.getElementById("profissionalLogado").value;

    const dados = {
        paciente_id: modal.dataset.pacienteId || "",
        profissional_id: profissionalId,
        agendamento_id: modal.dataset.agendamentoId || "",
        queixa_principal: document.getElementById('queixaPrincipal').value,
        historia_doenca: document.getElementById('historiaDoenca').value,
        exame_fisico: document.getElementById('exameFisico').value,
        conduta: document.getElementById('conduta').value,
        diagnostico: document.getElementById('diagnostico').value,
        observacoes: document.getElementById('observacoes').value,
    };

    console.log("Enviando dados:", dados);

    const res = await apiRequest('/api/salvar-prontuario/', dados);
    if (res.success) {
        mostrarMensagem('Prontuário salvo com sucesso');
        closeModal('newProntuarioModal');
        atualizarStatusProntuarios()
    } else {
        mostrarMensagem('Erro ao salvar prontuário: ' + res.error, 'error');
    }
}

async function salvarEvolucao() {
    const modal = document.getElementById('newEvolutionModal');
    const profissionalId = document.getElementById("profissionalLogado").value;

    const dados = {
        paciente_id: modal.dataset.pacienteId || "",
        profissional_id: profissionalId,
        agendamento_id: modal.dataset.agendamentoId || "",
        queixa_principal: document.getElementById('queixaPrincipalEvolucao').value,
        processo_terapeutico: document.getElementById('processoTerapeutico').value,
        condutas_tecnicas:document.getElementById('condutasTecnicas').value,
        resposta_paciente:document.getElementById('respostaPaciente').value,
        intercorrencias:document.getElementById('intercorrencias').value,
        dor_inicio:document.getElementById('dorInicio').value,
        dor_atual:document.getElementById('dorAtual').value,
        dor_observacoes:document.getElementById('dorObservacoes').value,
        amplitude_inicio:document.getElementById('amplitudeInicio').value,
        amplitude_atual:document.getElementById('amplitudeAtual').value,
        amplitude_observacoes:document.getElementById('amplitudeObservacoes').value,
        forca_inicio:document.getElementById('forcaInicio').value,
        forca_atual:document.getElementById('forcaAtual').value,
        forca_observacoes:document.getElementById('forcaObservacoes').value,
        postura_inicio:document.getElementById('posturaInicio').value,
        postura_atual:document.getElementById('posturaAtual').value,
        postura_observacoes:document.getElementById('posturaObservacoes').value,
        edema_inicio:document.getElementById('edemaInicio').value,
        edema_atual:document.getElementById('edemaAtual').value,
        edema_observacoes:document.getElementById('edemaObservacoes').value,
        advs_inicio:document.getElementById('avdsInicio').value,
        advs_atual:document.getElementById('avdsAtual').value,
        advs_observacoes:document.getElementById('avdsObservacoes').value,
        asp_emocionais_inicio:document.getElementById('emocionaisInicio').value,
        asp_emocionais_atual:document.getElementById('emocionaisAtual').value,
        asp_emocionais_observacoes:document.getElementById('emocionaisObservacoes').value,
        sintese_evolucao:document.getElementById('sinteseEvolucao').value,
        mensagem_paciente:document.getElementById('mensagemPaciente').value,
        explicacao_continuidade:document.getElementById('explicacaoContinuidade').value,
        reacoes_paciente:document.getElementById('reacoesPaciente').value,
        dor_expectativa:document.getElementById('dorExpectativa').value,
        dor_realidade:document.getElementById('dorRealidade').value,
        mobilidade_expectativa:document.getElementById('mobilidadeExpectativa').value,
        mobilidade_realidade:document.getElementById('mobilidadeRealidade').value,
        energia_expectativa:document.getElementById('energiaExpectativa').value,
        energia_realidade:document.getElementById('energiaRealidade').value,
        consciencia_expectativa:document.getElementById('conscienciaExpectativa').value,
        consciencia_realidade:document.getElementById('conscienciaRealidade').value,
        rotina_trabalho:document.getElementById('rotinaTrabalho').value,
        aspectos_emocionais:document.getElementById('aspectosEmocionais').value,
        localizacao_dor:document.getElementById('localizacaoDor').value,
        localizacao_dor:document.getElementById('localizacaoDor').value,


    };

    console.log("Enviando dados:", dados);

    const res = await apiRequest('/api/salvar-evolucao/', dados);
    if (res.success) {
        mostrarMensagem('Prontuário salvo com sucesso');
        closeModal('newProntuarioModal');
        atualizarStatusProntuarios()
    } else {
        mostrarMensagem('Erro ao salvar prontuário: ' + res.error, 'error');
    }
}