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
// Função para formatar data
function formatDate(date) {
    const options = { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('pt-BR', options);
}

// Função para obter a data de amanhã
function getTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
}

 
function gerarMensagemLembrete(patient) {
    return (
`Olá, ${patient.paciente}! Sua sessão está confirmada! ☺️
Aqui é a Bem, IA da Ponto de Equilíbrio, tudo bem?

Passando para deixar o lembrete de seu(s) próximo(s) horário(s) agendado(s)

🟣 *Atividade*: ${patient.especialidade}
👩‍⚕️ *Profissional:* ${patient.profissional}
🗓 *Data:* ${patient.data} (${patient.dia_semana})
⏰ *Horário:* ${patient.hora_inicio} às ${patient.hora_fim}

Qualquer dúvida, estou por aqui.
Até lá! 🌟`
    );
}

// Função para salvar o status atualizado
function savePatientStatus(patientId, status) {
 
}
let patients = []
async function renderPatientsList() {
    const patientsList = document.getElementById('patientsList');
    const emptyState = document.getElementById('emptyState');
    
    try {

        const res = await fetch('/api/listar-lembretes-agendamentos/', {
            headers: { 'Accept': 'application/json' }
        })
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
            const text = await res.text();
            console.error("resposta não é JSON. Provavelmente HTML:", text.slice(0, 200))
            return
        }
        const data = await res.json();

        // ✅ aqui você define o patients pelo fetch
        patients = data.agendamentos || [];

        console.log('patients:', patients);

    } catch (error) {
        mostrarMensagem('Erro ao carregar lembretes', error, "error")
    }

    if (patients.length === 0) {
        patientsList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    } else {
        patientsList.style.display = 'flex';
        emptyState.style.display = 'none';
    }

    // Limpa a lista
    patientsList.innerHTML = '';

    // Calcula totais
    const totalPatients = patients.length;
    const completedPatients = patients.filter(p => p.reminderSent).length;
    const pendingPatients = totalPatients - completedPatients;

    // Atualiza os contadores
    document.getElementById('totalPatients').textContent = totalPatients;
    document.getElementById('pendingPatients').textContent = pendingPatients;
    document.getElementById('completedPatients').textContent = completedPatients;

    // Atualiza a barra de progresso
    const progressPercent = totalPatients > 0 ? Math.round((completedPatients / totalPatients) * 100) : 0;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `${progressPercent}% concluído`;

    // Atualiza a mensagem de resumo
    const summaryMessage = document.getElementById('summaryMessage');
    if (pendingPatients === 0 && totalPatients > 0) {
        summaryMessage.textContent = "✅ Todos os lembretes foram enviados com sucesso!";
        summaryMessage.className = "summary-message all-completed";
    } else if (pendingPatients > 0) {
        summaryMessage.textContent = `⚠️ Ainda há ${pendingPatients} paciente(s) pendente(s). Verifique antes de finalizar.`;
        summaryMessage.className = "summary-message pending-exist";
    } else {
        summaryMessage.textContent = "Verifique todos os pacientes pendentes antes de finalizar o dia.";
        summaryMessage.className = "summary-message";
    }

    // Renderiza cada paciente
    patients.forEach(patient => {
        const patientCard = document.createElement('div');
        patientCard.className = `patient-card ${patient.reminderSent ? 'completed' : ''}`;
        patientCard.id = `patient-${patient.id}`;

        patientCard.innerHTML = `
                    <div class="patient-info ${patient.reminderSent ? 'patient-completed' : ''}">
                        <div class="patient-name">${patient.paciente}</div>
                        <div class="patient-details">
                            <div class="patient-detail">
                                <i class="fas fa-clock"></i>
                                <span>${patient.hora_inicio} - ${patient.hora_fim}</span>
                            </div>
                            <div class="patient-detail">
                                <i class="fas fa-phone"></i>
                                <span>${patient.telefone}</span>
                            </div>
                            <div class="patient-detail">
                                <i class="fas fa-stethoscope"></i>
                                <span>${patient.especialidade}</span>
                            </div>
                        </div>
                    </div>
                    <div class="patient-actions">
                        <div class="status-badge ${patient.reminderSent ? 'status-completed' : 'status-pending'}">
                            <i class="fas ${patient.reminderSent ? 'fa-check-circle' : 'fa-clock'}"></i>
                            <span>${patient.reminderSent ? 'Lembrete enviado' : 'Pendente'}</span>
                        </div>
                        <button class="btn-send ${patient.reminderSent ? 'completed' : ''}" 
                                onclick="openReminderModal(${patient.id})"
                                ${patient.reminderSent ? 'disabled' : ''}>
                            <i class="fab fa-whatsapp"></i>
                            ${patient.reminderSent ? 'Enviado' : 'Enviar lembrete'}
                        </button>
                    </div>
                `;

        patientsList.appendChild(patientCard);
    });
}
let selectedPatient = null;

function openReminderModal(patientId) {
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return;

    selectedPatient = patient;

    const mensagem = gerarMensagemLembrete(patient);
    document.getElementById('mensagemLembrete').textContent = mensagem;

    document.getElementById('modalLembrete').style.display = 'flex';
}

function closeReminderModal() {
    document.getElementById('modalLembrete').style.display = 'none';
    selectedPatient = null;
}

async function confirmSendReminder() {
    if (!selectedPatient) return;

    const mensagem = document.getElementById('mensagemLembrete').value;

    try {
        const res = await fetch(`/api/enviar-lembrete/${selectedPatient.id}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken()
            },
            body: JSON.stringify({
                mensagem: mensagem
            })
        });

        if (!res.ok) throw new Error('Erro ao enviar lembrete');

        closeReminderModal();
        renderPatientsList();

        mostrarMensagem(
            'Lembrete enviado',
            'Mensagem enviada e registrada com sucesso.',
            'success'
        );

    } catch (err) {
        mostrarMensagem(
            'deu Erro garai',
            'Não foi possível enviar o lembrete.',
            'error'
        );
    }
}


// Função para enviar lembrete (simulado)
function sendReminder(patientId) {

    savePatientStatus(patientId, true);

    // Atualiza a interface
    renderPatientsList();

    // Feedback visual para o usuário
    const patientCard = document.getElementById(`patient-${patientId}`);
    patientCard.classList.add('completed');

    // Exibe mensagem de sucesso
    const patients = getPatientsForTomorrow();
    const patient = patients.find(p => p.id === patientId);

    alert(`Lembrete registrado como enviado para ${patient.name}.`);

    // Em um sistema real, aqui poderia ser acionada uma API para envio real pelo WhatsApp
    console.log(`Lembrete enviado para: ${patient.name} - Telefone: ${patient.phone}`);
}

// Função para inicializar a página
function initPage() {
    // Configura a data de amanhã no cabeçalho
    const tomorrow = getTomorrowDate();
    document.getElementById('tomorrowDate').textContent = formatDate(tomorrow);

    // Renderiza a lista de pacientes
    renderPatientsList();

    // Simula atualização automática diária
    // Em um sistema real, isso seria gerenciado pelo backend
    console.log("Checklist diário carregado para:", formatDate(tomorrow));
}

// Inicializa a página quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initPage);

// Simula a geração automática diária limpando dados antigos
// Em um sistema real, isso seria feito pelo backend
function clearOldChecklists() {
    const today = new Date().toDateString();
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
        if (key.startsWith('checklist_') && !key.includes(today)) {
            // Remove checklists de dias anteriores (exceto o de amanhã)
            const keyDate = key.replace('checklist_', '');
            const keyDateObj = new Date(keyDate);
            const tomorrow = getTomorrowDate();

            if (keyDateObj.toDateString() !== tomorrow.toDateString()) {
                localStorage.removeItem(key);
            }
        }
    });
}

// Executa a limpeza de dados antigos
clearOldChecklists();
