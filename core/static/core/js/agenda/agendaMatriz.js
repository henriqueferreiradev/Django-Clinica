// Date handling
let currentDate = new Date("{{ selected_date }}");

function formatarDataParaBR(date) {
    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    const diaSemana = diasSemana[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const ano = date.getFullYear();

    return `${diaSemana}, ${dia} de ${mes} de ${ano}`;
}

function updateDateDisplay() {
    const dateStr = formatarDataParaBR(currentDate);
    const hoje = new Date();
    const isToday = currentDate.toDateString() === hoje.toDateString();

    if (isToday) {
        document.getElementById('current-date').innerHTML = dateStr + ' <span style="color: var(--roxoPrincipal);"> - Hoje</span>';
    } else {
        document.getElementById('current-date').textContent = dateStr;
    }
    document.getElementById('date-selector').valueAsDate = currentDate;
}

// Navegação por data
document.getElementById('prev-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() - 1);
    navigateToDate(currentDate);
});

document.getElementById('next-day').addEventListener('click', () => {
    currentDate.setDate(currentDate.getDate() + 1);
    navigateToDate(currentDate);
});

document.getElementById('today-btn').addEventListener('click', () => {
    currentDate = new Date();
    navigateToDate(currentDate);
});

document.getElementById('date-selector').addEventListener('change', (e) => {
    currentDate = new Date(e.target.value);
    navigateToDate(currentDate);
});

function navigateToDate(date) {
    const formattedDate = date.toISOString().split('T')[0];
    window.location.href = `?date=${formattedDate}`;
}

// Filtro por profissional - SIMPLIFICADO
document.getElementById('profissional-select').addEventListener('change', function () {
    const selectedProfId = this.value;

    // Resetar todos os cards primeiro
    document.querySelectorAll('.prof-card').forEach(card => {
        card.classList.remove('active');
        card.style.background = '';
        card.style.color = '';
        card.querySelector('i').style.color = '';

        if (card.classList.contains('sem-agenda')) {
            card.style.opacity = '0.6';
        }
    });

    // Mostrar/ocultar colunas da tabela
    document.querySelectorAll('th[data-prof-id]').forEach(th => {
        if (selectedProfId === '' || th.dataset.profId === selectedProfId) {
            th.style.display = '';
        } else {
            th.style.display = 'none';
        }
    });

    // Mostrar/ocultar células da tabela
    document.querySelectorAll('td[data-prof-id]').forEach(td => {
        const row = td.parentNode;
        const colIndex = Array.from(row.children).indexOf(td);
        const header = document.querySelector(`th:nth-child(${colIndex + 1})`);

        if (selectedProfId === '' || (header && header.dataset.profId === selectedProfId)) {
            td.style.display = '';
        } else {
            td.style.display = 'none';
        }
    });

    // Destacar profissional selecionado na sidebar
    if (selectedProfId !== '') {
        const selectedCard = document.querySelector(`.prof-card[data-prof-id="${selectedProfId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('active');
        }
    }
});

// Click nos cards de profissional (sidebar)
document.querySelectorAll('.prof-card').forEach(card => {
    card.addEventListener('click', function () {
        const profId = this.dataset.profId;
        const select = document.getElementById('profissional-select');
        select.value = profId;
        select.dispatchEvent(new Event('change'));
    });
});

// Filtro "Trabalha hoje" - SIMPLIFICADO
document.getElementById('working-today-check').addEventListener('change', function () {
    document.querySelectorAll('.prof-card').forEach(card => {
        if (this.checked) {
            // Mostrar apenas quem trabalha (simulação)
            // Aqui você pode integrar com sua lógica real
            const trabalhaHoje = Math.random() > 0.3; // 70% trabalham
            if (!trabalhaHoje) {
                card.style.opacity = '0.3';
                card.style.pointerEvents = 'none';
            } else {
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
            }
        } else {
            // Mostrar todos
            card.style.opacity = '1';
            card.style.pointerEvents = 'auto';
        }
    });
});



// Destacar hora atual - SIMPLIFICADO
function highlightCurrentTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentDateStr = now.toISOString().split('T')[0];
    const selectedDateStr = "{{ selected_date }}";

    // Só destacar se for a data selecionada
    if (currentDateStr !== selectedDateStr) {
        document.querySelectorAll('.horario-col').forEach(td => {
            td.classList.remove('hora-atual');
        });
        return;
    }

    // Arredondar para o bloco de 30 minutos mais próximo
    const roundedMinute = Math.floor(currentMinute / 30) * 30;
    const currentTimeString =
        String(currentHour).padStart(2, '0') + ':' +
        String(roundedMinute).padStart(2, '0');

    // Remover destaque anterior
    document.querySelectorAll('.horario-col').forEach(td => {
        td.classList.remove('hora-atual');
    });

    // Destacar hora atual
    const currentTd = document.querySelector(`.horario-col[data-hora="${currentTimeString}"]`);
    if (currentTd) {
        currentTd.classList.add('hora-atual');
    }
}

// Inicializar
updateDateDisplay();
highlightCurrentTime();

// Atualizar hora atual periodicamente
setInterval(highlightCurrentTime, 1000 * 30); // Atualizar a cada 30 segundos

// Melhoria: Ajustar altura da tabela ao redimensionar
window.addEventListener('resize', function () {
    const agendaBoard = document.querySelector('.agenda-board');
    const profissionais = document.querySelector('.profissionais');
    const horarios = document.querySelector('.horarios');

    if (agendaBoard && profissionais && horarios) {
        const availableHeight = window.innerHeight - 120; // Subtrai altura dos filtros
        agendaBoard.style.height = `${availableHeight}px`;
    }
});

// Executar ajuste inicial de altura
setTimeout(() => {
    window.dispatchEvent(new Event('resize'));
}, 100);

// Melhoria: Scroll suave para a hora atual
function scrollToCurrentTime() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDateStr = now.toISOString().split('T')[0];
    const selectedDateStr = "{{ selected_date }}";

    if (currentDateStr === selectedDateStr) {
        const currentTimeString = String(currentHour).padStart(2, '0') + ':00';
        const currentRow = document.querySelector(`td.horario-col[data-hora="${currentTimeString}"]`);

        if (currentRow && currentRow.parentElement) {
            currentRow.parentElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
}

// Adicionar botão para ir para hora atual
const scrollToNowBtn = document.createElement('button');
scrollToNowBtn.innerHTML = '<i class="fas fa-clock"></i>';
scrollToNowBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--roxoPrincipal);
        color: white;
        border: none;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 100;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `;
scrollToNowBtn.addEventListener('click', scrollToCurrentTime);
document.body.appendChild(scrollToNowBtn);
// Função para mapear o status para classes CSS
function getStatusClass(status) {
    const statusClasses = {
        'pre': 'status-pre',
        'agendado': 'status-agendado',
        'finalizado': 'status-finalizado',
        'desistencia': 'status-desistencia',
        'desistencia_remarcacao': 'status-desistencia-remarcacao',
        'falta_remarcacao': 'status-falta-remarcacao',
        'falta_cobrada': 'status-falta-cobrada'
    };
    return statusClasses[status] || 'status-padrao';
}

// Função para mapear o status para texto legível
function getStatusText(status) {
    const statusTexts = {
        'pre': '✅ Pré-Agendado',
        'agendado': '✅ Agendado',
        'finalizado': '✅ Consulta finalizada!',
        'desistencia': '❌ D - Desmarcação',
        'desistencia_remarcacao': '⚠️ DCR - Desmarcação com reposição',
        'falta_remarcacao': '⚠️ FCR - Falta com reposição',
        'falta_cobrada': '❌ FC - Falta cobrada'
    };
    return statusTexts[status] || 'Status desconhecido';
}

async function abrirDetalhesAgendamento(agendamentoId) {
    const response = await fetch(`/api/agendamento/detalhar/${agendamentoId}/`);
    const data = await response.json();
    const container = document.getElementById('agendamento-modal');
    container.classList.add('active');


    container.innerHTML = `
            <div class="modal-card">
                <!-- Cabeçalho do modal -->
                <div class="modal-header">
                    <h3><i class="fas fa-calendar-check"></i> Detalhes do Agendamento</h3>
                    <button class="modal-close" id="close-modal">&times;</button>
                </div>
                
                <!-- Corpo do modal -->
                <div class="modal-body">
                    <div class="paciente-info">
                        <!-- Foto e informações principais -->
                        <div class="paciente-foto-container">
                            <div class="paciente-foto" id="paciente-foto">
                                <i class="fas fa-user"></i>
                            </div>
                            <div class="paciente-dados">
                                <h4 id="paciente-nome">${data.paciente_nome_completo}</h4>
                                <div class="paciente-meta">
                                    <span><i class="fas fa-id-card"></i> <span id="paciente-codigo">ID: ${data.id}</span></span>
                                    <span><i class="fas fa-phone"></i> <span id="paciente-telefone">${data.paciente_celular}</span></span>
                                    <span><i class="fas fa-envelope"></i> <span id="paciente-email">${data.paciente_email}</span></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Informações do agendamento -->
                        <div class="agendamento-detalhes">
                            <div class="info-row">
                                <div class="info-item">
                                    <i class="fas fa-calendar-day"></i>
                                    <div>
                                        <small>Data</small>
                                        <p id="agendamento-data">${data.data}</p>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-clock"></i>
                                    <div>
                                        <small>Horário</small>
                                        <p id="agendamento-horario">${data.hora_inicio} - ${data.hora_fim}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="info-row">
                                <div class="info-item">
                                    <i class="fas fa-user-md"></i>
                                    <div>
                                        <small>Profissional</small>
                                        <p id="agendamento-profissional">${data.profissional_nome_completo}</p>
                                    </div>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-stethoscope"></i>
                                    <div>
                                        <small>Especialidade</small>
                                        <p id="agendamento-especialidade">${data.especialidade}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Sessões -->
                            <div class="sessoes-info">
                                <h5><i class="fas fa-list-ol"></i> Sessões</h5>
                                <div class="sessoes-container">
                                    <div class="sessao-item">
                                        <i class="fas fa-play-circle"></i>
                                        <div>
                                            <small>Sessão Atual</small>
                                            <p id="sessao-atual">${data.sessao_atual}</p>
                                        </div>
                                    </div>
                                    <div class="sessao-item">
                                        <i class="fas fa-hourglass-half"></i>
                                        <div>
                                            <small>Sessões Restantes</small>
                                            <p id="sessoes-restantes">${data.sessoes_restantes}</p>
                                        </div>
                                    </div>
                                    <div class="sessao-item">
                                        <i class="fas fa-flag-checkered"></i>
                                        <div>
                                            <small>Total de Sessões</small>
                                            <p id="total-sessoes">${data.qtd_sessoes}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Status (AGORA COM SELECT EDITÁVEL) -->
                            <div class="status-container" id="status-container">
                                <h5><i class="fas fa-info-circle"></i> Status</h5>
                                <div class="status-display" id="status-display">
                                    <!-- Modo visualização (inicial) -->
                                    <div class="status-view">
                                        <div class="status-badge ${getStatusClass(data.status)}" id="status-badge">
                                            <span id="status-text">${getStatusText(data.status)}</span>
                                        </div>
                                        <button class="btn-edit-status" id="btn-edit-status">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                    </div>
                                    
                                    <!-- Modo edição (hidden inicialmente) -->
                                    <form id="status-form" class="status-edit-form" style="display: none;">
                                        <div class="form-group">
                                            <select name="status" class="status-select" id="status-select">
                                                <option value="pre" ${data.status === 'pre' ? 'selected' : ''}>✅ Pré-Agendado</option>
                                                <option value="agendado" ${data.status === 'agendado' ? 'selected' : ''}>✅ Agendado</option>
                                                <option value="finalizado" ${data.status === 'finalizado' ? 'selected' : ''}>✅ Consulta finalizada!</option>
                                                <option value="desistencia" ${data.status === 'desistencia' ? 'selected' : ''}>❌ D - Desmarcação</option>
                                                <option value="desistencia_remarcacao" ${data.status === 'desistencia_remarcacao' ? 'selected' : ''}>⚠️ DCR - Desmarcação com reposição</option>
                                                <option value="falta_remarcacao" ${data.status === 'falta_remarcacao' ? 'selected' : ''}>⚠️ FCR - Falta com reposição</option>
                                                <option value="falta_cobrada" ${data.status === 'falta_cobrada' ? 'selected' : ''}>❌ FC - Falta cobrada</option>
                                            </select>
                                            <div class="status-form-actions">
                                                <button type="submit" class="btn-salvar-status">
                                                    <i class="fas fa-save"></i> Salvar
                                                </button>
                                                <button type="button" class="btn-cancelar-status">
                                                    <i class="fas fa-times"></i> Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            
                            <!-- Observações -->
                            <div class="observacoes-container">
                                <h5><i class="fas fa-clipboard"></i> Observações</h5>
                                <p id="agendamento-observacoes" class="observacoes-text">${data.observacoes}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
 
            </div>
        `;

    // Adicionar eventos após renderizar o modal
    adicionarEventosStatus(agendamentoId, data.status);
    adicionarEventosGerais();
}

// Função para adicionar eventos do status
function adicionarEventosStatus(agendamentoId, currentStatus) {
    const btnEditStatus = document.getElementById('btn-edit-status');
    const statusForm = document.getElementById('status-form');
    const statusView = document.querySelector('.status-view');
    const btnCancelar = document.querySelector('.btn-cancelar-status');
    const statusSelect = document.getElementById('status-select');

    // Salvar o status original
    let originalStatus = currentStatus;

    // Botão para editar status
    btnEditStatus.addEventListener('click', function () {
        statusView.style.display = 'none';
        statusForm.style.display = 'block';
        statusSelect.focus();
    });

    // Botão para cancelar edição
    btnCancelar.addEventListener('click', function () {
        statusForm.style.display = 'none';
        statusView.style.display = 'block';
        // Resetar para o valor original
        statusSelect.value = originalStatus;
    });

    // Enviar formulário de status
    statusForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const newStatus = statusSelect.value;
        const csrfToken = getCookie('csrftoken');

        try {
            const response = await fetch(`/agendamentos/${agendamentoId}/alterar-status/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken
                },
                body: JSON.stringify({
                    status: newStatus
                })
            });

            if (response.ok) {
                const result = await response.json();

                if (result.success) {
                    // Atualizar visualização
                    const statusBadge = document.getElementById('status-badge');
                    const statusText = document.getElementById('status-text');

                    // Atualizar classes do badge
                    statusBadge.className = `status-badge ${getStatusClass(newStatus)}`;
                    statusText.textContent = getStatusText(newStatus);

                    // Atualizar status original
                    originalStatus = newStatus;

                    // Mostrar mensagem de sucesso
                    showToast('Status atualizado com sucesso!', 'success');

                    // Voltar para modo visualização
                    statusForm.style.display = 'none';
                    statusView.style.display = 'flex';

                    // Atualizar na lista principal (se necessário)
                    atualizarStatusNaLista(agendamentoId, newStatus);
                } else {
                    showToast('Erro ao atualizar status: ' + result.error, 'error');
                }
            } else {
                showToast('Erro na requisição', 'error');
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            showToast('Erro ao atualizar status', 'error');
        }
    });
}

// Função para atualizar status na lista principal
function atualizarStatusNaLista(agendamentoId, newStatus) {
    const statusElement = document.querySelector(`tr[data-agendamento-id="${agendamentoId}"] .status-col .status-select`);
    if (statusElement) {
        statusElement.value = newStatus;
    }
}

// Função para mostrar toast/notificação
function showToast(message, type = 'info') {
    // Se você já tem um sistema de toast, use-o
    // Caso contrário, pode implementar um simples
    alert(message); // Ou implemente um toast melhor
}

// Função para pegar o cookie CSRF
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
