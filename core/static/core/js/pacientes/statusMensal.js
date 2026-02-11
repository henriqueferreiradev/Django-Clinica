async function pegarFrequencias(opts = {}) {
  // tenta pegar dos hiddens; se não existir, usa opts ou data atual
  const mes =
    opts.mes ??
    document.getElementById('mes')?.value ??
    (new Date().getMonth() + 1);
  const ano =
    opts.ano ??
    document.getElementById('ano')?.value ??
    (new Date()).getFullYear();


  const BASE_PATH = '/frequencias';
  const url = new URL(BASE_PATH, window.location.origin);
  url.searchParams.set('mes', mes);
  url.searchParams.set('ano', ano);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
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
  if (p >= 60) return 'vip';
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

  // %: usa o do JSON se vier, senão calcula
  const pNum = (typeof item.percentual === 'number')
    ? item.percentual
    : (Number(fp) > 0 ? (Number(fs) / Number(fp)) * 100 : NaN);
  const pText = formatPercent(pNum);

  // status normalizado (ou derivado do %)
  const statusKey = item.status ? normalizeStatus(item.status) : statusKeyFromPercent(pNum);
  const stClass = badgeClass(statusKey);
  const stLabel = statusLabel(statusKey);

  // 🔒 Regras de bloqueio do input
  const lockByStatus = (statusKey === 'primeiro_mes');  // sua regra
  const lockByJSON = (item.fechado === true);
  const isLocked = lockByStatus || lockByJSON;

  // Monta atributos dinamicamente
  const lockAttrs = isLocked
    ? 'readonly aria-disabled="true" data-locked="1" title="Edição bloqueada neste status"'
    : '';

  // Classe visual opcional p/ estilizar input travado (ex: cursor not-allowed)
  const lockClass = isLocked ? ' fp-locked' : '';

  return `
<tr class="table-row" data-paciente-id="${item.paciente_id}" data-status="${statusKey}">
  <td >
    <div class="patient-info">
      <div>
        <div class="patient-name">${nome}</div>
        <div class="patient-detail">${cpf}</div>
      </div>
    </div>
    <input type="hidden" name="paciente_id[]" value="${item.paciente_id}">
  </td>

  <td class="col-center sys-freq">${fs}</td>

  <td class="col-center">
    <input
      type="number" min="0"
      class="fp-input freq-input" name="freq_programada[]" placeholder="0"
      value="${fp}" style="width:6rem"
      ${lockAttrs}>
  </td>

  <td class="col-center perc col-percentual">${pText}</td>

  <td class="col-center col-status"><span class="${stClass}">${stLabel}</span></td>

  <td class='col-center'>
    <button class="action-btn btn-history" type="button" onclick="openHistory(this)">
        <i class='bx  bx-book'  ></i> 
    </button>
    <button class="action-btn btn-benefits" type="button" onclick="openBenefits(this)">
      <i class='bx  bx-gift'  ></i> 
    </button>
  </td>
</tr>`;
}


// deixa disponível pro onclick inline
window.getFrequencias = async function () {
  try {
    const mes = document.getElementById('mes')?.value;
    const ano = document.getElementById('ano')?.value;

    // Verifica se mês foi selecionado
    if (!mes || mes === "") {
      const tbody = document.querySelector('table tbody');
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center">Por favor, selecione um mês para visualizar as frequências</td></tr>`;
      return;
    }

    const data = await pegarFrequencias({ mes, ano });
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
  if (p >= 60) return 'VIP';
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
    if (statusEl) { statusEl.textContent = 'Indefinido'; clearBadgeClasses(statusEl); }
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
  if (!e.target.matches('.freq-input')) return;

  const tr = e.target.closest('tr.table-row');
  if (!tr) return;

  // recalcula %
  recalcRow(tr, e.target.value);

  // marca como alterado
  const pid = tr.getAttribute('data-paciente-id');
  markDirty(tr, pid);
});


// ----- faz um passe inicial para preencher %/status se já tiver valor
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('tr.table-row').forEach(tr => recalcRow(tr));
});


(function () {
  const hiddenMes = document.getElementById('mes');
  const hiddenAno = document.getElementById('ano');
  const filtroMes = document.getElementById('filtroMes');
  const filtroAno = document.getElementById('filtroAno');
  const aplicarBtn = document.getElementById('aplicarFiltro');

  // Preencher anos dinamicamente (atual ± 5)
  const anoAtual = (new Date()).getFullYear();
  for (let y = anoAtual - 5; y <= anoAtual + 5; y++) {
    const opt = document.createElement('option');
    opt.value = String(y);
    opt.textContent = String(y);
    filtroAno.appendChild(opt);
  }

  // VERIFICA SE TEM VALOR VÁLIDO antes de selecionar
  const mesInicial = hiddenMes.value;
  const anoInicial = hiddenAno.value;

  // Só seleciona se tiver um valor válido (não vazio)
  if (mesInicial && mesInicial !== "") {
    filtroMes.value = String(mesInicial);
  }

  if (anoInicial && anoInicial !== "") {
    filtroAno.value = String(anoInicial);
  } else {
    // Se não tiver ano, seleciona o ano atual
    filtroAno.value = String(anoAtual);
  }

  function syncFiltroParaHidden() {
    // Só atualiza os hidden se os filtros tiverem valor
    if (filtroMes.value && filtroMes.value !== "") {
      hiddenMes.value = filtroMes.value;
    }
    if (filtroAno.value && filtroAno.value !== "") {
      hiddenAno.value = filtroAno.value;
    }
  }

  function aplicarFiltro() {
    // Verifica se mês foi selecionado
    if (!filtroMes.value || filtroMes.value === "") {
      alert("Por favor, selecione um mês.");
      filtroMes.focus();
      return;
    }

    syncFiltroParaHidden();
    // Se sua função de busca já existir, chama com os novos filtros
    if (typeof getFrequencias === 'function') {
      getFrequencias();
    }
  }

  aplicarBtn.addEventListener('click', aplicarFiltro);

  // (Opcional) Atualizar automaticamente ao trocar mês/ano:
  filtroMes.addEventListener('change', aplicarFiltro);
  filtroAno.addEventListener('change', aplicarFiltro);
})();

let DATA_ATUAL = []; // último payload renderizado
let DIRTY_SET = new Set(); // ids de linhas alteradas
let STATUS_FILTRO = "todos"; // filtro ativo

// === Helpers de filtro ===
function matchBusca(nome, cpf, termo) {
  if (!termo) return true;
  const t = termo.toLowerCase();
  return (
    String(nome || "")
      .toLowerCase()
      .includes(t) ||
    String(cpf || "")
      .toLowerCase()
      .includes(t)
  );
}
function matchStatus(chave, filtro) {
  if (!filtro || filtro === "todos") return true;
  return String(chave || "").toLowerCase() === filtro;
}
function statusKeyFromLabel(label) {
  const s = String(label || "").toLowerCase();
  if (s.includes("premium")) return "premium";
  if (s.includes("vip")) return "vip";
  if (s.includes("plus")) return "plus";
  if (s.includes("primeiro")) return "primeiro_mes";
  if (s.includes("indef")) return "indefinido";
  return "";
}

// === KPIs ===
function calcularKPIs(items) {
  const n = items.length;

  let soma = 0, count = 0;

  let premium = 0;
  let vip = 0;
  let plus = 0;
  let indef = 0;
  let primeiroMes = 0;

  for (const it of items) {
    const p =
      typeof it.percentual === "number"
        ? it.percentual
        : Number(it.freq_programada) > 0
          ? (Number(it.freq_sistema) / Number(it.freq_programada)) * 100
          : NaN;

    if (isFinite(p)) {
      soma += p;
      count++;
    }

    const key = it.status
      ? statusKeyFromLabel(it.status)
      : isFinite(p)
        ? p >= 100
          ? "premium"
          : p >= 60
            ? "vip"
            : "plus"
        : "indefinido";

    if (key === "premium") premium++;
    else if (key === "vip") vip++;
    else if (key === "plus") plus++;
    else if (key === "primeiro_mes") primeiroMes++;   // ✅ aqui
    else indef++;
  }



  document.getElementById("kpiPacientes").textContent = n;


  document.getElementById("kpiPremium").textContent = premium;
  document.getElementById("kpiVip").textContent = vip;
  document.getElementById("kpiPlus").textContent = plus;
  document.getElementById("kpiIndef").textContent = indef;

  // ✅ não esquece de criar esse elemento no HTML:
  // <div id="kpiPrimeiroMes">0</div>
  const elPrimeiroMes = document.getElementById("kpiPrimeiroMes");
  if (elPrimeiroMes) elPrimeiroMes.textContent = primeiroMes;
}

// === Salvar bar ===
function updateSaveBar() {
  const bar = document.getElementById("saveBar");
  bar.classList.remove("hidden");
  const q = DIRTY_SET.size;
  const badge = document.getElementById("dirtyBadge");
  if (q > 0) {
    badge.style.display = "inline-flex";
    badge.textContent =
      q === 1 ? "1 alteração pendente" : `${q} alterações pendentes`;
  } else {
    badge.style.display = "none";
  }
  const tbody = document.querySelector("table tbody");
  document.getElementById("listInfo").textContent = `${tbody?.children.length || 0
    } linhas exibidas`;
}

// Marca linha como alterada
function markDirty(tr, pacienteId) {
  if (!pacienteId) return;
  DIRTY_SET.add(String(pacienteId));
  tr.classList.add("dirty");
  updateSaveBar();
}

// === Integra com sua renderização existente ===
const _renderOriginal = window.getFrequencias;
window.getFrequencias = async function () {
  DIRTY_SET.clear();
  const data = await pegarFrequencias();
  const mesFechado = data.mes_fechado === true;

  // trava tudo se fechado
  if (mesFechado) {
    document.querySelectorAll(".freq-input").forEach(inp => {
      inp.setAttribute("readonly", "readonly");
      inp.classList.add("fp-locked");
    });

    // some com a save bar
    document.getElementById("saveBar")?.classList.add("hidden");

    // opcional: mostra um aviso
    document.getElementById("listInfo").textContent = "Mês finalizado (somente leitura).";
  }
  // já com ?mes=&ano=
  const items = Array.isArray(data) ? data : data.items ?? [];
  DATA_ATUAL = items;

  // render normal
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = items.map(linhaHTML).join("");

  // feathers
  if (window.feather?.replace) feather.replace();

  // KPIs + savebar
  calcularKPIs(items);
  updateSaveBar();

  // listeners para cálculo/dirty (você já recalcula %; aqui só marcamos dirty)
  tbody.querySelectorAll(".fp-input").forEach((inp) => {
    inp.addEventListener("input", (e) => {
      const tr = e.target.closest("tr.table-row");
      const pid =
        tr?.dataset?.pacienteId || tr?.getAttribute("data-paciente-id");
      markDirty(tr, pid);
    });
  });

  // aplica filtro inicial (se algo estiver setado)
  aplicarFiltroBuscaEChips();
};

// === Busca + chips ===
function aplicarFiltroBuscaEChips() {
  const busca = document
    .getElementById("filtroBusca")
    ?.value?.trim()
    .toLowerCase();
  const rows = document.querySelectorAll("tbody tr.table-row");
  let visiveis = 0;
  rows.forEach((tr) => {
    const nome = tr.querySelector(".patient-name")?.textContent || "";
    const cpf = tr.querySelector(".patient-detail")?.textContent || "";
    const key = statusKeyFromLabel(
      tr.querySelector(".col-status span")?.textContent
    );
    const show =
      matchBusca(nome, cpf, busca) && matchStatus(key, STATUS_FILTRO);
    tr.style.display = show ? "" : "none";
    if (show) visiveis++;
  });
  document.getElementById(
    "listInfo"
  ).textContent = `${visiveis} linhas exibidas`;
}

document.addEventListener("DOMContentLoaded", () => {
  // chips
  document.querySelectorAll(".chip").forEach((ch) => {
    ch.addEventListener("click", () => {
      document
        .querySelectorAll(".chip")
        .forEach((x) => x.classList.remove("active"));
      ch.classList.add("active");
      STATUS_FILTRO = ch.dataset.chip || "todos";
      aplicarFiltroBuscaEChips();
    });
  });
  // busca
  document
    .getElementById("filtroBusca")
    ?.addEventListener("input", aplicarFiltroBuscaEChips);

  // rodapé: topo e salvar
  document
    .getElementById("btnScrollTop")
    ?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  document.getElementById("btnSalvarTudo")?.addEventListener("click", (e) => {
    e.preventDefault();
    abrirConfirmacaoSalvar();
  });

  // rodapé: topo e salvar
  document
    .getElementById("btnScrollTop")
    ?.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  document.getElementById("btnSalvarTudo")?.addEventListener("click", (e) => {
    e.preventDefault();
    abrirConfirmacaoSalvar();
  });

  document
    .getElementById("cancelConfirmSave")
    ?.addEventListener("click", () => closeModal("confirmSaveModal"));

  // ✅ SALVAR PARCIAL
  document
    .getElementById("confirmSavePartial")
    ?.addEventListener("click", () => {
      document.getElementById("acaoSalvar").value = "parcial";
      document.getElementById("formFreq").submit();
    });

  // ✅ FINALIZAR
  document
    .getElementById("confirmFinalize")
    ?.addEventListener("click", () => {
      document.getElementById("acaoSalvar").value = "finalizar";
      document.getElementById("formFreq").submit();
    });
});

// abre modal de confirmação
function abrirConfirmacaoSalvar() {
  document.getElementById("confirmDirtyCount").textContent = DIRTY_SET.size;
  document.getElementById("confirmMesAno").textContent =
    `${document.getElementById('mes')?.value}/${document.getElementById('ano')?.value}`;
  document.getElementById("confirmSaveModal").classList.remove("hidden");
}


// util dos seus modais
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

async function openBenefits(elementoOuId) {
  const modal = document.getElementById("benefitsModal");
  const body = modal.querySelector(".modal-body");


  modal.classList.remove("hidden");

  // resolve o pacienteId a partir do elemento
  let pacienteId = null;
  if (typeof elementoOuId === "number" || typeof elementoOuId === "string") {
    pacienteId = String(elementoOuId);
  } else if (elementoOuId?.dataset?.pacienteId) {
    pacienteId = elementoOuId.dataset.pacienteId;
  } else {
    const tr =
      elementoOuId?.closest?.("tr.table-row") ||
      document.activeElement?.closest?.("tr.table-row");
    pacienteId = tr?.dataset?.pacienteId || null;
  }

  // estado de carregamento
  body.innerHTML = `
    <div class="benefit-item">
      <div class="benefit-header">
        <div><h4 class="benefit-name">Carregando benefícios…</h4>
        <p class="benefit-date" style="opacity:.7">aguarde</p></div>
      </div>
    </div>
  `;

  if (!pacienteId) {
    body.innerHTML = `<p style="color:#ef4444">Não foi possível identificar o paciente.</p>`;
    return;
  }

  try {
    const resp = await fetch(`/api/verificar_beneficios_mes/${pacienteId}`);
    if (!resp.ok) throw new Error("Erro ao buscar benefícios.");
    const data = await resp.json();

    const beneficios = data.beneficios || [];

    if (!data.tem_beneficio || beneficios.length === 0) {
      body.innerHTML = `<p style="opacity:.75">Nenhum benefício disponível para este paciente.</p>`;
      return;
    }

    // renderiza benefícios
    body.innerHTML = beneficios
      .map(
        (b) => `
      <div class="benefit-item ${b.usado ? "benefit-used" : ""}">
        <div class="benefit-header">
          <div>
            <h4 class="benefit-name">${b.titulo}</h4>
            <p class="benefit-date">
              ${b.usado ? "Utilizado" : "Disponível"}
              ${b.percentual ? ` • ${b.percentual}%` : ""}
            </p>
          </div>
          ${b.usado
            ? `<span class="benefit-status utilizado">Utilizado</span>`
            : `<span class="benefit-status disponivel">Disponível</span>`
          }
        </div>
      </div>
    `
      )
      .join("");
  } catch (e) {
    body.innerHTML = `<p style="color:#ef4444">${e.message}</p>`;
  }
}

// ✅ expõe globalmente pro onclick inline funcionar
window.openBenefits = openBenefits;
async function openHistory(botaoOuId) {
  const modal = document.getElementById("historyModal");
  const body = modal.querySelector(".modal-body");

  // resolve pacienteId
  let pacienteId = null;
  if (typeof botaoOuId === "number" || typeof botaoOuId === "string") {
    pacienteId = botaoOuId;
  } else {
    const tr = botaoOuId.closest("tr.table-row");
    pacienteId = tr?.dataset?.pacienteId;
  }

  modal.classList.remove("hidden");
  body.innerHTML = `<p style="opacity:.7;">Carregando histórico...</p>`;

  if (!pacienteId) {
    body.innerHTML = `<p style="color:#ef4444">Paciente não identificado.</p>`;
    return;
  }

  try {
    const resp = await fetch(`/api/lista_status/${pacienteId}`);
    if (!resp.ok) throw new Error("Erro ao buscar histórico.");
    const data = await resp.json();

    if (!data.length) {
      body.innerHTML = `<p style="opacity:.75">Nenhum histórico disponível para este paciente.</p>`;
      return;
    }

    // função auxiliar local (pode ficar fora também)
    function normalizeStatus(raw) {
      const s = String(raw || '').toLowerCase().trim();
      if (s.includes('premium')) return 'premium';
      if (s.includes('vip')) return 'vip';
      if (s.includes('plus')) return 'plus';
      if (s.includes('primeiro')) return 'primeiro_mes';
      if (s.includes('indefinido')) return 'indefinido';
      return 'outro';
    }
    function badgeClass(statusKey) {
      switch (statusKey) {
        case 'premium': return 'badge badge-premium';
        case 'vip': return 'badge badge-vip';
        case 'plus': return 'badge badge-plus';
        case 'primeiro_mes': return 'badge badge-primeiro_mes';
        case 'indefinido': return 'badge badge-indefinido';
        default: return 'badge badge-outro';
      }
    }

    // renderiza o histórico
    body.innerHTML = data.map(item => {
      const key = normalizeStatus(item.status);
      const badge = badgeClass(key);
      const ganhou = item.ganhou_beneficio ? "status-completed" : "status-scheduled";

      return `
        <div class="history-item">
          <div class="history-date">${item.mes}/${item.ano}</div>
          <div class="history-details">
            <div class="details">
              <span class="history-type">Frequência Esperada: ${item.freq_programada}</span>
              <span class="history-type">Frequência real: ${item.freq_sistema}</span>
            </div>
            <div class="details">
              <span class="history-status ${badge}">${item.status}</span>
              <span class="history-status ${ganhou}">${item.ganhou_beneficio ? 'Ganhou' : 'Não Ganhou'}</span>
            </div>
          </div>
        </div>`;
    }).join('');

  } catch (e) {
    body.innerHTML = `<p style="color:#ef4444">${e.message}</p>`;
  }
}

