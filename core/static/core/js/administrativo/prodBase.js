(function () {
    // ----- FUNÇÕES DE CONVERSÃO HH:MM <=> MINUTOS -----
    function timeToMinutes(time) {
        if (!time || !time.includes(':')) return 0;
        let [h, m] = time.split(':').map(Number);
        return (h || 0) * 60 + (m || 0);
    }

    function minutesToTime(min) {
        if (min < 0) {
            let absMin = Math.abs(min);
            let h = Math.floor(absMin / 60);
            let m = absMin % 60;
            return `-${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
        let h = Math.floor(min / 60);
        let m = min % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }



    const tbody = document.getElementById('tbodyDias');
    function popularMesAno() {

        const mesSelect = document.getElementById("mesSelect");
        const anoSelect = document.getElementById("anoSelect");

        if (!mesSelect || !anoSelect) return;

        const meses = [
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        ];

        // Popular meses
        mesSelect.innerHTML = "";
        for (let i = 1; i <= 12; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = meses[i - 1];
            mesSelect.appendChild(option);
        }

        // Popular anos (ex: 2023 até 2030)
        const anoAtual = new Date().getFullYear();
        anoSelect.innerHTML = "";
        for (let i = anoAtual - 2; i <= anoAtual + 3; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            anoSelect.appendChild(option);
        }

        // Selecionar mês/ano atual
        mesSelect.value = new Date().getMonth() + 1;
        anoSelect.value = anoAtual;
    }
    function aplicarCorLinha(tr, tipoDia) {
        // ===== LINHA =====
        tr.classList.remove('row-previsto', 'row-nao-previsto');
        if (tipoDia === 'Previsto') tr.classList.add('row-previsto');
        if (tipoDia === 'Não previsto') tr.classList.add('row-nao-previsto');

        // ===== SELECT (borda) =====
        const selectTipo = tr.querySelector('select.day-select');
        if (!selectTipo) return;

        selectTipo.classList.remove('tipo-previsto', 'tipo-nao-previsto');
        if (tipoDia === 'Previsto') selectTipo.classList.add('tipo-previsto');
        if (tipoDia === 'Não previsto') selectTipo.classList.add('tipo-nao-previsto');
    }

    function renderizarTabela(dias) {
        tbody.innerHTML = '';
        dias.forEach(d => {
            const tr = document.createElement('tr');
            tr.setAttribute('data-dia', d.dia);
            aplicarCorLinha(tr, d.tipoDia);
            // Coluna dia
            const tdDia = document.createElement('td');
            tdDia.className = 'row-day-label';
            tdDia.textContent = String(d.dia).padStart(2, '0');
            tr.appendChild(tdDia);

            // Tipo de Dia
            const tdTipo = document.createElement('td');
            const selectTipo = document.createElement('select');
            selectTipo.className = 'day-select';
            ['Previsto', 'Não previsto', 'Férias', 'Afastamento', 'Atestado'].forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (opt === d.tipoDia) option.selected = true;
                selectTipo.appendChild(option);
            });
            selectTipo.addEventListener('change', function () {

                const valor = this.value;
                const row = this.closest('tr');
                const selectPresenca = row.cells[2].querySelector('select');
                const inputPrevistas = row.cells[3].querySelector('input');
                aplicarCorLinha(row, valor);
                if (valor === 'Férias' || valor === 'Afastamento' || valor === 'Atestado') {

                    selectPresenca.value = valor;
                    inputPrevistas.value = '00:00';
                     

                } else if (valor === 'Não previsto') {

                    selectPresenca.value = 'Presente';
                    inputPrevistas.value = '00:00';
                     

                } else if (valor === 'Previsto') {

                    
                    // 🔥 NÃO INVENTA MAIS 07:00
                    // Mantém o valor que já veio do backend
                    if (inputPrevistas.value === '00:00') {
                        // opcional: pode deixar assim mesmo
                    }

                    selectPresenca.value = 'Presente';
                }

                calcularDia(row);
                calcularTotaisMensais();
            });

            tdTipo.appendChild(selectTipo);
            tr.appendChild(tdTipo);

            // Presença
            const tdPres = document.createElement('td');
            const selectPres = document.createElement('select');
            selectPres.className = 'presence-select';
            ['Presente', 'Falta', 'Justificado', 'Férias', 'Atestado', 'Afastamento'].forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (opt === d.presenca) option.selected = true;
                selectPres.appendChild(option);
            });
            selectPres.addEventListener('change', function () { calcularTotaisMensais(); });
            tdPres.appendChild(selectPres);
            tr.appendChild(tdPres);

            // Horas Previstas (editável)
            const tdPrev = document.createElement('td');
            const inputPrev = document.createElement('input');
            inputPrev.type = 'text';
            inputPrev.className = 'time-input';
            inputPrev.value = d.horasPrevistas;
            inputPrev.addEventListener('blur', function (e) {
                let val = e.target.value.trim();
                if (!val.match(/^\d{2}:\d{2}$/)) e.target.value = '00:00';
                if (val.startsWith('-')) e.target.value = '00:00';
                calcularDia(tr);
                calcularTotaisMensais();
            });
            inputPrev.addEventListener('input', function () { calcularDia(tr); });
            tdPrev.appendChild(inputPrev);
            tr.appendChild(tdPrev);

            // Atend Individual
            const tdInd = document.createElement('td');
            tdInd.textContent = d.individual;
            tr.appendChild(tdInd);

            // Atend Conjunto
            const tdConj = document.createElement('td');
            tdConj.textContent = d.conjunto;
            tr.appendChild(tdConj);

            // Avaliações
            const tdAv = document.createElement('td');
            tdAv.textContent = d.avaliacoes;
            tr.appendChild(tdAv);

            // Evoluções
            const tdEv = document.createElement('td');
            tdEv.textContent = d.evolucoes;
            tr.appendChild(tdEv);

            // Prontuários (qtd)
            const tdPrtQtd = document.createElement('td');
            tdPrtQtd.textContent = d.prontuarios;
            tr.appendChild(tdPrtQtd);

            // H. Prontuário (editável)
            const tdHPrt = document.createElement('td');
            const inputHPrt = document.createElement('input');
            inputHPrt.type = 'text';
            inputHPrt.className = 'time-input';
            inputHPrt.value = d.hProntuario;
            inputHPrt.addEventListener('blur', function (e) {
                if (!e.target.value.match(/^\d{2}:\d{2}$/)) e.target.value = '00:00';
                if (e.target.value.startsWith('-')) e.target.value = '00:00';
                calcularDia(tr);
                calcularTotaisMensais();
            });
            inputHPrt.addEventListener('input', function () { calcularDia(tr); });
            tdHPrt.appendChild(inputHPrt);
            tr.appendChild(tdHPrt);

            // H. Coordenação
            const tdHCoord = document.createElement('td');
            const inputHCoord = document.createElement('input');
            inputHCoord.type = 'text';
            inputHCoord.className = 'time-input';
            inputHCoord.value = d.hCoord;
            inputHCoord.addEventListener('blur', function (e) {
                if (!e.target.value.match(/^\d{2}:\d{2}$/)) e.target.value = '00:00';
                if (e.target.value.startsWith('-')) e.target.value = '00:00';
                calcularDia(tr);
                calcularTotaisMensais();
            });
            inputHCoord.addEventListener('input', function () { calcularDia(tr); });
            tdHCoord.appendChild(inputHCoord);
            tr.appendChild(tdHCoord);

            // H. Burocráticas
            const tdHBuro = document.createElement('td');
            const inputHBuro = document.createElement('input');
            inputHBuro.type = 'text';
            inputHBuro.className = 'time-input';
            inputHBuro.value = d.hBuro;
            inputHBuro.addEventListener('blur', function (e) {
                if (!e.target.value.match(/^\d{2}:\d{2}$/)) e.target.value = '00:00';
                if (e.target.value.startsWith('-')) e.target.value = '00:00';
                calcularDia(tr);
                calcularTotaisMensais();
            });
            inputHBuro.addEventListener('input', function () { calcularDia(tr); });
            tdHBuro.appendChild(inputHBuro);
            tr.appendChild(tdHBuro);

            // Total Dia
            const tdTotalDia = document.createElement('td');
            tdTotalDia.className = 'total-dia';
            tdTotalDia.textContent = d.totalDia;
            tr.appendChild(tdTotalDia);

            // Saldo Dia
            const tdSaldo = document.createElement('td');
            const spanSaldo = document.createElement('span');
            spanSaldo.className = d.saldoClass;
            spanSaldo.textContent = d.saldoDia;
            tdSaldo.appendChild(spanSaldo);
            tr.appendChild(tdSaldo);
aplicarCorLinha(tr, d.tipoDia);
            tbody.appendChild(tr);
        });
    }

    // ----- CALCULAR LINHA DO DIA (TOTAL E SALDO) -----
    function calcularDia(row) {
        const cells = row.cells;
        if (cells.length < 14) return;

        const indIndividual = cells[4]?.textContent || '00:00';
        const indConjunto = cells[5]?.textContent || '00:00';

        const inputHPrt = cells[9]?.querySelector('input');
        const inputHCoord = cells[10]?.querySelector('input');
        const inputHBuro = cells[11]?.querySelector('input');
        const inputPrev = cells[3]?.querySelector('input');

        const hPrt = inputHPrt?.value || '00:00';
        const hCoord = inputHCoord?.value || '00:00';
        const hBuro = inputHBuro?.value || '00:00';
        const prev = inputPrev?.value || '00:00';

        let totalMin = timeToMinutes(indIndividual) + timeToMinutes(indConjunto) +
            timeToMinutes(hPrt) + timeToMinutes(hCoord) + timeToMinutes(hBuro);
        let totalDia = minutesToTime(totalMin);

        let saldoMin = totalMin - timeToMinutes(prev);
        let saldoDia = minutesToTime(saldoMin);
        let saldoClass = saldoMin > 0 ? 'saldo-pos' : saldoMin < 0 ? 'saldo-neg' : 'saldo-zero';

        cells[12].textContent = totalDia; // Total dia
        const spanSaldo = cells[13].querySelector('span');
        spanSaldo.className = saldoClass;
        spanSaldo.textContent = saldoDia;
    }

    // ----- CALCULAR TOTAIS MENSAIS E ATUALIZAR PAINEL -----
    function calcularTotaisMensais() {
        const rows = document.querySelectorAll('#tbodyDias tr');
        let totalPrevMin = 0, totalIndMin = 0, totalConjMin = 0;
        let totalAvaliacoes = 0, totalEvolucoes = 0, totalProntuariosQtd = 0;
        let totalHPrtMin = 0, totalHCoordMin = 0, totalHBuroMin = 0;
        let totalTrabalhadoMin = 0;
        let diasPrevistos = 0, diasCumpridos = 0;

        rows.forEach(row => {
            const cells = row.cells;
            const tipoSelect = cells[1]?.querySelector('select');
            const tipoDia = tipoSelect?.value || 'Previsto';
            const presencaSelect = cells[2]?.querySelector('select');
            const presenca = presencaSelect?.value || 'Presente';

            // Contagem de dias previstos (considerando que não sejam férias/atestado/afastamento)
            if (tipoDia !== 'Férias' && tipoDia !== 'Afastamento' && tipoDia !== 'Atestado' && tipoDia !== 'Não previsto') {
                diasPrevistos++;
            }

            // Dias cumpridos: presente OU horas trabalhadas > 0 em dias não previstos, etc.
            const totalDiaMin = timeToMinutes(cells[12]?.textContent || '00:00');
            if (totalDiaMin > 0 || presenca === 'Presente' || presenca === 'Justificado') {
                diasCumpridos++;
            }

            const prevInput = cells[3]?.querySelector('input');
            totalPrevMin += timeToMinutes(prevInput?.value || '00:00');

            totalIndMin += timeToMinutes(cells[4]?.textContent || '00:00');
            totalConjMin += timeToMinutes(cells[5]?.textContent || '00:00');
            totalAvaliacoes += parseInt(cells[6]?.textContent || 0);
            totalEvolucoes += parseInt(cells[7]?.textContent || 0);
            totalProntuariosQtd += parseInt(cells[8]?.textContent || 0);

            const hPrtInput = cells[9]?.querySelector('input');
            totalHPrtMin += timeToMinutes(hPrtInput?.value || '00:00');
            const hCoordInput = cells[10]?.querySelector('input');
            totalHCoordMin += timeToMinutes(hCoordInput?.value || '00:00');
            const hBuroInput = cells[11]?.querySelector('input');
            totalHBuroMin += timeToMinutes(hBuroInput?.value || '00:00');

            totalTrabalhadoMin += totalDiaMin;
        });

        // Atualizar totais na tabela
        document.getElementById('totalPrevistas').textContent = minutesToTime(totalPrevMin);
        document.getElementById('totalIndividual').textContent = minutesToTime(totalIndMin);
        document.getElementById('totalConjunto').textContent = minutesToTime(totalConjMin);
        document.getElementById('totalAvaliacoes').textContent = totalAvaliacoes;
        document.getElementById('totalEvolucoes').textContent = totalEvolucoes;
        document.getElementById('totalProntuariosQtd').textContent = totalProntuariosQtd;
        document.getElementById('totalHProntuario').textContent = minutesToTime(totalHPrtMin);
        document.getElementById('totalHCoord').textContent = minutesToTime(totalHCoordMin);
        document.getElementById('totalHBuro').textContent = minutesToTime(totalHBuroMin);
        document.getElementById('totalTrabalhado').textContent = minutesToTime(totalTrabalhadoMin);

        const saldoFinalMin = totalTrabalhadoMin - totalPrevMin;
        const saldoFinal = minutesToTime(saldoFinalMin);
        const saldoFinalSpan = document.getElementById('totalSaldo').querySelector('span');
        saldoFinalSpan.textContent = saldoFinal;
        saldoFinalSpan.className = saldoFinalMin > 0 ? 'saldo-pos' : saldoFinalMin < 0 ? 'saldo-neg' : 'saldo-zero';

        // ----- ATUALIZAR PAINEL LATERAL -----
        // Dias
        const percDiasCumpridos = diasPrevistos ? Math.round((diasCumpridos / diasPrevistos) * 100) : 0;
        document.getElementById('diasPrevistosValor').innerHTML = `${diasPrevistos} (100%)`;
        document.getElementById('diasCumpridosValor').innerHTML = `${diasCumpridos} <span class="badge-percent">${percDiasCumpridos}%</span>`;

        // Horas
        const percHoras = totalPrevMin ? Math.round((totalTrabalhadoMin / totalPrevMin) * 100) : 0;
        document.getElementById('horasPrevistasValor').textContent = minutesToTime(totalPrevMin);
        document.getElementById('horasTrabalhadasValor').innerHTML = `${minutesToTime(totalTrabalhadoMin)} <span class="badge-percent" id="horasPercent">${percHoras}%</span>`;

        // Distribuição
        document.getElementById('distribIndividual').textContent = minutesToTime(totalIndMin);
        document.getElementById('distribConjunto').textContent = minutesToTime(totalConjMin);
        document.getElementById('distribProntuario').textContent = minutesToTime(totalHPrtMin);
        document.getElementById('distribCoord').textContent = minutesToTime(totalHCoordMin);
        document.getElementById('distribBuro').textContent = minutesToTime(totalHBuroMin);

        const percInd = totalTrabalhadoMin ? Math.round((totalIndMin / totalTrabalhadoMin) * 100) : 0;
        const percConj = totalTrabalhadoMin ? Math.round((totalConjMin / totalTrabalhadoMin) * 100) : 0;
        const percPrt = totalTrabalhadoMin ? Math.round((totalHPrtMin / totalTrabalhadoMin) * 100) : 0;
        const percCoord = totalTrabalhadoMin ? Math.round((totalHCoordMin / totalTrabalhadoMin) * 100) : 0;
        const percBuro = totalTrabalhadoMin ? Math.round((totalHBuroMin / totalTrabalhadoMin) * 100) : 0;

        document.getElementById('percIndividual').textContent = percInd + '%';
        document.getElementById('percConjunto').textContent = percConj + '%';
        document.getElementById('percProntuario').textContent = percPrt + '%';
        document.getElementById('percCoord').textContent = percCoord + '%';
        document.getElementById('percBuro').textContent = percBuro + '%';

        // Prontuários
        document.getElementById('prontuariosTotal').textContent = totalProntuariosQtd;
        document.getElementById('prontuariosHoras').textContent = minutesToTime(totalHPrtMin);
        const horasDecimais = totalHPrtMin / 60;
        const razao = horasDecimais > 0 ? (totalProntuariosQtd / horasDecimais).toFixed(2) : '0,00';
        document.getElementById('razaoProntuario').textContent = razao.replace('.', ',');
        document.getElementById('razaoDetalhe').innerHTML = `(${totalProntuariosQtd} pront ÷ ${horasDecimais.toFixed(1)}h)`;

        // Indicadores
        document.getElementById('totalAvaliacoesInd').textContent = totalAvaliacoes;
        document.getElementById('totalEvolucoesInd').textContent = totalEvolucoes;

        // Saldo Final
        document.getElementById('saldoFinalValor').textContent = saldoFinal;
        const percSaldo = totalPrevMin ? Math.round((saldoFinalMin / totalPrevMin) * 100) : 0;
        const sinal = percSaldo > 0 ? '+' : '';
        document.getElementById('saldoFinalPercent').textContent = `${sinal}${percSaldo}%`;
        document.getElementById('saldoFinalPercent').style.background = saldoFinalMin > 0 ? '#e0f5e9' : saldoFinalMin < 0 ? '#ffcccc' : '#eef2f5';
        document.getElementById('saldoFinalPercent').style.color = saldoFinalMin > 0 ? 'var(--verde-sucesso)' : saldoFinalMin < 0 ? 'var(--vermelho-alerta)' : 'var(--cinza-medio)';

        // Atualizar gráfico
        atualizarGrafico(totalIndMin, totalConjMin, totalHPrtMin, totalHCoordMin, totalHBuroMin, totalTrabalhadoMin);
    }

    // Gráfico
    let chartInstance = null;
    function atualizarGrafico(ind, conj, prt, coord, buro, total) {
        const outros = total - (ind + conj + prt + coord + buro);
        const ctx = document.getElementById('horasChart').getContext('2d');
        if (chartInstance) chartInstance.destroy();
        chartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Individual', 'Conjunto', 'Prontuário', 'Coordenação', 'Burocrático', 'Outros'],
                datasets: [{
                    data: [ind / 60, conj / 60, prt / 60, coord / 60, buro / 60, Math.max(0, outros / 60)],
                    backgroundColor: ['#9b58b4', '#b37ac2', '#c69ad0', '#dbbae0', '#eddaf0', '#f3e8f5'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw.toFixed(1)}h` } } },
                layout: { padding: 6 }
            }
        });
    }

    async function carregarDadosAPI() {

        const profissional = document.getElementById("profissionalSelect").value;
        const mes = document.getElementById("mesSelect").value;
        const ano = document.getElementById("anoSelect").value;

        if (!profissional || !mes || !ano) {
            alert("Selecione profissional, mês e ano.");
            return;
        }

        const response = await fetch(`/api/produtividade/?profissional=${profissional}&mes=${mes}&ano=${ano}`);
        const data = await response.json();

        const diasConvertidos = data.dias.map(d => {

            const saldoMin = d.saldo_min;

            return {
                dia: d.dia,
                tipoDia: formatarTipo(d.tipo_dia),
                presenca: d.presenca,
                horasPrevistas: minutesToTime(d.horas_previstas_min),
                individual: minutesToTime(d.individual_min),
                conjunto: minutesToTime(d.conjunto_min),
                avaliacoes: d.avaliacoes,
                evolucoes: d.evolucoes,
                prontuarios: d.prontuarios,
                hProntuario: minutesToTime(d.horas_prontuario_min),
                hCoord: minutesToTime(d.horas_coord_min),
                hBuro: minutesToTime(d.horas_buro_min),
                totalDia: minutesToTime(d.total_trabalhado_min),
                saldoDia: minutesToTime(saldoMin),
                saldoClass:
                    saldoMin > 0 ? 'saldo-pos'
                        : saldoMin < 0 ? 'saldo-neg'
                            : 'saldo-zero',
                saldoMin: saldoMin
            };
        });

        renderizarTabela(diasConvertidos);
        calcularTotaisMensais();
    }

    function formatarTipo(tipo) {
        const mapa = {
            'previsto': 'Previsto',
            'nao_previsto': 'Não previsto',
            'ferias': 'Férias',
            'afastamento': 'Afastamento',
            'atestado': 'Atestado'
        };
        return mapa[tipo] || 'Previsto';
    }

    // Atualizar título com nome real do profissional + mês + ano
    const selectProf = document.getElementById('profissionalSelect');
    const mesSelect = document.getElementById('mesSelect');
    const anoSelect = document.getElementById('anoSelect');

    function atualizarTitulo() {

        const profNome = selectProf.options[selectProf.selectedIndex]?.text || '';
        const mesNome = mesSelect.options[mesSelect.selectedIndex]?.text || '';
        const anoValor = anoSelect.value || '';

        const titulo = `${profNome} · ${mesNome} ${anoValor}`;

        document.getElementById('tituloRelatorio').textContent = titulo;
    }

    // Atualiza quando trocar profissional, mês ou ano
    selectProf.addEventListener('change', atualizarTitulo);
    mesSelect.addEventListener('change', atualizarTitulo);
    anoSelect.addEventListener('change', atualizarTitulo);

    // Atualiza ao carregar página
    atualizarTitulo();


    // Botões
    document.getElementById('carregarBtn').addEventListener('click', function () {
        carregarDadosAPI();
    });

    document.getElementById('salvarBtn').addEventListener('click', function () {
        alert('💾 Alterações salvas (simulação).');
    });

    // Expor para debug
    window.calcularTotaisMensais = calcularTotaisMensais;
    window.addEventListener("load", function () {
        popularMesAno();
        carregarDadosAPI();
    });


})();
