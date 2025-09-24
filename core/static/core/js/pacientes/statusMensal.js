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
    if (fp <= 0) return '0%';
    return Math.round((fs / fp) * 100) + '%';
}
// --- STATUS helpers (novo) ---------------------------
function normalizeStatus(raw) {
    const s = String(raw || '').toLowerCase().trim();
    if (s.includes('premium')) return 'premium';
    if (s.includes('vip')) return 'vip';
    if (s.includes('plus')) return 'plus';
    if (s.includes('primeiro')) return 'primeiro_mes';
    if (s.includes('indefinido')) return 'indefinido';
    return '';
}
function badgeClass(statusKey) {
    switch (statusKey) {
        case 'premium': return 'badge badge-premium';
        case 'vip': return 'badge badge-vip';
        case 'plus': return 'badge badge-plus';
        case 'primeiro_mes': return 'badge badge-primeiro_mes';
        case 'indefinido': return 'badge badge-indefinido';
        default: return 'badge';
    }
}
function statusLabel(statusKey) {
    switch (statusKey) {
        case 'premium': return 'Premium';
        case 'vip': return 'VIP';
        case 'plus': return 'Plus';
        case 'primeiro_mes': return 'Primeiro mês';
        case 'indefinido': return 'Indefinido';
        default: return '—';
    }
}
function statusKeyFromPercent(p) {
    if (!isFinite(p)) return '';
    if (p >= 100) return 'premium';
    if (p > 60) return 'vip';
    return 'plus';
}
function clearBadgeClasses(el) {
    const known = ['badge', 'badge-premium', 'badge-vip', 'badge-plus', 'badge-primeiro_mes', 'badge-indefinido'];
    known.forEach(c => el.classList.remove(c));
    el.classList.add('badge');
}

function linhaHTML(item) {
    const nome = [item.nome, item.sobrenome].filter(Boolean).join(' ') || '—';
    const cpf = item.cpf || '';
    const fs = item.freq_sistema ?? item.freq ?? 0;
    const fp = item.freq_programada ?? item.programada ?? '';

    // percentual: usa o do JSON se vier, senão calcula
    const pNum = (typeof item.percentual === 'number')
        ? item.percentual
        : (Number(fp) > 0 ? (Number(fs) / Number(fp)) * 100 : NaN);
    const pText = formatPercent(pNum);

    // status: normaliza o que vier do JSON; se não vier, deriva do % calculado
    const statusKey = item.status ? normalizeStatus(item.status) : statusKeyFromPercent(pNum);
    const stClass = badgeClass(statusKey);
    const stLabel = statusLabel(statusKey);

    return `
<tr class="table-row" data-paciente-id="${item.paciente_id}">
  <td>
    <div class="patient-info">
      <div>
        <div class="patient-name">${nome}</div>
        <div class="patient-detail">${cpf}</div>
      </div>
    </div>
    <input type="hidden" name="paciente_id[]" value="${item.paciente_id}">
  </td>

  <td class="sys-freq">${fs}</td>

  <td>
    <input
      type="number" min="0" class="fp-input"
      name="freq_programada[]" placeholder="0"
      value="${fp}" style="width:6rem">
  </td>

  <td class="perc col-percentual">${pText}</td>

  <td class="col-status"><span class="${stClass}">${stLabel}</span></td>

  <td>
    <button class="action-btn btn-history" type="button" onclick="openHistory('${nome.replace(/'/g, "\\'")}')">
      <i data-feather="clock"></i>Histórico
    </button>
    <button class="action-btn btn-benefits" type="button" onclick="openBenefits()">
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

// ----- helpers (aceita vírgula, milhar etc.)
function parseNumberBR(txt) {
    if (txt == null) return NaN;
    const s = String(txt).trim();
    if (!s) return NaN;
    return Number(s.replace(/\./g, '').replace(',', '.'));
}
function formatPercent(n) {
    if (!isFinite(n)) return '—';
    const inteiro = Math.abs(n - Math.round(n)) < 1e-9;
    return (inteiro ? Math.round(n) : n.toFixed(1)) + '%';
}
function statusFromPercent(p) {
    if (!isFinite(p)) return '—';
    if (p >= 100) return 'Premium';
    if (p > 60) return 'VIP';
    return 'Plus';
}
function classForStatus(status) {
    switch (status) {
        case 'Premium': return 'badge badge-premium';
        case 'VIP': return 'badge badge-vip';
        case 'Plus': return 'badge badge-plus';
        default: return 'badge';
    }
}
function clearBadgeClasses(el) {
    const known = ['badge', 'badge-premium', 'badge-vip', 'badge-plus'];
    el.classList.forEach(c => { if (known.includes(c)) el.classList.remove(c); });
    el.classList.add('badge');
}

// ----- cálculo para uma linha
function recalcRow(tr, fpRaw) {
    const fs = parseNumberBR(tr.querySelector('.sys-freq')?.textContent);
    // se passar fpRaw, usa ele; senão lê do input
    const fpInput = tr.querySelector('.fp-input');
    const raw = fpRaw !== undefined ? fpRaw : (fpInput?.value ?? '');
    const hasText = String(raw).trim() !== '';
    const fp = hasText ? parseNumberBR(raw) : NaN;

    const percEl = tr.querySelector('.perc');
    const statusEl = tr.querySelector('td span');

    if (!hasText) {
        if (percEl) percEl.textContent = '0%';
        if (statusEl) { statusEl.textContent = '0%'; clearBadgeClasses(statusEl); }
        return;
    }

    let p = NaN;
    if (isFinite(fs) && isFinite(fp) && fp > 0) p = (fs / fp) * 100;

    if (percEl) percEl.textContent = formatPercent(p);
    if (statusEl) {
        const st = statusFromPercent(p);
        statusEl.textContent = st;
        clearBadgeClasses(statusEl);
        statusEl.classList.add(...classForStatus(st).split(' '));
    }
}

// ----- recalcula enquanto digita (todas as linhas)
document.addEventListener('input', (e) => {
    if (!e.target.matches('.fp-input')) return;
    const tr = e.target.closest('tr.table-row');
    if (!tr) return;
    recalcRow(tr, e.target.value);
});

// ----- faz um passe inicial para preencher %/status se já tiver valor
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('tr.table-row').forEach(tr => recalcRow(tr));
});


