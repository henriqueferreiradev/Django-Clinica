// core/static/core/js/api.js
document.addEventListener('DOMContentLoaded', function () {
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

            if (badgeProntuario, badgeEvolucao, badgeAvaliacao) {
                badgeProntuario.dataset.status = data.tem_prontuario ? "true" : "false";
                badgeEvolucao.dataset.status = data.tem_evolucao ? "true" : "false";
                badgeAvaliacao.dataset.status = data.tem_avaliacao ? "true" : "false";



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

    // ✅ CORRETO - Pegar os IDs do dataset do modal
    const pacienteId = modal.dataset.pacienteId || "";
    const agendamentoId = modal.dataset.agendamentoId || "";

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
        paciente_id: pacienteId, // ✅ AGORA CORRETO
        agendamento_id: agendamentoId, // ✅ AGORA CORRETO
        profissional_id: profissionalId,
        queixa_principal: document.getElementById('queixaPrincipalEvolucao').value,
        processo_terapeutico: document.getElementById('processoTerapeutico').value,
        condutas_tecnicas: document.getElementById('condutasTecnicas').value,
        resposta_paciente: document.getElementById('respostaPaciente').value,
        intercorrencias: document.getElementById('intercorrencias').value,
        dor_inicio: document.getElementById('dorInicio').value,
        dor_atual: document.getElementById('dorAtual').value,
        dor_observacoes: document.getElementById('dorObservacoes').value,
        amplitude_inicio: document.getElementById('amplitudeInicio').value,
        amplitude_atual: document.getElementById('amplitudeAtual').value,
        amplitude_observacoes: document.getElementById('amplitudeObservacoes').value,
        forca_inicio: document.getElementById('forcaInicio').value,
        forca_atual: document.getElementById('forcaAtual').value,
        forca_observacoes: document.getElementById('forcaObservacoes').value,
        postura_inicio: document.getElementById('posturaInicio').value,
        postura_atual: document.getElementById('posturaAtual').value,
        postura_observacoes: document.getElementById('posturaObservacoes').value,
        edema_inicio: document.getElementById('edemaInicio').value,
        edema_atual: document.getElementById('edemaAtual').value,
        edema_observacoes: document.getElementById('edemaObservacoes').value,
        avds_inicio: document.getElementById('avdsInicio').value,
        avds_atual: document.getElementById('avdsAtual').value,
        avds_observacoes: document.getElementById('avdsObservacoes').value,
        asp_emocionais_inicio: document.getElementById('emocionaisInicio').value,
        asp_emocionais_atual: document.getElementById('emocionaisAtual').value,
        asp_emocionais_observacoes: document.getElementById('emocionaisObservacoes').value,
        sintese_evolucao: document.getElementById('sinteseEvolucao').value,
        mensagem_paciente: document.getElementById('mensagemPaciente').value,
        explicacao_continuidade: document.getElementById('explicacaoContinuidade').value,
        reacoes_paciente: document.getElementById('reacoesPaciente').value,
        dor_expectativa: document.getElementById('dorExpectativa').value,
        dor_realidade: document.getElementById('dorRealidade').value,
        mobilidade_expectativa: document.getElementById('mobilidadeExpectativa').value,
        mobilidade_realidade: document.getElementById('mobilidadeRealidade').value,
        energia_expectativa: document.getElementById('energiaExpectativa').value,
        energia_realidade: document.getElementById('energiaRealidade').value,
        consciencia_expectativa: document.getElementById('conscienciaExpectativa').value,
        consciencia_realidade: document.getElementById('conscienciaRealidade').value,
        emocao_expectativa: document.getElementById('emocaoExpectativa').value,
        emocao_realidade: document.getElementById('emocaoRealidade').value,
        objetivos_ciclo: document.getElementById('objetivosCiclo').value,
        condutas_mantidas: document.getElementById('condutasMantidas').value,
        ajustes_plano: document.getElementById('ajustesPlano').value,
        treino_funcional: document.getElementById('treinoFuncional').checked,
        pilates_clinico: document.getElementById('pilatesClinico').checked,
        recovery: document.getElementById('recovery').checked,
        rpg: document.getElementById('rpg').checked,
        nutricao: document.getElementById('nutricao').checked,
        psicoterapia: document.getElementById('psicoterapia').checked,
        estetica: document.getElementById('estetica').checked,
        outro_complementar: document.getElementById('sugestaoOutro').checked,
        outro_complementar_texto: document.getElementById('sugestaoOutroTexto').value.trim(),
        observacoes_internas: document.getElementById('observacoesInternas').value,
        orientacoes_grupo: document.getElementById('orientacoesGrupo').value,
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
        // Anamnese / Histórico Clínico
        queixa_principal: document.getElementById('queixaPrincipalAvaliacao').value,
        inicio_problema: document.getElementById('inicioProblema').value,
        causa_problema: document.getElementById('causaProblema').value,

        // Histórico da doença atual
        dor_recente_antiga: document.getElementById('dorRecenteAntiga').value,
        episodios_anteriores: document.getElementById('episodiosAnteriores').value,
        tratamento_anterior: document.getElementById('tratamentoSim').checked,
        qual_tratamento: document.getElementById('qualTratamento').value,
        cirurgia_procedimento: document.getElementById('cirurgiaProcedimento').value,
        acompanhamento_medico: document.getElementById('acompanhamentoSim').checked,
        medico_especialidade: document.getElementById('medicoEspecialidade').value,
        diagnostico_medico: document.getElementById('diagnosticoMedico').value,
        uso_medicamentos: document.getElementById('usoMedicamentos').value,
        exames_trazidos: document.getElementById('examesSim').checked,
        tipo_exame: document.getElementById('tipoExame').value,
        historico_lesoes: document.getElementById('historicoLesoes').value,

        // Histórico pessoal e familiar
        doencas_previas: document.getElementById('doencasPrevias').value,
        cirurgias_previas: document.getElementById('cirurgiasPrevias').value,
        condicoes_geneticas: document.getElementById('condicoesGeneticas').value,
        historico_familiar: document.getElementById('historicoFamiliar').value,

        // Hábitos e estilo de vida
        qualidade_sono: document.querySelector('input[name="qualidadeSono"]:checked')?.value || '',
        horas_sono: document.getElementById('horasSono').value,
        alimentacao: document.querySelector('input[name="alimentacao"]:checked')?.value || '',
        nivel_atividade: document.querySelector('input[name="nivelAtividade"]:checked')?.value || '',
        tipo_exercicio: document.getElementById('tipoExercicio').value,
        nivel_estresse: document.getElementById('nivelEstresse').value,
        rotina_trabalho: document.getElementById('rotinaTrabalho').value,
        aspectos_emocionais: document.getElementById('aspectosEmocionais').value,

        // Sinais, sintomas e dor
        localizacao_dor: document.getElementById('localizacaoDor').value,
        tipo_dor_pontada: document.getElementById('dorPontada').checked,
        tipo_dor_queimacao: document.getElementById('dorQueimacao').checked,
        tipo_dor_peso: document.getElementById('dorPeso').checked,
        tipo_dor_choque: document.getElementById('dorChoque').checked,
        tipo_dor_outra: document.getElementById('dorOutra').checked,
        tipo_dor_outra_texto: document.getElementById('dorOutraTexto').value,

        intensidade_repouso: document.getElementById('intensidadeRepouso').value,
        intensidade_movimento: document.getElementById('intensidadeMovimento').value,
        intensidade_pior: document.getElementById('intensidadePior').value,

        fatores_agravam: document.getElementById('fatoresAgravam').value,
        fatores_aliviam: document.getElementById('fatoresAliviam').value,

        sinal_edema: document.getElementById('sinalEdema').checked,
        sinal_parestesia: document.getElementById('sinalParestesia').checked,
        sinal_rigidez: document.getElementById('sinalRigidez').checked,
        sinal_fraqueza: document.getElementById('sinalFraqueza').checked,
        sinal_compensacoes: document.getElementById('sinalCompensacoes').checked,
        sinal_outro: document.getElementById('sinalOutro').checked,
        sinal_outro_texto: document.getElementById('sinalOutroTexto').value,

        grau_inflamacao: document.querySelector('input[name="grauInflamacao"]:checked')?.value || '',

        // Exame físico e funcional
        inspecao_postura: document.getElementById('inspecaoPostura').value,
        compensacoes_corporais: document.getElementById('compensacoesCorporais').value,
        padrao_respiratorio: document.getElementById('padraoRespiratorio').value,
        palpacao: document.getElementById('palpacao').value,
        pontos_dor: document.getElementById('pontosDor').value,
        testes_funcionais: document.getElementById('testesFuncionais').value,
        outras_observacoes: document.getElementById('outrasObservacoes').value,

        // Diagnóstico Fisioterapêutico
        diagnostico_completo: document.getElementById('diagnosticoCompleto').value,
        grau_dor: document.getElementById('grauDor').value,
        limitacao_funcional: document.getElementById('limitaçãoFuncional').value,
        grau_inflamacao_num: document.getElementById('grauInflamacao').value,
        grau_edema: document.getElementById('grauEdema').value,
        receptividade: document.querySelector('input[name="receptividade"]:checked')?.value,
        autonomia_avd: document.querySelector('input[name="autonomiaAVD"]:checked')?.value,
        // Plano Terapêutico
        objetivo_geral: document.getElementById('objetivoGeral').value,
        objetivo_principal: document.getElementById('objetivoPrincipal').value,
        objetivo_secundario: document.getElementById('objetivoSecundario').value,
        pontos_atencao: document.getElementById('pontosAtencao').value,

        // Técnicas manuais
        tecnica_liberacao: document.getElementById('tecnicaLiberacao').checked,
        tecnica_mobilizacao: document.getElementById('tecnicaMobilizacao').checked,
        tecnica_dry_needling: document.getElementById('tecnicaDryNeedling').checked,
        tecnica_ventosa: document.getElementById('tecnicaVentosa').checked,
        tecnica_manipulacoes: document.getElementById('tecnicaManipulacoes').checked,
        tecnica_outras: document.getElementById('tecnicaOutras').checked,
        tecnica_outras_texto: document.getElementById('tecnicaOutrasTexto').value,

        // Recursos eletrofísicos
        recurso_aussie: document.getElementById('recursoAussie').checked,
        recurso_russa: document.getElementById('recursoRussa').checked,
        recurso_aussie_tens: document.getElementById('recursoAussieTens').checked,
        recurso_us: document.getElementById('recursoUS').checked,
        recurso_termo: document.getElementById('recursoTermo').checked,
        recurso_outro: document.getElementById('recursoOutro').checked,
        recurso_outro_texto: document.getElementById('recursoOutroTexto').value,

        // Cinesioterapia
        cinesio_fortalecimento: document.getElementById('cinesioFortalecimento').checked,
        cinesio_alongamento: document.getElementById('cinesioAlongamento').checked,
        cinesio_postural: document.getElementById('cinesioPostural').checked,
        cinesio_respiracao: document.getElementById('cinesioRespiração').checked,
        cinesio_mobilidade: document.getElementById('cinesioMobilidade').checked,
        cinesio_funcional: document.getElementById('cinesioFuncional').checked,

        descricao_plano: document.getElementById('descricaoPlano').value,

        medo_agulha: document.getElementById('medoAgulhaSim').checked,
        limiar_dor_baixo: document.getElementById('limiarDorSim').checked,
        fragilidade: document.getElementById('fragilidadeSim').checked,

        frequencia: document.getElementById('frequencia').value,
        duracao: document.getElementById('duracao').value,
        reavaliacao_sessao: document.getElementById('reavaliacaoSessao').value,

        // Prognóstico e orientações
        evolucao_primeira_sessao: document.getElementById('evolucaoPrimeiraSessao').value,
        evolucao_proximas_sessoes: document.getElementById('evolucaoProximasSessoes').value,
        expectativas_primeira_etapa: document.getElementById('expectativasPrimeiraEtapa').value,
        proximos_passos: document.getElementById('proximosPassos').value,
        sobre_orientacoes: document.getElementById('sobreOrientacoes').value,
        sono_rotina: document.getElementById('sonoRotina').value,
        postura_ergonomia: document.getElementById('posturaErgonomia').value,
        alimentacao_hidratacao: document.getElementById('alimentacaoHidratacao').value,
        exercicios_casa: document.getElementById('exerciciosCasa').value,
        aspectos_emocionais_espirituais: document.getElementById('aspectosEmocionaisEspirituais').value,

        observacoes_finais: document.getElementById('observacoesFinais').value
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