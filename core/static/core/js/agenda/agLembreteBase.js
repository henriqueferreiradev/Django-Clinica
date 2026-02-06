
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

// Função para simular dados de pacientes do sistema
function getPatientsForTomorrow() {
    // Em um sistema real, isso viria da API/banco de dados
    // Aqui simulamos alguns pacientes para demonstração
    const tomorrow = getTomorrowDate();

    // Verifica se há dados salvos no localStorage
    const savedData = localStorage.getItem(`checklist_${tomorrow.toDateString()}`);
    if (savedData) {
        return JSON.parse(savedData);
    }

    // Dados simulados padrão
    const patients = [
        {
            id: 1,
            name: "Maria Silva Santos",
            appointmentTime: "09:30",
            phone: "(11) 98765-4321",
            procedure: "Consulta de rotina",
            reminderSent: false
        },
        {
            id: 2,
            name: "João Pereira Oliveira",
            appointmentTime: "10:15",
            phone: "(11) 99876-5432",
            procedure: "Avaliação ortodôntica",
            reminderSent: false
        },
        {
            id: 3,
            name: "Ana Claudia Mendes",
            appointmentTime: "11:00",
            phone: "(11) 97654-3210",
            procedure: "Limpeza dental",
            reminderSent: false
        },
        {
            id: 4,
            name: "Carlos Eduardo Lima",
            appointmentTime: "14:00",
            phone: "(11) 96543-2109",
            procedure: "Restauração",
            reminderSent: false
        },
        {
            id: 5,
            name: "Fernanda Costa Rodrigues",
            appointmentTime: "15:30",
            phone: "(11) 95432-1098",
            procedure: "Consulta de rotina",
            reminderSent: false
        },
        {
            id: 6,
            name: "Roberto Almeida Souza",
            appointmentTime: "16:45",
            phone: "(11) 94321-0987",
            procedure: "Extração",
            reminderSent: false
        }
    ];

    // Salva no localStorage para simular persistência
    localStorage.setItem(`checklist_${tomorrow.toDateString()}`, JSON.stringify(patients));
    return patients;
}

// Função para salvar o status atualizado
function savePatientStatus(patientId, status) {
    const tomorrow = getTomorrowDate();
    const patients = getPatientsForTomorrow();

    // Atualiza o status do paciente
    const patientIndex = patients.findIndex(p => p.id === patientId);
    if (patientIndex !== -1) {
        patients[patientIndex].reminderSent = status;
        localStorage.setItem(`checklist_${tomorrow.toDateString()}`, JSON.stringify(patients));
    }

    return patients;
}

// Função para renderizar a lista de pacientes
function renderPatientsList() {
    const patientsList = document.getElementById('patientsList');
    const emptyState = document.getElementById('emptyState');
    const patients = getPatientsForTomorrow();

    // Verifica se há pacientes
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
                        <div class="patient-name">${patient.name}</div>
                        <div class="patient-details">
                            <div class="patient-detail">
                                <i class="fas fa-clock"></i>
                                <span>${patient.appointmentTime}</span>
                            </div>
                            <div class="patient-detail">
                                <i class="fas fa-phone"></i>
                                <span>${patient.phone}</span>
                            </div>
                            <div class="patient-detail">
                                <i class="fas fa-stethoscope"></i>
                                <span>${patient.procedure}</span>
                            </div>
                        </div>
                    </div>
                    <div class="patient-actions">
                        <div class="status-badge ${patient.reminderSent ? 'status-completed' : 'status-pending'}">
                            <i class="fas ${patient.reminderSent ? 'fa-check-circle' : 'fa-clock'}"></i>
                            <span>${patient.reminderSent ? 'Lembrete enviado' : 'Pendente'}</span>
                        </div>
                        <button class="btn-send ${patient.reminderSent ? 'completed' : ''}" 
                                onclick="sendReminder(${patient.id})"
                                ${patient.reminderSent ? 'disabled' : ''}>
                            <i class="fab fa-whatsapp"></i>
                            ${patient.reminderSent ? 'Enviado' : 'Enviar lembrete'}
                        </button>
                    </div>
                `;

        patientsList.appendChild(patientCard);
    });
}

// Função para enviar lembrete (simulado)
function sendReminder(patientId) {
    // Aqui em um sistema real, haveria integração com API para envio real
    // Neste caso, apenas registramos no sistema que foi enviado
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
