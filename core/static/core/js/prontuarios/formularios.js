// core/static/core/js/api.js
document.addEventListener('DOMContentLoaded', function () {

    atualizarStatusProntuarios()
    setupBadgeClickHandlers();
})
// Funções para controle de modais
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}
// Função principal para abrir modal e navegar para a aba específica
function openPatientModalWithTab(pacienteId, agendamentoId, pacienteNome, targetTab = null) {
    // Abre o modal do paciente
    openModal('patientModal');

    // Atualiza o nome do paciente
    document.getElementById("patientName").textContent = pacienteNome;

    // Atualiza os campos hidden com os IDs corretos
    document.getElementById('pacienteId').value = pacienteId;
    document.getElementById('agendamentoId').value = agendamentoId;

    // Guarda os IDs dentro de atributos data dos modais
    const modal = document.getElementById('newProntuarioModal');
    const evolutionModal = document.getElementById('newEvolutionModal');
    const avaliacaoModal = document.getElementById('newAvaliacaoModal');

    if (modal) {
        modal.dataset.pacienteId = pacienteId;
        modal.dataset.agendamentoId = agendamentoId;
    }

    if (evolutionModal) {
        evolutionModal.dataset.pacienteId = pacienteId;
        evolutionModal.dataset.agendamentoId = agendamentoId;
    }

    if (avaliacaoModal) {
        avaliacaoModal.dataset.pacienteId = pacienteId;
        avaliacaoModal.dataset.agendamentoId = agendamentoId;
    }

    // Se uma aba específica foi solicitada, navega para ela
    if (targetTab) {
        setTimeout(() => {
            switchTab(targetTab);

            // Chama a função correspondente baseada na aba
            if (targetTab === 'prontuario') {
                listarProntuarios(pacienteId, agendamentoId);
            }
            if (targetTab === 'evolucao') {
                listarEvolucoes(pacienteId, agendamentoId);
            }
            if (targetTab === 'analisefisio') {
                listarAvaliacoes(pacienteId, agendamentoId);
            }

        }, 100);
    } else {
        // Se não especificou aba, vai para prontuário e carrega os dados
        setTimeout(() => {
            switchTab('prontuario');
            listarProntuarios(pacienteId, agendamentoId);
        }, 100);
    }
}

function setupBadgeClickHandlers() {
    document.addEventListener('click', function (e) {
        // Verifica se o clique foi em uma badge
        const badge = e.target.closest('.status-badge');
        if (badge) {
            e.preventDefault();
            e.stopPropagation();

            const agendamentoId = badge.getAttribute('data-agendamento-id');
            const targetTab = badge.getAttribute('data-tab-target');

            // Encontra o paciente ID e nome a partir do agendamento
            const consultationItem = badge.closest('.consultation-item');
            const pacienteNome = consultationItem.querySelector('h5').textContent;

            // Aqui você precisaria obter o pacienteId real - ajuste conforme sua estrutura de dados
            // Por enquanto, usando um valor padrão ou do data-attribute se disponível
            const pacienteId = badge.getAttribute('data-paciente-id') || agendamentoId;

            // Abre o modal navegando diretamente para a aba desejada
            openPatientModalWithTab(pacienteId, agendamentoId, pacienteNome, targetTab);
        }
    });
}

// Versão alternativa mais específica para cada tipo de badge
function setupIndividualBadgeHandlers() {
    // Handler para badge de Prontuário
    document.querySelectorAll('.status-badge.prontuario').forEach(badge => {
        badge.addEventListener('click', function () {
            const agendamentoId = this.getAttribute('data-agendamento-id');
            // Sua lógica para obter pacienteId e nome
            openPatientModalWithTab(agendamentoId, agendamentoId, 'Nome do Paciente', 'prontuario');
        });
    });

    // Handler para badge de Evolução
    document.querySelectorAll('.status-badge.evolucao').forEach(badge => {
        badge.addEventListener('click', function () {
            const agendamentoId = this.getAttribute('data-agendamento-id');
            openPatientModalWithTab(agendamentoId, agendamentoId, 'Nome do Paciente', 'evolucao');
        });
    });

    // Handler para badge de Imagens
    document.querySelectorAll('.status-badge.imagens').forEach(badge => {
        badge.addEventListener('click', function () {
            const agendamentoId = this.getAttribute('data-agendamento-id');
            openPatientModalWithTab(agendamentoId, agendamentoId, 'Nome do Paciente', 'imagens');
        });
    });

    // Handler para badge de Avaliação
    document.querySelectorAll('.status-badge.avaliacao').forEach(badge => {
        badge.addEventListener('click', function () {
            const agendamentoId = this.getAttribute('data-agendamento-id');
            openPatientModalWithTab(agendamentoId, agendamentoId, 'Nome do Paciente', 'analisefisio');
        });
    });
}

// Função melhorada para alternar entre abas E carregar dados
function switchTab(tabId) {


    // Esconde todas as abas
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove a classe active de todos os botões de aba
    const tabButtons = document.querySelectorAll('.nav-link');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Ativa a aba selecionada
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Ativa o botão correspondente
    const correspondingButton = document.querySelector(`[onclick="switchTab('${tabId}')"]`);
    if (correspondingButton) {
        correspondingButton.classList.add('active');
    }

    // ✅ NOVO: Carrega os dados da aba quando ela é ativada
    carregarDadosAba(tabId);
}

// ✅ NOVA FUNÇÃO: Carrega dados específicos de cada aba
function carregarDadosAba(tabId) {

    // Pega os IDs do paciente e agendamento
    const pacienteId = document.getElementById('pacienteId').value;
    const agendamentoId = document.getElementById('agendamentoId').value;


    if (!pacienteId || pacienteId === 'undefined' || pacienteId === 'null') {
        console.warn("⚠️ Paciente ID não disponível para carregar dados da aba");
        return;
    }

    // Carrega os dados baseado na aba selecionada
    switch (tabId) {
        case 'prontuario':
            listarProntuarios(pacienteId, agendamentoId);
            break;

        case 'evolucao':
            listarEvolucoes(pacienteId, agendamentoId);
            break;

        case 'analisefisio':
            listarAvaliacoes(pacienteId, agendamentoId)
            break;

        case 'imagens':
            // Carregar imagens se tiver função
            break;

        default:
    }
}
// Inicializa os handlers quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function () {
    setupBadgeClickHandlers();
    // Ou use a versão alternativa:
    // setupIndividualBadgeHandlers();
});
window.onclick = function (event) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    });
}


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

async function travarBotoes() {
    const btnProntuario = document.getElementById('btn-salvar-prontuario')
    const btnEvolucao = document.getElementById('btn-salvar-evolucao')
    const btnAvaliacao = document.getElementById('btn-salvar-avaliacao')

    for (const block of statusBlocks) {
        const agendamentoId = block.dataset.agendamentoId;
        if (!agendamentoId) continue;

        try {
            const resp = await fetch(`/api/verificar-prontuario/${agendamentoId}/`);
            if (!resp.ok) continue;

            const data = await resp.json();


            if (btnAvaliacao, btnEvolucao, btnProntuario) {
                btnProntuario.dataset.status = data.tem_prontuario ? "true" : "false";
                btnEvolucao.dataset.status = data.tem_evolucao ? "true" : "false";
                btnAvaliacao.dataset.status = data.tem_avaliacao ? "true" : "false";



            }
        } catch (err) {
            console.error("Erro ao atualizar status:", err);
        }
    }

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
            const badgeAvaliacao = block.querySelector(".status-badge.avaliacao");

            if (badgeProntuario) {
                // Define o status baseado no prontuário
                if (data.tem_prontuario) {
                    if (data.prontuario_nao_se_aplica) {
                        badgeProntuario.dataset.status = "nao_se_aplica";
                    } else {
                        badgeProntuario.dataset.status = "true";
                    }
                } else {
                    badgeProntuario.dataset.status = "false";
                }
            }

            if (badgeEvolucao) {
                if (data.tem_evolucao) {
                    if (data.evolucao_nao_se_aplica) {
                        badgeEvolucao.dataset.status = "nao_se_aplica";
                    } else {
                        badgeEvolucao.dataset.status = "true";
                    }
                }

            } else {
                badgeEvolucao.dataset.status = 'false';
            }

            if (badgeAvaliacao) {
                if (data.tem_avaliacao) {
                    if (data.avaliacao_nao_se_aplica) {
                        badgeAvaliacao.dataset.status = "nao_se_aplica";
                    } else {
                        badgeAvaliacao.dataset.status = "true";
                    }
                }
            } else {
                badgeAvaliacao.dataset.status = 'false';
            }

        } catch (err) {
            console.error("Erro ao atualizar status:", err);
        }
    }
}
async function salvarProntuario() {
    const modal = document.getElementById('newProntuarioModal');
    const profissionalId = document.getElementById("profissionalLogado").value;
    const naoSeAplica = document.getElementById('naoSeAplicaProntuario').checked;

    const dados = {
        paciente_id: modal.dataset.pacienteId || "",
        profissional_id: profissionalId,
        agendamento_id: modal.dataset.agendamentoId || "",
        nao_se_aplica: naoSeAplica
    };


    if (!naoSeAplica) {
        dados.queixa_principal = document.getElementById('queixaPrincipal').value;
        dados.historia_doenca = document.getElementById('historiaDoenca').value;
        dados.exame_fisico = document.getElementById('exameFisico').value;
        dados.conduta = document.getElementById('conduta').value;
        dados.diagnostico = document.getElementById('diagnostico').value;
        dados.observacoes = document.getElementById('observacoes').value;
    }

    const res = await apiRequest('/api/salvar-prontuario/', dados);
    if (res.success) {
        const mensagem = naoSeAplica ? 'Prontuário salvo como "Não se aplica" com sucesso!' : 'Prontuário salvo com sucesso!';
        mostrarMensagem(mensagem);
        closeModal('newProntuarioModal');

        atualizarStatusProntuarios();
        document.getElementById('prontuarioForm').reset();
    } else {
        mostrarMensagem('Erro ao salvar prontuário: ' + res.error, 'error');
    }
}

async function salvarEvolucao() {
    const modal = document.getElementById('newEvolutionModal');
    const profissionalId = document.getElementById("profissionalLogado").value;

    const pacienteId = modal.dataset.pacienteId || "";
    const agendamentoId = modal.dataset.agendamentoId || "";
    const naoSeAplica = document.getElementById('naoSeAplicaEvolucao').checked;

    if (!pacienteId) {
        mostrarMensagem('Erro: Paciente não identificado', 'error');
        return;
    }


    const dados = {
        paciente_id: pacienteId,
        agendamento_id: agendamentoId,
        profissional_id: profissionalId,
        nao_se_aplica: naoSeAplica,
    }
    if (!naoSeAplica) {
        dados.queixa_principal = document.getElementById('queixaPrincipalEvolucao').value;
        dados.processo_terapeutico = document.getElementById('processoTerapeutico').value;
        dados.condutas_tecnicas = document.getElementById('condutasTecnicas').value;
        dados.resposta_paciente = document.getElementById('respostaPaciente').value;
        dados.intercorrencias = document.getElementById('intercorrencias').value;
        dados.dor_inicio = document.getElementById('dorInicio').value;
        dados.dor_atual = document.getElementById('dorAtual').value;
        dados.dor_observacoes = document.getElementById('dorObservacoes').value;
        dados.amplitude_inicio = document.getElementById('amplitudeInicio').value;
        dados.amplitude_atual = document.getElementById('amplitudeAtual').value;
        dados.amplitude_observacoes = document.getElementById('amplitudeObservacoes').value;
        dados.forca_inicio = document.getElementById('forcaInicio').value;
        dados.forca_atual = document.getElementById('forcaAtual').value;
        dados.forca_observacoes = document.getElementById('forcaObservacoes').value;
        dados.postura_inicio = document.getElementById('posturaInicio').value;
        dados.postura_atual = document.getElementById('posturaAtual').value;
        dados.postura_observacoes = document.getElementById('posturaObservacoes').value;
        dados.edema_inicio = document.getElementById('edemaInicio').value;
        dados.edema_atual = document.getElementById('edemaAtual').value;
        dados.edema_observacoes = document.getElementById('edemaObservacoes').value;
        dados.avds_inicio = document.getElementById('avdsInicio').value;
        dados.avds_atual = document.getElementById('avdsAtual').value;
        dados.avds_observacoes = document.getElementById('avdsObservacoes').value;
        dados.asp_emocionais_inicio = document.getElementById('emocionaisInicio').value;
        dados.asp_emocionais_atual = document.getElementById('emocionaisAtual').value;
        dados.asp_emocionais_observacoes = document.getElementById('emocionaisObservacoes').value;
        dados.sintese_evolucao = document.getElementById('sinteseEvolucao').value;
        dados.mensagem_paciente = document.getElementById('mensagemPaciente').value;
        dados.explicacao_continuidade = document.getElementById('explicacaoContinuidade').value;
        dados.reacoes_paciente = document.getElementById('reacoesPaciente').value;
        dados.dor_expectativa = document.getElementById('dorExpectativa').value;
        dados.dor_realidade = document.getElementById('dorRealidade').value;
        dados.mobilidade_expectativa = document.getElementById('mobilidadeExpectativa').value;
        dados.mobilidade_realidade = document.getElementById('mobilidadeRealidade').value;
        dados.energia_expectativa = document.getElementById('energiaExpectativa').value;
        dados.energia_realidade = document.getElementById('energiaRealidade').value;
        dados.consciencia_expectativa = document.getElementById('conscienciaExpectativa').value;
        dados.consciencia_realidade = document.getElementById('conscienciaRealidade').value;
        dados.emocao_expectativa = document.getElementById('emocaoExpectativa').value;
        dados.emocao_realidade = document.getElementById('emocaoRealidade').value;
        dados.objetivos_ciclo = document.getElementById('objetivosCiclo').value;
        dados.condutas_mantidas = document.getElementById('condutasMantidas').value;
        dados.ajustes_plano = document.getElementById('ajustesPlano').value;
        dados.treino_funcional = document.getElementById('treinoFuncional').checked;
        dados.pilates_clinico = document.getElementById('pilatesClinico').checked;
        dados.recovery = document.getElementById('recovery').checked;
        dados.rpg = document.getElementById('rpg').checked;
        dados.nutricao = document.getElementById('nutricao').checked;
        dados.psicoterapia = document.getElementById('psicoterapia').checked;
        dados.estetica = document.getElementById('estetica').checked;
        dados.outro_complementar = document.getElementById('sugestaoOutro').checked;
        dados.outro_complementar_texto = document.getElementById('sugestaoOutroTexto').value.trim();
        dados.observacoes_internas = document.getElementById('observacoesInternas').value;
        dados.orientacoes_grupo = document.getElementById('orientacoesGrupo').value;
    };



    const res = await apiRequest('/api/salvar-evolucao/', dados);
    if (res.success) {
        mostrarMensagem('Evolução salva com sucesso');
        closeModal('newEvolutionModal');
        atualizarStatusProntuarios();
    } else {
        mostrarMensagem('Erro ao salvar evolução: ' + res.error, 'error');
    }
}

async function salvarAvaliacao() {
    const modal = document.getElementById('newAvaliacaoModal');
    const profissionalId = document.getElementById("profissionalLogado").value;

    // ✅ CORRETO - Pegar os IDs do dataset do modal
    const pacienteId = modal.dataset.pacienteId || "";
    const agendamentoId = modal.dataset.agendamentoId || "";
    const naoSeAplica = document.getElementById('naoSeAplicaAvaliacao').checked;


    // Verificar se tem paciente_id (obrigatório)
    if (!pacienteId) {
        mostrarMensagem('Erro: Paciente não identificado', 'error');
        return;
    }
    const dados = {
        paciente_id: pacienteId,
        agendamento_id: agendamentoId,
        profissional_id: profissionalId,
        nao_se_aplica: naoSeAplica,
    }


    if (!naoSeAplica) {
        dados.queixa_principal = document.getElementById('queixaPrincipalAvaliacao').value;
        dados.inicio_problema = document.getElementById('inicioProblema').value;
        dados.causa_problema = document.getElementById('causaProblema').value;

        // Histórico da doença atual
        dados.dor_recente_antiga = document.getElementById('dorRecenteAntiga').value;
        dados.episodios_anteriores = document.getElementById('episodiosAnteriores').value;
        dados.tratamento_anterior = document.getElementById('tratamentoSim').checked;
        dados.qual_tratamento = document.getElementById('qualTratamento').value;
        dados.cirurgia_procedimento = document.getElementById('cirurgiaProcedimento').value;
        dados.acompanhamento_medico = document.getElementById('acompanhamentoSim').checked;
        dados.medico_especialidade = document.getElementById('medicoEspecialidade').value;
        dados.diagnostico_medico = document.getElementById('diagnosticoMedico').value;
        dados.uso_medicamentos = document.getElementById('usoMedicamentos').value;
        dados.exames_trazidos = document.getElementById('examesSim').checked;
        dados.tipo_exame = document.getElementById('tipoExame').value;
        dados.historico_lesoes = document.getElementById('historicoLesoes').value;

        // Histórico pessoal e familiar
        dados.doencas_previas = document.getElementById('doencasPrevias').value;
        dados.cirurgias_previas = document.getElementById('cirurgiasPrevias').value;
        dados.condicoes_geneticas = document.getElementById('condicoesGeneticas').value;
        dados.historico_familiar = document.getElementById('historicoFamiliar').value;

        // Hábitos e estilo de vida
        dados.qualidade_sono = document.querySelector('input[name="qualidadeSono"]:checked')?.value || '';
        dados.horas_sono = document.getElementById('horasSono').value;
        dados.alimentacao = document.querySelector('input[name="alimentacao"]:checked')?.value || '';
        dados.nivel_atividade = document.querySelector('input[name="nivelAtividade"]:checked')?.value || '';
        dados.tipo_exercicio = document.getElementById('tipoExercicio').value;
        dados.nivel_estresse = document.getElementById('nivelEstresse').value;
        dados.rotina_trabalho = document.getElementById('rotinaTrabalho').value;
        dados.aspectos_emocionais = document.getElementById('aspectosEmocionais').value;

        // Sinais, sintomas e dor
        dados.localizacao_dor = document.getElementById('localizacaoDor').value;
        dados.tipo_dor_pontada = document.getElementById('dorPontada').checked;
        dados.tipo_dor_queimacao = document.getElementById('dorQueimacao').checked;
        dados.tipo_dor_peso = document.getElementById('dorPeso').checked;
        dados.tipo_dor_choque = document.getElementById('dorChoque').checked;
        dados.tipo_dor_outra = document.getElementById('dorOutra').checked;
        dados.tipo_dor_outra_texto = document.getElementById('dorOutraTexto').value;

        dados.intensidade_repouso = document.getElementById('intensidadeRepouso').value;
        dados.intensidade_movimento = document.getElementById('intensidadeMovimento').value;
        dados.intensidade_pior = document.getElementById('intensidadePior').value;

        dados.fatores_agravam = document.getElementById('fatoresAgravam').value;
        dados.fatores_aliviam = document.getElementById('fatoresAliviam').value;

        dados.sinal_edema = document.getElementById('sinalEdema').checked;
        dados.sinal_parestesia = document.getElementById('sinalParestesia').checked;
        dados.sinal_rigidez = document.getElementById('sinalRigidez').checked;
        dados.sinal_fraqueza = document.getElementById('sinalFraqueza').checked;
        dados.sinal_compensacoes = document.getElementById('sinalCompensacoes').checked;
        dados.sinal_outro = document.getElementById('sinalOutro').checked;
        dados.sinal_outro_texto = document.getElementById('sinalOutroTexto').value;

        dados.grau_inflamacao = document.querySelector('input[name="grauInflamacao"]:checked')?.value || '';

        // Exame físico e funcional
        dados.inspecao_postura = document.getElementById('inspecaoPostura').value;
        dados.compensacoes_corporais = document.getElementById('compensacoesCorporais').value;
        dados.padrao_respiratorio = document.getElementById('padraoRespiratorio').value;
        dados.palpacao = document.getElementById('palpacao').value;
        dados.pontos_dor = document.getElementById('pontosDor').value;
        dados.testes_funcionais = document.getElementById('testesFuncionais').value;
        dados.outras_observacoes = document.getElementById('outrasObservacoes').value;

        // Diagnóstico Fisioterapêutico
        dados.diagnostico_completo = document.getElementById('diagnosticoCompleto').value;
        dados.grau_dor = document.getElementById('grauDor').value;
        dados.limitacao_funcional = document.getElementById('limitaçãoFuncional').value;
        dados.grau_inflamacao_num = document.getElementById('grauInflamacao').value;
        dados.grau_edema = document.getElementById('grauEdema').value;
        dados.receptividade = document.querySelector('input[name="receptividade"]:checked')?.value;
        dados.autonomia_avd = document.querySelector('input[name="autonomiaAVD"]:checked')?.value;
        // Plano Terapêutico
        dados.objetivo_geral = document.getElementById('objetivoGeral').value;
        dados.objetivo_principal = document.getElementById('objetivoPrincipal').value;
        dados.objetivo_secundario = document.getElementById('objetivoSecundario').value;
        dados.pontos_atencao = document.getElementById('pontosAtencao').value;

        // Técnicas manuais
        dados.tecnica_liberacao = document.getElementById('tecnicaLiberacao').checked;
        dados.tecnica_mobilizacao = document.getElementById('tecnicaMobilizacao').checked;
        dados.tecnica_dry_needling = document.getElementById('tecnicaDryNeedling').checked;
        dados.tecnica_ventosa = document.getElementById('tecnicaVentosa').checked;
        dados.tecnica_manipulacoes = document.getElementById('tecnicaManipulacoes').checked;
        dados.tecnica_outras = document.getElementById('tecnicaOutras').checked;
        dados.tecnica_outras_texto = document.getElementById('tecnicaOutrasTexto').value;

        // Recursos eletrofísicos
        dados.recurso_aussie = document.getElementById('recursoAussie').checked;
        dados.recurso_russa = document.getElementById('recursoRussa').checked;
        dados.recurso_aussie_tens = document.getElementById('recursoAussieTens').checked;
        dados.recurso_us = document.getElementById('recursoUS').checked;
        dados.recurso_termo = document.getElementById('recursoTermo').checked;
        dados.recurso_outro = document.getElementById('recursoOutro').checked;
        dados.recurso_outro_texto = document.getElementById('recursoOutroTexto').value;

        // Cinesioterapia
        dados.cinesio_fortalecimento = document.getElementById('cinesioFortalecimento').checked;
        dados.cinesio_alongamento = document.getElementById('cinesioAlongamento').checked;
        dados.cinesio_postural = document.getElementById('cinesioPostural').checked;
        dados.cinesio_respiracao = document.getElementById('cinesioRespiração').checked;
        dados.cinesio_mobilidade = document.getElementById('cinesioMobilidade').checked;
        dados.cinesio_funcional = document.getElementById('cinesioFuncional').checked;

        dados.descricao_plano = document.getElementById('descricaoPlano').value;

        dados.medo_agulha = document.getElementById('medoAgulhaSim').checked;
        dados.limiar_dor_baixo = document.getElementById('limiarDorSim').checked;
        dados.fragilidade = document.getElementById('fragilidadeSim').checked;

        dados.frequencia = document.getElementById('frequencia').value;
        dados.duracao = document.getElementById('duracao').value;
        dados.reavaliacao_sessao = document.getElementById('reavaliacaoSessao').value;

        // Prognóstico e orientações
        dados.evolucao_primeira_sessao = document.getElementById('evolucaoPrimeiraSessao').value;
        dados.evolucao_proximas_sessoes = document.getElementById('evolucaoProximasSessoes').value;
        dados.expectativas_primeira_etapa = document.getElementById('expectativasPrimeiraEtapa').value;
        dados.proximos_passos = document.getElementById('proximosPassos').value;
        dados.sobre_orientacoes = document.getElementById('sobreOrientacoes').value;
        dados.sono_rotina = document.getElementById('sonoRotina').value;
        dados.postura_ergonomia = document.getElementById('posturaErgonomia').value;
        dados.alimentacao_hidratacao = document.getElementById('alimentacaoHidratacao').value;
        dados.exercicios_casa = document.getElementById('exerciciosCasa').value;
        dados.aspectos_emocionais_espirituais = document.getElementById('aspectosEmocionaisEspirituais').value;

        dados.observacoes_finais = document.getElementById('observacoesFinais').value;
    };



    const res = await apiRequest('/api/salvar-avaliacao/', dados);
    if (res.success) {
        mostrarMensagem('Avaliação salva com sucesso');
        closeModal('newAvaliacaoModal');
        atualizarStatusProntuarios();
    } else {
        mostrarMensagem('Erro ao salvar evolução: ' + res.error, 'error');
    }
}

async function listarProntuarios(pacienteId = null, agendamentoId = null) {


    // CORREÇÃO: Buscar os IDs corretamente dos campos hidden
    if (!pacienteId) {
        const pacienteIdField = document.getElementById('pacienteId');
        pacienteId = pacienteIdField ? pacienteIdField.value : null;
    }

    if (!agendamentoId) {
        const agendamentoIdField = document.getElementById('agendamentoId');
        agendamentoId = agendamentoIdField ? agendamentoIdField.value : null;
    }


    // CORREÇÃO: Verificar se os IDs são válidos e diferentes
    if (!pacienteId || pacienteId === 'undefined' || pacienteId === 'null') {
        console.error('Paciente ID inválido:', pacienteId);
        mostrarMensagem('Erro: Paciente não identificado', 'error');
        return;
    }

    const container = document.getElementById('listProntuarios');
    if (!container) {
        console.error('Container de prontuários não encontrado');
        return;
    }

    try {
        // Mostrar loading
        container.innerHTML = `
            <div class="empty-state">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Carregando prontuários...
            </div>
        `;

        // DEBUG: Verificar a URL que será chamada
        const url = `/api/listar-prontuarios/${pacienteId}`;


        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();


        if (data.success && data.prontuarios && Array.isArray(data.prontuarios) && data.prontuarios.length > 0) {

            renderizarListaProntuarios(data.prontuarios);
        } else {

            container.innerHTML = `
                <div class="empty-state">
                     <p>Nenhum prontuário encontrado para este paciente.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao listar prontuários:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                Erro de conexão ao carregar prontuários: ${error.message}
            </div>
        `;
    }
}

function renderizarListaProntuarios(prontuarios) {
    const container = document.getElementById('listProntuarios');
    if (!container) {
        console.error('Container listProntuarios não encontrado!');
        return;
    }

    if (!prontuarios || !Array.isArray(prontuarios) || prontuarios.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical fa-2x mb-2 text-muted"></i>
                <p>Nenhum prontuário encontrado para este paciente.</p>
            </div>
        `;
        return;
    }



    const html = prontuarios.map(prontuario => `
        <div class="prontuario-item">
            <div class="prontuario-header">
                <div class="prontuario-info">
                    <h6>Data do prontuário - ${prontuario.data_completa}</h6>
                    <span class="text-muted small">Registrado por: ${prontuario.profissional_nome}</span>
                    <span class="text-muted small">Agendamento Nº ${prontuario.agendamento_atual_id} - ${prontuario.agendamento_atual}</span>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="renderizarDetalhesProntuario(${prontuario.agendamento_atual_id})">
                    <i class="fas fa-eye me-1"></i> Leia Mais
                </button>
            </div>
        </div>
    `).join('');


    container.innerHTML = html;

}



async function listarEvolucoes(pacienteId = null, agendamentoId = null) {


    // Buscar os IDs corretamente dos campos hidden
    if (!pacienteId) {
        const pacienteIdField = document.getElementById('pacienteId');
        pacienteId = pacienteIdField ? pacienteIdField.value : null;
    }

    if (!agendamentoId) {
        const agendamentoIdField = document.getElementById('agendamentoId');
        agendamentoId = agendamentoIdField ? agendamentoIdField.value : null;
    }



    if (!pacienteId || pacienteId === 'undefined' || pacienteId === 'null') {
        console.error('Paciente ID inválido:', pacienteId);
        mostrarMensagem('Erro: Paciente não identificado', 'error');
        return;
    }

    // CORREÇÃO: Container correto para evoluções
    const container = document.getElementById('listEvolucoes');
    if (!container) {
        console.error('Container de evoluções não encontrado');
        return;
    }

    try {
        // Mostrar loading
        container.innerHTML = `
            <div class="empty-state">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Carregando evoluções...
            </div>
        `;

        // CORREÇÃO: URL correta para evoluções
        const url = `/api/listar-evolucoes/${pacienteId}`;


        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();


        // CORREÇÃO: Verificar array de evoluções
        if (data.success && data.evolucoes && Array.isArray(data.evolucoes) && data.evolucoes.length > 0) {

            renderizarListaEvolucoes(data.evolucoes);
        } else {

            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line fa-2x mb-2 text-muted"></i>
                    <p>Nenhuma evolução encontrada para este paciente.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao listar evoluções:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                Erro de conexão ao carregar evoluções: ${error.message}
            </div>
        `;
    }
}

function renderizarListaEvolucoes(evolucoes) {
    // CORREÇÃO: Container correto para evoluções
    const container = document.getElementById('listEvolucoes');


    if (!container) {
        console.error('Container listEvolucoes não encontrado!');
        return;
    }

    if (!evolucoes || !Array.isArray(evolucoes) || evolucoes.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                 
                <p>Nenhuma evolução encontrada para este paciente.</p>
            </div>
        `;
        return;
    }



    // CORREÇÃO: HTML específico para evoluções
    const html = evolucoes.map(evolucao => `
        <div class="prontuario-item">
            <div class="prontuario-header">
                <div class="prontuario-info">
                    <h6>Evolução - ${evolucao.data_completa}</h6>
                    <span class="text-muted small">Registrado por: ${evolucao.profissional_nome}</span>
                    <span class="text-muted small">Agendamento Nº ${evolucao.agendamento_atual_id} - ${evolucao.agendamento_atual}</span>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="renderizarDetalhesEvolucao(${evolucao.agendamento_atual_id})">
                    <i class="fas fa-eye me-1"></i> Leia Mais
                </button>
            </div>
            <div class="prontuario-preview">
                <p><strong>Resumo:</strong> ${evolucao.sintese_evolucao || 'Sem resumo disponível'}</p>
            </div>
        </div>
    `).join('');


    container.innerHTML = html;

}



async function listarAvaliacoes(pacienteId = null, agendamentoId = null) {


    // Buscar os IDs corretamente dos campos hidden
    if (!pacienteId) {
        const pacienteIdField = document.getElementById('pacienteId');
        pacienteId = pacienteIdField ? pacienteIdField.value : null;
    }

    if (!agendamentoId) {
        const agendamentoIdField = document.getElementById('agendamentoId');
        agendamentoId = agendamentoIdField ? agendamentoIdField.value : null;
    }



    if (!pacienteId || pacienteId === 'undefined' || pacienteId === 'null') {
        console.error('Paciente ID inválido:', pacienteId);
        mostrarMensagem('Erro: Paciente não identificado', 'error');
        return;
    }

    // CORREÇÃO: Container correto para evoluções
    const container = document.getElementById('listAvaliacoes');
    if (!container) {
        console.error('Container de avaliações não encontrado');
        return;
    }

    try {
        // Mostrar loading
        container.innerHTML = `
            <div class="empty-state">
                <div class="spinner-border spinner-border-sm me-2" role="status"></div>
                Carregando avaliações...
            </div>
        `;

        // CORREÇÃO: URL correta para evoluções
        const url = `/api/listar-avaliacoes/${pacienteId}`;


        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            }
        });

        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }

        const data = await response.json();

        // CORREÇÃO: Verificar array de evoluções
        if (data.success && data.avaliacoes && Array.isArray(data.avaliacoes) && data.avaliacoes.length > 0) {
            renderizarListaAvaliacoes(data.avaliacoes);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line fa-2x mb-2 text-muted"></i>
                    <p>Nenhuma avaliação encontrada para este paciente.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Erro ao listar evoluções:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle text-danger me-2"></i>
                Erro de conexão ao carregar evoluções: ${error.message}
            </div>
        `;
    }
}
function renderizarListaAvaliacoes(avaliacoes) {
    // ✅ CORREÇÃO: Container correto para AVALIAÇÕES
    const container = document.getElementById('listAvaliacoes');

    if (!container) {
        console.error('Container listAvaliacoes não encontrado!');
        return;
    }

    if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clipboard-check fa-2x mb-2 text-muted"></i>
                <p>Nenhuma avaliação encontrada para este paciente.</p>
            </div>
        `;
        return;
    }



    const html = avaliacoes.map(avaliacao => `
        <div class="prontuario-item">
            <div class="prontuario-header">
                <div class="prontuario-info">
                    <h6>Avaliação - ${avaliacao.data_completa}</h6> <!-- ✅ "Avaliação" em vez de "Evolução" -->
                    <span class="text-muted small">Registrado por: ${avaliacao.profissional_nome}</span>
                    <span class="text-muted small">Agendamento Nº ${avaliacao.agendamento_atual_id} - ${avaliacao.agendamento_atual}</span>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="openAvaliacaoModal(${avaliacao.id})"> <!-- ✅ Função correta -->
                    <i class="fas fa-eye me-1"></i> Leia Mais
                </button>
            </div>
            <div class="prontuario-preview">
                <p><strong>Queixa Principal:</strong> ${avaliacao.queixa_principal || 'Sem informação'}</p>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;

}


async function renderizarDetalhesProntuario(agendamentoId = null) {

    console.log('abriu aqui')
    openModal('viewProntuarioModal');

    await new Promise(resolve => setTimeout(resolve, 100));


    if (!agendamentoId) {
        const agendamentoIdField = document.getElementById('agendamentoId');
        agendamentoId = agendamentoIdField ? agendamentoIdField.value : null;
    }

    // CORREÇÃO: Container correto para evoluções
    const container = document.getElementById('prontuarioDetalhes');
    if (!container) {
        console.error('Container de avaliações não encontrado');
        return;
    }

    const res = await apiRequest(`/api/detalhe-prontuarios/${agendamentoId}/`);
    if (res.success && res.prontuarios && res.prontuarios.length > 0) {
        const prontuario = res.prontuarios[0]
        console.log(res, agendamentoId)
        container.innerHTML = `<div class="prontuario-meta mb-4">
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>Data:</strong> <span>${prontuario.data}</span>
                                <strong>Pacote:</strong> <span">${prontuario.pacote}</span=></p>
                                <p><strong>Registrado por:</strong> <span id="viewProntuarioAutor">${prontuario.profissional_nome}</span>
                                </p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>Paciente:</strong> <span id="viewProntuarioPaciente">${prontuario.nome_paciente}</span>
                                </p>
                            </div>
                        </div>
                    </div>
  
                    <div class="prontuario-content">
                        <div class="info-section mb-4">
                            <h6 class="section-title habitos-col">Queixa Principal</h6>
                            <div class="section-content" id="viewQueixaPrincipal">
                                        ${prontuario.queixa_principal
                ? prontuario.queixa_principal
                : '<span class="text-muted">Não informado</span>'
            }
                            </div>
                        </div>

                        <div class="info-section mb-4">
                            <h6 class="section-title habitos-col">Conduta durante a sessão</h6>
                            <div class="section-content" id="viewHistoriaDoenca">
                                                                        ${prontuario.conduta
                ? prontuario.conduta
                : '<span class="text-muted">Não informado</span>'
            }
                            </div>
                        </div>

                        <div class="info-section mb-4">
                            <h6 class="section-title habitos-col">Feedback do Paciente</h6>
                            <div class="section-content" id="viewExameFisico">
                                                                        ${prontuario.feedback_paciente
                ? prontuario.feedback_paciente
                : '<span class="text-muted">Não informado</span>'
            }
                            </div>
                        </div>

                        <div class="info-section mb-4">
                            <h6 class="section-title habitos-col">Evolução</h6>
                            <div class="section-content" id="viewConduta">
                                                                                                        ${prontuario.evolucao
                ? prontuario.evolucao
                : '<span class="text-muted">Não informado</span>'
            }
                            </div>
                        </div>

                        <div class="info-section mb-4">
                            <h6 class="section-title habitos-col">Diagnóstico</h6>
                            <div class="section-content" id="viewDiagnostico">
                                                                                                        ${prontuario.diagnostico
                ? prontuario.diagnostico
                : '<span class="text-muted">Não informado</span>'
            }
                            </div>
                        </div>

                        <div class="info-section">
                            <h6 class="section-title habitos-col">Observações</h6>
                            <div class="section-content" id="viewObservacoes">
                                                                                                    ${prontuario.observacoes
                ? prontuario.observacoes
                : '<span class="text-muted">Não informado</span>'
            }
                            </div>
                        </div>
                    </div>
                </div>`

    }

}






async function renderizarDetalhesEvolucao(agendamentoId = null) {

    console.log('abriu aqui')
    openModal('viewEvolutionModal');

    await new Promise(resolve => setTimeout(resolve, 100));


    if (!agendamentoId) {
        const agendamentoIdField = document.getElementById('agendamentoId');
        agendamentoId = agendamentoIdField ? agendamentoIdField.value : null;
    }

    // CORREÇÃO: Container correto para evoluções
    const container = document.getElementById('evolucaoDetalhes');
    if (!container) {
        console.error('Container de avaliações não encontrado');
        return;
    }

    const res = await apiRequest(`/api/detalhe-evolucoes/${agendamentoId}/`);
    if (res.success && res.evolucoes && res.evolucoes.length > 0) {
        const evolucao = res.evolucoes[0]
        console.log(res, agendamentoId)
        container.innerHTML = `
                    <div class="habitos-grid">
                        <h6 class="section-title habitos-col">2. Evolução do estado de saúde e tratamento</h6>

                        <div class="habitos-col">
                            <label class="form-label">Queixa principal inicial</label>
                            <div class="section-content" id="viewQueixaPrincipalEvolucao">
                            ${evolucao.queixa_principal_inicial ? evolucao.queixa_principal_inicial : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Resumo do processo terapêutico até o momento</label>
                            <div class="section-content" id="viewProcessoTerapeutico">
                            ${evolucao.processo_terapeutico ? evolucao.processo_terapeutico : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Condutas e técnicas aplicadas neste atendimento</label>
                            <div class="section-content" id="viewCondutasTecnicas">
                            ${evolucao.condutas_tecnicas ? evolucao.condutas_tecnicas : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Resposta do paciente ao tratamento</label>
                            <div class="section-content" id="viewRespostaPaciente">
                            ${evolucao.resposta_paciente ? evolucao.resposta_paciente : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Intercorrências observadas</label>
                            <div class="section-content" id="viewIntercorrencias">
                            ${evolucao.intercorrencias ? evolucao.intercorrencias : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- 3. Avaliação parcial do progresso -->
                    <div class="mb-4">
                        <h6 class="section-title habitos-col">3. Avaliação parcial do progresso (Mini reavaliação)</h6>

                        <div class="habitos-grid-2">
                            <div class="habitos-col">
                                <label class="form-label">Dor (0-10)</label>
                                <div class="section-content">
                                    <div><strong>Início:</strong> <span id="viewDorInicio">${evolucao.dor_inicio ? evolucao.dor_inicio : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Atual:</strong> <span id="viewDorAtual">${evolucao.dor_atual ? evolucao.dor_atual : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Observações:</strong> <span id="viewDorAtual">${evolucao.dor_observacoes ? evolucao.dor_observacoes : '<span class="text-muted">Não informado</span>'}</span></div>
                                 </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">Amplitude de movimento</label>
                                <div class="section-content">
                                    <div><strong>Início:</strong> <span id="viewAmplitudeInicio">${evolucao.amplitude_inicio ? evolucao.amplitude_inicio : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Atual:</strong> <span id="viewAmplitudeAtual">${evolucao.amplitude_atual ? evolucao.amplitude_atual : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Observações:</strong> <span id="viewAmplitudeAtual">${evolucao.amplitude_observacoes ? evolucao.amplitude_observacoes : '<span class="text-muted">Não informado</span>'}</span></div>
                                 </div>
                            </div>
                        </div>

                        <div class="habitos-grid-2">
                            <div class="habitos-col">
                                <label class="form-label">Força muscular (0-5)</label>
                                <div class="section-content">
                                    <div><strong>Início:</strong> <span id="viewForcaInicio">${evolucao.forca_inicio ? evolucao.forca_inicio : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Atual:</strong> <span id="viewForcaAtual">${evolucao.forca_atual ? evolucao.forca_atual : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Observações:</strong> <span id="viewForcaAtual">${evolucao.forca_observacoes ? evolucao.forca_observacoes : '<span class="text-muted">Não informado</span>'}</span></div>
                                 </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">Postura e controle motor (0-5)</label>
                                <div class="section-content">
                                    <div><strong>Início:</strong> <span id="viewPosturaInicio">${evolucao.postura_inicio ? evolucao.postura_inicio : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Atual:</strong> <span id="viewPosturaAtual">${evolucao.postura_atual ? evolucao.postura_atual : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Observações:</strong> <span id="viewPosturaAtual">${evolucao.postura_observacoes ? evolucao.postura_observacoes : '<span class="text-muted">Não informado</span>'}</span></div>
                                </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">Edema (0-5)</label>
                                <div class="section-content">
                                    <div><strong>Início:</strong> <span id="viewEdemaInicio">${evolucao.edema_inicio ? evolucao.edema_inicio : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Atual:</strong> <span id="viewEdemaAtual">${evolucao.edema_atual ? evolucao.edema_atual : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Observações:</strong> <span id="viewEdemaAtual">${evolucao.edema_observacoes ? evolucao.edema_observacoes : '<span class="text-muted">Não informado</span>'}</span></div>
                                    
                                     
                                </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">AVDS (0-5)</label>
                                <div class="section-content">
                                    <div><strong>Início:</strong> <span id="viewEdemaInicio">${evolucao.avds_inicio ? evolucao.avds_inicio : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Atual:</strong> <span id="viewEdemaAtual">${evolucao.avds_atual ? evolucao.avds_atual : '<span class="text-muted">Não informado</span>'}</span></div>
                                    <div><strong>Observacoes:</strong> <span id="viewEdemaAtual">${evolucao.avds_observacoes ? evolucao.avds_observacoes : '<span class="text-muted">Não informado</span>'}</span></div>
                                     
                                </div>
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Síntese da evolução</label>
                            <div class="section-content" id="viewSinteseEvolucao">
                            ${evolucao.sintese_evolucao ? evolucao.sintese_evolucao : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- 4. Orientação ao Paciente -->
                    <div class="mb-4">
                        <h6 class="section-title habitos-col">4. Orientação ao Paciente</h6>

                        <div class="habitos-col">
                            <label class="form-label">Mensagem técnica e emocional transmitida</label>
                            <div class="section-content" id="viewMensagemPaciente">
                            ${evolucao.mensagem_paciente ? evolucao.mensagem_paciente : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Explicação sobre continuidade</label>
                            <div class="section-content" id="viewExplicacaoContinuidade">
                            ${evolucao.explicacao_continuidade ? evolucao.explicacao_continuidade : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Reações e entendimento do paciente</label>
                            <div class="section-content" id="viewExplicacaoContinuidade">
                            ${evolucao.reacoes_paciente ? evolucao.reacoes_paciente : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>
                    </div>

                    <!-- 5. Expectativa x Realidade -->
                    <div class="mb-4">
                        <h6 class="section-title habitos-col">5. Expectativa x Realidade da Fisioterapeuta</h6>

                        <div class="habitos-grid-2">
                            <div class="habitos-col">
                                <label class="form-label">Nível de dor e conforto</label>
                                <div class="section-content">
                                    <strong>Expectativa:</strong> <span id="viewDorExpectativa">${evolucao.dor_expectativa ? evolucao.dor_expectativa : '<span class="text-muted">Não informado</span>'}</span><br>
                                    <strong>Realidade:</strong> <span id="viewDorRealidade">${evolucao.dor_realidade ? evolucao.dor_realidade : '<span class="text-muted">Não informado</span>'}</span>
                                </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">Mobilidade e função</label>
                                <div class="section-content">
                                    <strong>Expectativa:</strong> <span id="viewMobilidadeExpectativa">${evolucao.mobilidade_expectativa ? evolucao.mobilidade_expectativa : '<span class="text-muted">Não informado</span>'}</span><br>
                                    <strong>Realidade:</strong> <span id="viewMobilidadeRealidade">${evolucao.mobilidade_realidade ? evolucao.mobilidade_realidade : '<span class="text-muted">Não informado</span>'}</span>
                                </div>
                            </div>
                         

                            <div class="habitos-col">
                                <label class="form-label">Energia e disposição</label>
                                <div class="section-content">
                                    <strong>Expectativa:</strong> <span id="viewEnergiaExpectativa">${evolucao.energia_expectativa ? evolucao.energia_expectativa : '<span class="text-muted">Não informado</span>'}</span><br>
                                    <strong>Realidade:</strong> <span id="viewEnergiaRealidade">${evolucao.energia_realidade ? evolucao.energia_realidade : '<span class="text-muted">Não informado</span>'}</span>
                                </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">Consciência corporal / postura</label>
                                <div class="section-content">
                                    <strong>Expectativa:</strong> <span id="viewConscienciaExpectativa">${evolucao.consciencia_expectativa ? evolucao.consciencia_expectativa : '<span class="text-muted">Não informado</span>'}</span><br>
                                    <strong>Realidade:</strong> <span id="viewConscienciaRealidade">${evolucao.consciencia_realidade ? evolucao.consciencia_realidade : '<span class="text-muted">Não informado</span>'}</span>
                                </div>
                            </div>

                            <div class="habitos-col">
                                <label class="form-label">Emoção / confiança / autoestima</label>
                                <div class="section-content">
                                    <strong>Expectativa:</strong> <span id="viewEmocaoExpectativa">${evolucao.emocao_expectativa ? evolucao.emocao_expectativa : '<span class="text-muted">Não informado</span>'}</span><br>
                                    <strong>Realidade:</strong> <span id="viewEmocaoRealidade">${evolucao.emocao_realidade ? evolucao.emocao_realidade : '<span class="text-muted">Não informado</span>'}</span>
                                </div>
                            </div>
                        
                    </div>

                    <!-- 6. Próximos passos -->
                    <div class="mb-4">
                        <h6 class="section-title habitos-col">6. Próximos passos e novo Plano Terapêutico</h6>

                        <div class="habitos-col">
                            <label class="form-label">Objetivos para o novo ciclo</label>
                            <div class="section-content" id="viewObjetivosCiclo">
                            ${evolucao.objetivos_ciclo ? evolucao.objetivos_ciclo : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Condutas a serem mantidas</label>
                            <div class="section-content" id="viewCondutasMantidas">
                            ${evolucao.condutas_mantidas ? evolucao.condutas_mantidas : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>

                        <div class="habitos-col">
                            <label class="form-label">Ajustes necessários no plano terapêutico</label>
                            <div class="section-content" id="viewAjustesMantidas">
                            ${evolucao.ajustes_plano ? evolucao.ajustes_plano : '<span class="text-muted">Não informado</span>'}
                            </div>
                        </div>
                    </div>

 
            <div class="habitos-col">
                <label class="form-label">Sugestões Complementares</label>
                <div class="section-content">
                    <div class="sugestoes-badges">
                        ${evolucao.treino_funcional ? '<span class="badge bg-success me-2 mb-2">Treino Funcional</span>' : ''}
                        ${evolucao.pilates_clinico ? '<span class="badge bg-success me-2 mb-2">Pilates Clínico</span>' : ''}
                        ${evolucao.recovery ? '<span class="badge bg-success me-2 mb-2">Recovery</span>' : ''}
                        ${evolucao.rpg ? '<span class="badge bg-success me-2 mb-2">RPG</span>' : ''}
                        ${evolucao.nutricao ? '<span class="badge bg-success me-2 mb-2">Nutrição</span>' : ''}
                        ${evolucao.psicoterapia ? '<span class="badge bg-success me-2 mb-2">Psicoterapia</span>' : ''}
                        ${evolucao.estetica ? '<span class="badge bg-success me-2 mb-2">Estética</span>' : ''}
                        ${evolucao.outro_complementar ? `<span class="badge bg-info me-2 mb-2">Outro: ${evolucao.outro_complementar_texto || ''}</span>` : ''}
                    </div>
                    ${Object.values(evolucao).filter(val => typeof val === 'boolean' && val).length === 0 ? '<span class="text-muted">Nenhuma sugestão complementar</span>' : ''}
                </div>
            </div>
 
    </div>`

    }

}