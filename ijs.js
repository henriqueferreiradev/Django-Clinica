(function () {
    // ------------------------------------------------------------
    // BASE DE DADOS DOS RELATÓRIOS (conforme especificação)
    // ------------------------------------------------------------
    const relatorios = [
        // PACIENTES
        { setor: "PACIENTES", icon: "fas fa-user-injured", nome: "Relatório de Pacientes Ativos", desc: "Pacientes com status ativo na clínica", slug: "pacientes-ativos", extra: [] },
        { setor: "PACIENTES", icon: "fas fa-user-slash", nome: "Pacientes Inativos", desc: "Pacientes com cadastro inativo", slug: "pacientes-inativos", extra: [] },
        { setor: "PACIENTES", icon: "fas fa-calendar-times", nome: "Pacientes sem comparecimento", desc: "Nunca compareceram ou agendamentos não realizados", slug: "pacientes-sem-comparecimento", extra: [] },
        { setor: "PACIENTES", icon: "fas fa-clock", nome: "Pacientes que não aparecem há X dias", desc: "Filtrar por dias desde último atendimento", slug: "pacientes-ausentes", extra: ['dias'] },
        { setor: "PACIENTES", icon: "fas fa-star", nome: "Status mensal (Plus, VIP, Premium)", desc: "Distribuição de categorias", slug: "pacientes-status", extra: ['status'] },
        { setor: "PACIENTES", icon: "fas fa-exclamation-triangle", nome: "Pacientes com pendências", desc: "Pendências financeiras ou documentais", slug: "pacientes-pendencias", extra: [] },

        // PROFISSIONAIS
        { setor: "PROFISSIONAIS", icon: "fas fa-user-md", nome: "Produtividade mensal", desc: "Atendimentos por profissional", slug: "produtividade", extra: ['profissional'] },
        { setor: "PROFISSIONAIS", icon: "fas fa-hourglass-half", nome: "Horas trabalhadas", desc: "Total de horas no período", slug: "horas-trabalhadas", extra: ['profissional'] },
        { setor: "PROFISSIONAIS", icon: "fas fa-users", nome: "Relatório de ajudantes", desc: "Atividades de estagiários/auxiliares", slug: "ajudantes", extra: [] },
        { setor: "PROFISSIONAIS", icon: "fas fa-calendar-minus", nome: "Faltas e ausências", desc: "Frequência e justificativas", slug: "faltas", extra: ['profissional'] },
        { setor: "PROFISSIONAIS", icon: "fas fa-chart-simple", nome: "Comparativo por setor (Fisio vs Personal)", desc: "Desempenho entre áreas", slug: "comparativo-setor", extra: ['setor'] },

        // AGENDA
        { setor: "AGENDA", icon: "fas fa-calendar-check", nome: "Taxa de ocupação", desc: "% de horários preenchidos", slug: "taxa-ocupacao", extra: [] },
        { setor: "AGENDA", icon: "fas fa-ban", nome: "Cancelamentos", desc: "Listagem de cancelamentos no período", slug: "cancelamentos", extra: [] },
        { setor: "AGENDA", icon: "fas fa-user-clock", nome: "No-shows", desc: "Pacientes que não compareceram", slug: "no-shows", extra: [] },
        { setor: "AGENDA", icon: "fas fa-chair", nome: "Horários ociosos", desc: "Períodos sem agendamento", slug: "horarios-ociosos", extra: [] },

        // FINANCEIRO
        { setor: "FINANCEIRO", icon: "fas fa-dollar-sign", nome: "Receita por período", desc: "Faturamento bruto", slug: "receita", extra: [] },
        { setor: "FINANCEIRO", icon: "fas fa-file-invoice-dollar", nome: "Despesas por período", desc: "Custos e despesas", slug: "despesas", extra: [] },
        { setor: "FINANCEIRO", icon: "fas fa-chart-line", nome: "DRE", desc: "Demonstrativo de resultados", slug: "dre", extra: [] },
        { setor: "FINANCEIRO", icon: "fas fa-user-tie", nome: "Faturamento por profissional", desc: "Receita por profissional", slug: "faturamento-profissional", extra: ['profissional'] },
        { setor: "FINANCEIRO", icon: "fas fa-file-invoice", nome: "Pendências de Nota Fiscal", desc: "NFs não emitidas", slug: "nf-pendencias", extra: [] },
        { setor: "FINANCEIRO", icon: "fas fa-cubes", nome: "Pacotes vendidos", desc: "Vendas de pacotes", slug: "pacotes-vendidos", extra: [] },
        { setor: "FINANCEIRO", icon: "fas fa-hand-holding-usd", nome: "Inadimplência", desc: "Contas em atraso", slug: "inadimplencia", extra: [] }
    ];

    // ------------------------------------------------------------
    // VARIÁVEIS DO MODAL
    // ------------------------------------------------------------
    let currentReport = null;
    const modalOverlay = document.getElementById('modalFiltros');
    const modalTitulo = document.getElementById('modalTitulo');
    const dataInicioInput = document.getElementById('dataInicio');
    const dataFimInput = document.getElementById('dataFim');
    const extraContainer = document.getElementById('extraFieldsContainer');
    const btnCancelar = document.getElementById('btnCancelarModal');
    const btnConfirmar = document.getElementById('btnConfirmarModal');
    const setoresContainer = document.getElementById('setoresContainer');
    const searchInput = document.getElementById('searchInput');

    // ------------------------------------------------------------
    // FUNÇÕES DO MODAL
    // ------------------------------------------------------------
    function abrirModal(report) {
        currentReport = report;
        modalTitulo.innerText = `Filtrar: ${report.nome}`;
        extraContainer.innerHTML = '';

        if (report.extra && report.extra.length) {
            report.extra.forEach(campo => {
                if (campo === 'dias') {
                    extraContainer.innerHTML += `
                                <div class="campo-group">
                                    <label>Dias sem comparecimento</label>
                                    <input type="number" id="extraDias" min="1" value="30" placeholder="ex: 30 dias">
                                </div>
                            `;
                } else if (campo === 'profissional') {
                    extraContainer.innerHTML += `
                                <div class="campo-group">
                                    <label>Profissional</label>
                                    <select id="extraProfissional">
                                        <option value="">Todos</option>
                                        <option value="1">Dr. João (Fisio)</option>
                                        <option value="2">Dra. Maria (Personal)</option>
                                        <option value="3">Prof. Carlos (Ajudante)</option>
                                    </select>
                                </div>
                            `;
                } else if (campo === 'setor') {
                    extraContainer.innerHTML += `
                                <div class="campo-group">
                                    <label>Setor</label>
                                    <select id="extraSetor">
                                        <option value="fisio">Fisioterapia</option>
                                        <option value="personal">Personal Trainer</option>
                                    </select>
                                </div>
                            `;
                } else if (campo === 'status') {
                    extraContainer.innerHTML += `
                                <div class="campo-group">
                                    <label>Status</label>
                                    <select id="extraStatus">
                                        <option value="">Todos</option>
                                        <option value="plus">Plus</option>
                                        <option value="vip">VIP</option>
                                        <option value="premium">Premium</option>
                                    </select>
                                </div>
                            `;
                } else if (campo === 'tipo_atendimento') {
                    extraContainer.innerHTML += `
                                <div class="campo-group">
                                    <label>Tipo de atendimento</label>
                                    <select id="extraTipo">
                                        <option value="">Todos</option>
                                        <option value="consulta">Consulta</option>
                                        <option value="retorno">Retorno</option>
                                    </select>
                                </div>
                            `;
                } else {
                    extraContainer.innerHTML += `<div class="campo-group"><label>${campo}</label><input type="text" id="extra_${campo}"></div>`;
                }
            });
        }
        modalOverlay.classList.add('active');
    }

    function fecharModal() {
        modalOverlay.classList.remove('active');
        currentReport = null;
    }

    btnCancelar.addEventListener('click', fecharModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) fecharModal();
    });

    btnConfirmar.addEventListener('click', function () {
        if (!currentReport) return;

        const dataInicio = dataInicioInput.value;
        const dataFim = dataFimInput.value;
        if (!dataInicio || !dataFim) {
            alert('Preencha data inicial e final');
            return;
        }

        const params = new URLSearchParams();
        params.set('data_inicio', dataInicio);
        params.set('data_fim', dataFim);

        if (currentReport.extra) {
            if (currentReport.extra.includes('dias')) {
                const dias = document.getElementById('extraDias')?.value || '30';
                params.set('dias', dias);
            }
            if (currentReport.extra.includes('profissional')) {
                const prof = document.getElementById('extraProfissional')?.value;
                if (prof) params.set('profissional', prof);
            }
            if (currentReport.extra.includes('setor')) {
                const setor = document.getElementById('extraSetor')?.value;
                if (setor) params.set('setor', setor);
            }
            if (currentReport.extra.includes('status')) {
                const status = document.getElementById('extraStatus')?.value;
                if (status) params.set('status', status);
            }
            if (currentReport.extra.includes('tipo_atendimento')) {
                const tipo = document.getElementById('extraTipo')?.value;
                if (tipo) params.set('tipo_atendimento', tipo);
            }
        }

        const url = `/relatorios/${currentReport.slug}/?${params.toString()}`;
        abrirPaginaRelatorio(currentReport, dataInicio, dataFim, params);
        fecharModal();
    });

    // Simulação da página de relatório (conforme especificação)
    function abrirPaginaRelatorio(report, dataInicio, dataFim, params) {
        const titulo = `Relatório – ${report.nome}`;
        const periodo = `Período: ${dataInicio} até ${dataFim}`;

        const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>${titulo}</title>
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
                <style>
                    :root { --roxoPrincipal: #6D398E; --roxoPrincipal-hover: #76378f11; --roxo-primary-hover: #9b58b4; --verdePrincipal: #92cbad; --branco: #FFF; --cinzaEscuro: #6e6e6e; --bg-color: #E4E9F7; }
                    body { background: var(--bg-color); font-family: 'Segoe UI', sans-serif; margin: 0; padding: 2rem; }
                    .report-container { max-width: 1300px; margin: 0 auto; background: white; border-radius: 32px; padding: 2rem; box-shadow: 0 20px 30px rgba(0,0,0,0.05); }
                    .header-report { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 2rem; }
                    .header-report h2 { color: var(--roxoPrincipal); font-size: 2rem; margin: 0; }
                    .header-report .periodo { color: var(--cinzaEscuro); font-weight: 500; background: #f0f0f0; padding: 0.5rem 1.2rem; border-radius: 40px; }
                    .btn-group { display: flex; gap: 1rem; }
                    .btn-group button { background: white; border: 1px solid var(--roxoPrincipal); border-radius: 30px; padding: 0.6rem 1.2rem; font-weight: 500; color: var(--roxoPrincipal); cursor: pointer; display: flex; align-items: center; gap: 0.4rem; transition: 0.2s; }
                    .btn-group button:hover { background: var(--roxoPrincipal); color: white; }
                    .cards-resumo { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 2rem; }
                    .card-resumo { background: #f8f9ff; border-radius: 24px; padding: 1.2rem 1.8rem; border-left: 6px solid var(--roxoPrincipal); flex: 1 1 180px; box-shadow: 0 5px 10px rgba(0,0,0,0.02); }
                    .card-resumo .valor { font-size: 2rem; font-weight: 700; color: var(--roxoPrincipal); }
                    .tabela-relatorio { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
                    .tabela-relatorio th { text-align: left; padding: 1rem 0.5rem; background: var(--roxoPrincipal-hover); color: var(--roxoPrincipal); font-weight: 600; }
                    .tabela-relatorio td { padding: 1rem 0.5rem; border-bottom: 1px solid #ddd; }
                    .tabela-relatorio tr:hover { background: #f7f3fb; }
                    .badge-status { background: var(--verdePrincipal); padding: 0.3rem 1rem; border-radius: 40px; font-size: 0.8rem; font-weight: 600; }
                    .search-bar { margin: 1rem 0; display: flex; gap: 0.5rem; }
                    .search-bar input { flex:1; padding: 0.7rem; border-radius: 30px; border: 1px solid #ccc; }
                </style>
                </head>
                <body>
                <div class="report-container">
                    <div class="header-report">
                        <div>
                            <h2><i class="fas fa-file-alt" style="color:var(--roxoPrincipal);"></i> ${titulo}</h2>
                            <div class="periodo">📅 ${periodo}</div>
                        </div>
                        <div class="btn-group">
                            <button><i class="fas fa-print"></i> Imprimir</button>
                            <button><i class="fas fa-file-pdf"></i> Exportar PDF</button>
                            <button><i class="fas fa-file-excel"></i> Exportar Excel</button>
                        </div>
                    </div>

                    <div class="cards-resumo">
                        <div class="card-resumo"><span class="valor">124</span><br>Total encontrado</div>
                        <div class="card-resumo"><span class="valor">23%</span><br>Percentual da base</div>
                        <div class="card-resumo"><span class="valor">12/01/26</span><br>Últ. comparecimento médio</div>
                        <div class="card-resumo"><span class="valor">Dra. Maria</span><br>Maior incidência</div>
                    </div>

                    <div class="search-bar">
                        <input type="text" placeholder="Buscar na tabela... (exemplo estático)">
                        <i class="fas fa-sliders-h" style="color:var(--roxoPrincipal); font-size:1.5rem;"></i>
                    </div>

                    <table class="tabela-relatorio">
                        <thead><tr><th>Nome</th><th>Último atendimento</th><th>Profissional</th><th>Status</th><th>Telefone</th><th></th></tr></thead>
                        <tbody>
                            <tr><td>Ana Beatriz</td><td>10/01/2026</td><td>João (Fisio)</td><td><span class="badge-status">VIP</span></td><td>(11) 99999-1234</td><td><button style="background:var(--roxoPrincipal); color:white; border:none; border-radius:30px; padding:0.4rem 1rem;">Ver Perfil</button></td></tr>
                            <tr><td>Carlos Eduardo</td><td>05/12/2025</td><td>Maria (Personal)</td><td><span class="badge-status">Plus</span></td><td>(21) 98888-5678</td><td><button style="background:var(--roxoPrincipal); color:white; border:none; border-radius:30px; padding:0.4rem 1rem;">Ver Perfil</button></td></tr>
                            <tr><td>Fernanda Lima</td><td>22/01/2026</td><td>Carlos (Ajudante)</td><td><span class="badge-status">Premium</span></td><td>(31) 97777-3344</td><td><button style="background:var(--roxoPrincipal); color:white; border:none; border-radius:30px; padding:0.4rem 1rem;">Ver Perfil</button></td></tr>
                        </tbody>
                    </table>
                    <div style="margin-top:2rem; text-align:right; color:gray;">Página 1 de 3 <i class="fas fa-chevron-right"></i></div>
                </div>
                <script>console.log('Relatório aberto com parâmetros: ${params.toString()}')</script>
</body>

</html>
`;



        const blob = new Blob([htmlContent], { type: 'text/html' });
        const urlBlob = URL.createObjectURL(blob);
        window.open(urlBlob, '_blank');
        setTimeout(() => URL.revokeObjectURL(urlBlob), 30000);
    }

    // ------------------------------------------------------------
    // RENDERIZAÇÃO DOS CARDS (COM FILTRO DE BUSCA)
    // ------------------------------------------------------------
    function renderCards(filtroTexto = '') {
        const filtro = filtroTexto.trim().toLowerCase();
        const setoresMap = new Map(); // setor -> array de relatórios

        relatorios.forEach(rel => {
            if (filtro === '' || rel.nome.toLowerCase().includes(filtro) || rel.desc.toLowerCase().includes(filtro) ||
                rel.setor.toLowerCase().includes(filtro)) {
                if (!setoresMap.has(rel.setor)) {
                    setoresMap.set(rel.setor, []);
                }
                setoresMap.get(rel.setor).push(rel);
            }
        });

        const ordemSetores = ["PACIENTES", "PROFISSIONAIS", "AGENDA", "FINANCEIRO"];
        const iconesSetor = {
            "PACIENTES": "fas fa-user-injured",
            "PROFISSIONAIS": "fas fa-user-md",
            "AGENDA": "fas fa-calendar-alt",
            "FINANCEIRO": "fas fa-coins"
        };

        let htmlStr = '';

        for (let setor of ordemSetores) {
            const rels = setoresMap.get(setor) || [];
            if (rels.length === 0 && filtro !== '') continue; // não mostra seção vazia durante busca

            htmlStr += `<div class="setor-section">`;
            htmlStr += `<div class="setor-titulo"><i class="${iconesSetor[setor]}"></i> ${setor}</div>`;
            htmlStr += `<div class="cards-grid">`;

            rels.forEach(rel => {
                // Encontra o índice original (para referência no clique)
                const indexOriginal = relatorios.findIndex(r => r.slug === rel.slug);
                htmlStr += `
        <div class="card-relatorio">
            <div class="card-icon"><i class="${rel.icon}"></i></div>
            <h3>${rel.nome}</h3>
            <div class="card-desc">${rel.desc}</div>
            <button class="btn-abrir abrir-relatorio" data-index="${indexOriginal}"><i
                    class="fas fa-external-link-alt"></i> Abrir</button>
        </div>
        `;
            });

            htmlStr += `
    </div>
</div>`;
        }

        if (htmlStr === '') {
            htmlStr = '<div style="text-align:center; padding:3rem; color:var(--cinzaEscuro);"><i class="fas fa-searchh" style="font-size:3rem;"></i> <p>Nenhum relatório encontrado</p> </div>';
        }

        setoresContainer.innerHTML = htmlStr;

        // Reatribuir eventos aos botões "Abrir"
        document.querySelectorAll('.abrir-relatorio').forEach(btn => {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                const idx = this.dataset.index;
                if (idx !== undefined) {
                    const report = relatorios[parseInt(idx)];
                    abrirModal(report);
                }
            });
        });
    }

    // listener da busca
    searchInput.addEventListener('input', function () {
        renderCards(this.value);
    });

    // Renderização inicial
    renderCards();
})();