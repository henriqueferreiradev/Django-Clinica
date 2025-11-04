// core/static/core/js/api.js
document.addEventListener('DOMContentLoaded', function () {
    atualizarStatusProntuarios()
    listarProntuarios()
})

async function openPatientModal(pacienteId, agendamentoId, pacienteNome) {
    // abre o modal do paciente
    openModal('patientModal');

    // atualiza o nome do paciente
    document.getElementById("patientName").textContent = pacienteNome;

    // guarda os IDs dentro de atributos data
    const modal = document.getElementById('newProntuarioModal');
    const evolutionModal = document.getElementById('newEvolutionModal');
    const avaliacaoModal = document.getElementById('newAvaliacaoModal');

    modal.dataset.pacienteId = pacienteId;
    modal.dataset.agendamentoId = agendamentoId;

    evolutionModal.dataset.pacienteId = pacienteId;
    evolutionModal.dataset.agendamentoId = agendamentoId;

    avaliacaoModal.dataset.pacienteId = pacienteId;
    avaliacaoModal.dataset.agendamentoId = agendamentoId;

    console.log("IDs definidos:", {
        pacienteId: pacienteId,
        agendamentoId: agendamentoId,
        pacienteNome: pacienteNome
    });

    // ✅ CARREGA OS PRONTUÁRIOS DO PACIENTE CLICADO
    await listarProntuarios(pacienteId);

    // ✅ MUDA PARA A ABA PRONTUÁRIO
    switchTab('prontuario');
}
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

    console.log("Enviando dados:", dados);

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

    console.log("IDs capturados:", {
        pacienteId: pacienteId,
        agendamentoId: agendamentoId,
        profissionalId: profissionalId
    });

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

    console.log("Enviando dados da evolução:", dados);

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
    const modal = document.getElementById('newEvolutionModal');
    const profissionalId = document.getElementById("profissionalLogado").value;

    // ✅ CORRETO - Pegar os IDs do dataset do modal
    const pacienteId = modal.dataset.pacienteId || "";
    const agendamentoId = modal.dataset.agendamentoId || "";
    const naoSeAplica = document.getElementById('naoSeAplicaAvaliacao').checked;
    console.log("IDs capturados:", {
        pacienteId: pacienteId,
        agendamentoId: agendamentoId,
        profissionalId: profissionalId
    });

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
    

        if (!naoSeAplica)  {
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

    console.log("Enviando dados da avaliação:", dados);

    const res = await apiRequest('/api/salvar-avaliacao/', dados);
    if (res.success) {
        mostrarMensagem('Avaliação salva com sucesso');
        closeModal('newAvaliacaoModal');
        atualizarStatusProntuarios();
    } else {
        mostrarMensagem('Erro ao salvar evolução: ' + res.error, 'error');
    }
}


async function listarProntuarios(pacienteId = null) {
    // Se não receber pacienteId, tenta pegar do modal
    if (!pacienteId) {
        const modal = document.getElementById('newProntuarioModal');
        pacienteId = modal.dataset.pacienteId;
    }

    if (!pacienteId) {
        console.error('Nenhum paciente ID encontrado');
        return;
    }

    try {
        const response = await fetch(`/api/listar-prontuarios/${pacienteId}/`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar prontuários');
        }

        const data = await response.json();

        if (data.success) {
            renderizarListaProntuarios(data.prontuarios);
        } else {
            console.error('Erro na resposta:', data.error);
            mostrarMensagem('Erro ao carregar prontuários', 'error');
        }
    } catch (error) {
        console.error('Erro ao listar prontuários:', error);
        mostrarMensagem('Erro ao carregar prontuários', 'error');
    }
}


function renderizarListaProntuarios(prontuarios) {
    const container = document.querySelector('.prontuarios-list');

    if (!prontuarios || prontuarios.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-medical fa-2x mb-2 text-muted"></i>
                <p>Nenhum prontuário encontrado para este paciente.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = prontuarios.map(prontuario => `
        <div class="prontuario-item">
            <div class="prontuario-header">
                <div class="prontuario-info">
                    <h6>Data do prontuário - ${prontuario.data_completa}</h6>
                    <span class="text-muted small">Registrado por: ${prontuario.profissional_nome}</span>
                    <span class="text-muted small">Agendamento Nº ${prontuario.agendamento_atual_id} - ${prontuario.agendamento_atual} </span>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="openProntuarioModal(${prontuario.id})">
                    <i class="fas fa-eye me-1"></i> Leia Mais
                </button>
            </div>
        </div>
    `).join('');
}