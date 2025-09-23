async function pegarFrequencias() {
    const res = await fetch('/frequencias');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
}

function statusBadgeClass(status) {
    const s = String(status || '').toLowerCase();
    if (s.includes('premium')) return 'badge badge-premium';
    if (s.includes('vip')) return 'badge badge-vip';
    if (s.includes('plus')) return 'badge badge-plus';
    return 'badge';
}

function pct(freqSys, freqProg) {
    const fs = Number(freqSys || 0);
    const fp = Number(freqProg || 0);
    if (fp <= 0) return '—';
    return Math.round((fs / fp) * 100) + '%';
}

function linhaHTML(item) {
    const nome = [item.nome, item.sobrenome].filter(Boolean).join(' ') || '—';
    const cpf = item.cpf || '';
    const foto = item.foto || 'http://static.photos/people/200x200/1';
    const fs = item.freq_sistema ?? item.freq ?? 0;
    const fp = item.freq_programada ?? item.programada ?? 0;
    const st = item.status ?? '';

    return `
    <tr class="table-row">
      <td>
        <div class="patient-info">
          <img class="patient-avatar" src="${foto}" alt="">
          <div>
            <div class="patient-name">${nome}</div>
            <div class="patient-detail">${cpf}</div>
          </div>
        </div>
      </td>
      <td class="sys-freq">${fs}</td>
      <td><div class="freq-programada editable-cell" onclick="makeEditable(this)">${fp}</div></td>
      <td>${pct(fs, fp)}</td>
      <td><span class="${statusBadgeClass(st)}">${st || '—'}</span></td>
      <td>
        <button class="action-btn btn-history" onclick="openHistory('${nome.replace(/'/g, "\\'")}')">
          <i data-feather="clock"></i>Histórico
        </button>
        <button class="action-btn btn-benefits" onclick="openBenefits()">
          <i data-feather="gift"></i>Benefícios
        </button>
      </td>
    </tr>`;
}

// deixa disponível pro onclick inline
window.getFrequencias = async function () {
    try {
        const data = await pegarFrequencias();
        // >>> AQUI o ajuste principal:
        const items = Array.isArray(data) ? data : (data.items ?? data.results ?? []);

        const tbody = document.querySelector('table tbody');
        if (!tbody) return console.warn('tbody não encontrado');

        if (!items.length) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Sem dados</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(linhaHTML).join('');

        // se usa Feather icons
        if (window.feather?.replace) feather.replace();
    } catch (e) {
        console.error(e);
        alert('Erro ao carregar frequências.');
    }
};