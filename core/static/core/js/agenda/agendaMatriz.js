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

const selectedDateStr = document.body.dataset.selectedDate;
function parseISOToLocalDate(isoStr) {
    // isoStr = "2025-12-31"
    const [y, m, d] = isoStr.split('-').map(Number);
    return new Date(y, m - 1, d); // local (sem UTC)
}
let currentDate = selectedDateStr
    ? parseISOToLocalDate(selectedDateStr)
    : new Date();
// proteção extra
if (isNaN(currentDate.getTime())) {
    console.warn('Data inválida:', selectedDateStr);
    currentDate = new Date();
}

function formatarDataParaBR(date) {
    if (!(date instanceof Date) || isNaN(date)) {
        return 'Data inválida';
    }

    const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

    return `${diasSemana[date.getDay()]}, ${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`;
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
document.getElementById('working-today-check')
    .addEventListener('change', async function () {

        const checked = this.checked;
        const selectedDate = document.body.dataset.selectedDate;

        if (!checked) {
            // Mostrar todos novamente
            document.querySelectorAll('.prof-card').forEach(card => {
                card.style.display = '';
            });
            document.querySelectorAll('th[data-prof-id], td[data-prof-id]').forEach(el => {
                el.style.display = '';
            });
            return;
        }

        try {
            const res = await fetch(
                `/api/profissionais-trabalham/?date=${selectedDate}`
            );
            const data = await res.json();

            const idsPermitidos = data.profissionais.map(String);

            // SIDEBAR
            document.querySelectorAll('.prof-card').forEach(card => {
                const profId = card.dataset.profId;
                card.style.display = idsPermitidos.includes(profId) ? '' : 'none';
            });

            // HEADER DA TABELA
            document.querySelectorAll('th[data-prof-id]').forEach(th => {
                const profId = th.dataset.profId;
                th.style.display = idsPermitidos.includes(profId) ? '' : 'none';
            });

            // CÉLULAS
            document.querySelectorAll('td[data-prof-id]').forEach(td => {
                const profId = td.dataset.profId;
                td.style.display = idsPermitidos.includes(profId) ? '' : 'none';
            });

        } catch (err) {
            console.error(err);
            mostrarMensagem('Erro ao filtrar profissionais', 'error');
        }
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
    <div class="modal-container">
        <!-- HEADER - Fixo no topo -->
        <div class="modal-header">
            <h3><i class="fas fa-calendar-check"></i> Detalhes do Agendamento</h3>
            <button class="modal-close" id="close-modal">&times;</button>
        </div>
        
        <!-- BODY - Conteúdo rolável -->
        <div class="modal-body-content">
            <div class="paciente-info">
                <!-- Foto e informações principais -->
                <div class="paciente-foto-container">
                    <div class="paciente-foto" id="paciente-foto">
                    ${data.paciente_foto
            ? `<img src="${data.paciente_foto}" alt="Foto do paciente" class="paciente-foto-img"
                                                    onerror="this.remove(); this.parentElement.innerHTML='<i class=\\'fas fa-user\\'></i>';">`
            : `<i class="fas fa-user"></i>`
        }
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
                    
                    <div class="info-item">
                        <i class="fas fa-door-open"></i>
                        <div>
                            <small>Andar/Sala</small>
                            <p id="agendamento-ambiente">${data.ambiente}</p>
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
                    
                    <!-- Observações -->
                    <div class="observacoes-container">
                        <h5><i class="fas fa-clipboard"></i> Observações</h5>
                        <p id="agendamento-observacoes" class="observacoes-text">${data.observacoes}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- FOOTER - Fixo na base (onde vai o status) -->
        <div class="modal-footer-sticky">
            <!-- Status atual (modo visualização) -->
            <div class="status-section" id="status-current">
                <div class="status-header">
                    <h5><i class="fas fa-info-circle"></i> Status Atual</h5>
                    <button class="btn-edit-status" id="btn-edit-status">
                        <i class="fas fa-edit"></i> Editar Status
                    </button>
                </div>
                <div class="status-view">
                    <div class="status-badge ${getStatusClass(data.status)}" id="status-badge">
                        <span id="status-text">${getStatusText(data.status)}</span>
                    </div>
                </div>
            </div>
            
            <!-- Formulário de edição (inicialmente escondido) -->
            <form id="status-form" class="status-edit-form" style="display: none;">
                <div class="status-edit-header">
                    <h5><i class="fas fa-pencil-alt"></i> Alterar Status</h5>
                </div>
                <div class="form-group">
                    <select name="status" class="status-select" id="status-select">
                        <option value="pre" ${data.status === 'pre' ? 'selected' : ''}>Pré-Agendado</option>
                        <option value="agendado" ${data.status === 'agendado' ? 'selected' : ''}>Agendado</option>
                        <option value="finalizado" ${data.status === 'finalizado' ? 'selected' : ''}>Consulta finalizada!</option>
                        <option value="desistencia" ${data.status === 'desistencia' ? 'selected' : ''}>D - Desmarcação</option>
                        <option value="desistencia_remarcacao" ${data.status === 'desistencia_remarcacao' ? 'selected' : ''}>DCR - Desmarcação com reposição</option>
                        <option value="falta_remarcacao" ${data.status === 'falta_remarcacao' ? 'selected' : ''}>FCR - Falta com reposição</option>
                        <option value="falta_cobrada" ${data.status === 'falta_cobrada' ? 'selected' : ''}>FC - Falta cobrada</option>
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
`;
    const btnClose = container.querySelector('.modal-close');
    if (btnClose) {
        btnClose.addEventListener('click', fecharModalAgendamento);
    }
    // Adicionar eventos após renderizar o modal
    adicionarEventosStatus(agendamentoId, data.status);
    adicionarEventosGerais();
}
function fecharModalAgendamento() {
    const container = document.getElementById('agendamento-modal');
    if (!container) return;

    container.classList.remove('active');

    // opcional: limpar conteúdo após a animação
    setTimeout(() => {
        container.innerHTML = '';
    }, 300); // ajuste se tiver animação
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
        statusView.style.display = 'flex';
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
                    mostrarMensagem('Status atualizado com sucesso!', 'success');

                    // Voltar para modo visualização
                    statusForm.style.display = 'none';
                    statusView.style.display = 'flex';

                    // Atualizar na lista principal (se necessário)
                    atualizarStatusNaLista(agendamentoId, newStatus);
                } else {
                    mostrarMensagem('Erro ao atualizar status: ' + result.error, 'error');
                }
            } else {
                mostrarMensagem('Erro na requisição', 'error');
            }
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            mostrarMensagem('Erro ao atualizar status', 'error');
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
function ajustarAlturaCardsAgenda() {
    document.querySelectorAll('.paciente-span').forEach(card => {
        const slots = parseInt(card.dataset.slots || "1", 10);

        // pega a altura real do slot renderizado (1 linha)
        const tr = card.closest('tr');
        if (!tr) return;
        const rowH = tr.getBoundingClientRect().height;

        // pequena compensação por bordas do grid (ajuste fino)
        const ajuste = 1;

        card.style.height = ((rowH * slots) - ajuste) + "px";
    });
}

window.addEventListener("load", ajustarAlturaCardsAgenda);
window.addEventListener("resize", ajustarAlturaCardsAgenda);


// Adicionar ao seu agendaMatriz.js
function mostrarSessoesSimultaneas(profissionalId, horario, data) {
    // Fazer requisição para buscar sessões simultâneas
    fetch(`/api/sessoes-simultaneas/?profissional_id=${profissionalId}&horario=${horario}&data=${data}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert('Erro ao carregar sessões: ' + data.error);
                return;
            }

            // Criar modal para mostrar as sessões
            criarModalSessoes(data.sessoes, horario);
        })
        .catch(error => {
            console.error('Erro:', error);
            alert('Erro ao carregar sessões simultâneas');
        });
}

function criarModalSessoes(sessoes, horario) {
    // Remover modal anterior se existir
    const modalAnterior = document.querySelector('.sessoes-modal');
    if (modalAnterior) {
        modalAnterior.remove();
    }

    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'sessoes-modal';

    // Conteúdo do modal
    let html = `<div class="sessoes-content">
        <h3>${sessoes.length} Sessões Agendadas às ${horario}</h3>
        <div class="sessoes-lista">`;

    sessoes.forEach((sessao, index) => {
        html += `<div class="sessao-item" style="border-left-color: ${sessao.cor}">
            <h4>${sessao.paciente_nome}</h4>
            <h4>${sessao.id}</h4>
            <div class="sessao-info">
                <p><i class="fas fa-clock"></i> ${sessao.hora_inicio} - ${sessao.hora_fim}</p>`;

        if (sessao.sessao_atual) {
            html += `<p><i class="fas fa-layer-group"></i> Sessão ${sessao.sessao_atual} de ${sessao.total_sessoes}</p>`;
        }

        if (sessao.especialidade) {
            html += `<p><i class="fas fa-stethoscope"></i> ${sessao.especialidade}</p>`;
        }

        if (sessao.status) {
            html += `<p><i class="fas fa-door-open"></i> ${sessao.status}</p>`;
        }

        html += `</div>
            <button onclick="abrirDetalhesAgendamento(${sessao.id})" class="btn">
                Ver Detalhes
            </button>
        </div>`;
    });

    html += `</div>
        <button onclick="this.closest('.sessoes-modal').remove()" class="btn">
            Fechar
        </button>
    </div>`;

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Fechar modal ao clicar fora
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// URL da API (ajuste conforme sua configuração)
// Adicione esta função para configurar a URL base
function getApiBaseUrl() {
    return window.location.origin;
}