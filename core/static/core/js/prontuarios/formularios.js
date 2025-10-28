// core/static/core/js/api.js

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

