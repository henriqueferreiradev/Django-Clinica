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


function abrirFicha(url) {
    const novaAba = window.open(url, '_blank');
    novaAba.onload = function () {
        novaAba.print();
    };
}

function setPage(pageNumber, event) {
    event.preventDefault();
    document.getElementById("page-input").value = pageNumber;
    document.getElementById("paginator-form").submit();
}

function montarEndereco(data) {
    const partes = []

    if (data.rua) partes.push(data.rua)
    if (data.numero) partes.push(data.numero)
    if (data.complemento) partes.push(data.complemento)
    if (data.bairro) partes.push(data.bairro)

    const cidadeEstado = []

    if (data.cidade) partes.push(data.cidade)
    if (data.estado) partes.push(data.estado)
    if (cidadeEstado.length) partes.push(cidadeEstado.join(' -'))

    if (data.cep) partes.push(`CEP: ${data.cep}`)

    return partes.join(', ')

}


function toggleDropdown(button) {
    const wrapper = button.closest(".dropdown-wrapper");
    const dropdown = wrapper.querySelector(".dropdown_menu");
    const buttonRect = button.getBoundingClientRect();

    // Fecha outros dropdowns abertos
    document.querySelectorAll(".dropdown_menu").forEach(menu => {
        if (menu !== dropdown) {
            menu.style.display = "none";
        }
    });

    // Alterna a visibilidade do dropdown atual
    const isOpening = dropdown.style.display !== "flex";
    dropdown.style.display = isOpening ? "flex" : "none";

    if (isOpening) {
        // Calcula dimensões
        const dropdownHeight = dropdown.offsetHeight || 200; // Altura estimada
        const dropdownWidth = dropdown.offsetWidth || buttonRect.width;

        // Calcula espaço disponível
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const spaceAbove = buttonRect.top;
        const spaceRight = window.innerWidth - buttonRect.left;
        const spaceLeft = buttonRect.right;

        // Posiciona o dropdown
        dropdown.style.position = "fixed";
        dropdown.style.width = `${dropdownWidth}px`;

        // Ajuste horizontal para não cortar na borda direita
        let leftPosition = buttonRect.left;
        if (leftPosition + dropdownWidth > window.innerWidth) {
            leftPosition = window.innerWidth - dropdownWidth - 5; // 5px de margem
        }
        dropdown.style.left = `${leftPosition}px`;

        // Ajuste vertical
        if (spaceBelow >= dropdownHeight || spaceBelow > spaceAbove) {
            // Abre para baixo
            dropdown.style.top = `${buttonRect.bottom}px`;
            dropdown.style.bottom = "auto";
        } else {
            // Abre para cima
            dropdown.style.top = "auto";
            dropdown.style.bottom = `${window.innerHeight - buttonRect.top}px`;
        }
    }


    function handleClickOutside(event) {
        if (!wrapper.contains(event.target)) {
            dropdown.style.display = "none";
            document.removeEventListener("click", handleClickOutside);
        }
    }

    setTimeout(() => {
        if (dropdown.style.display === "flex") {
            document.addEventListener("click", handleClickOutside);
        }
    }, 10);
}

function temporizadorAlerta() {
    setTimeout(() => {
        const alert = document.getElementById("alert-container");
        if (alert) alert.style.display = "none";
    }, 4000);
}

temporizadorAlerta()


let tooltipDelay;

function mostrarPopupComDelay(elemento) {
    tooltipDelay = setTimeout(() => {
        const popup = elemento.querySelector('.tooltip-popup');
        popup.style.display = 'block';
    }, 1000); // 1 segundo de delay
}

function ocultarPopup(elemento) {
    clearTimeout(tooltipDelay);
    const popup = elemento.querySelector('.tooltip-popup');
    popup.style.display = 'none';
}

const form = document.getElementById('multiStepForm');

form.addEventListener('submit', function (e) {
    e.preventDefault(); // impede submit normal

    fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(async r => {
            let data;
            try {
                data = await r.json();
            } catch {
                throw { erro: 'Erro inesperado no servidor' };
            }

            if (!r.ok) throw data;
            return data;
        })
        .then(data => {
            if (!data.ok) {
                mostrarMensagem(data.erro, 'error');
                return;
            }

            // ✅ sucesso
            window.location.href = data.redirect;
        })
        .catch(err => {
            mostrarMensagem(err.erro || 'Erro ao enviar formulário', 'error');
        });
});
  const radios = [
    document.getElementById("nf_reembolso_plano"),
    document.getElementById("nf_imposto_renda"),
    document.getElementById("nf_nao_aplica"),
  ];

  radios.forEach(r => {
    r.addEventListener("change", () => {
      radios.forEach(other => {
        if (other !== r) other.checked = false;
      });
    });
  });


(function () {
    const nascimentoInput = document.querySelector("#nascimento");
    const template = document.getElementById("responsavelTemplate");
    const mount = document.getElementById("responsavelMount");
  
    if (!nascimentoInput || !template || !mount) return;
  
    function parseBRDate(str) {
      if (!str || typeof str !== "string") return null;
      const parts = str.split("/");
      if (parts.length !== 3) return null;
  
      const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
      if (!dd || !mm || !yyyy) return null;
  
      const dt = new Date(yyyy, mm - 1, dd);
      if (dt.getFullYear() !== yyyy || dt.getMonth() !== (mm - 1) || dt.getDate() !== dd) return null;
      return dt;
    }
  
    function calcIdade(nascDate) {
      const hoje = new Date();
      let idade = hoje.getFullYear() - nascDate.getFullYear();
      const m = hoje.getMonth() - nascDate.getMonth();
      if (m < 0 || (m === 0 && hoje.getDate() < nascDate.getDate())) idade--;
      return idade;
    }
  
    function isMenorDeIdade(valor) {
      const dt = parseBRDate(valor);
      if (!dt) return false;
      return calcIdade(dt) < 18;
    }
  
    function existeResponsavelNoDOM() {
      return !!document.getElementById("responsavelBox");
    }
  
    function montarResponsavel() {
      if (existeResponsavelNoDOM()) return;
      const fragment = template.content.cloneNode(true);
      mount.appendChild(fragment);
    }
  
    function desmontarResponsavel() {
      const box = document.getElementById("responsavelBox");
      if (box) box.remove();
    }
  
    function syncResponsavel() {
      const menor = isMenorDeIdade(nascimentoInput.value);
  
      if (menor) {
        montarResponsavel();
      } else {
        desmontarResponsavel();
      }
    }
  
    ["input", "change", "blur"].forEach(evt => {
      nascimentoInput.addEventListener(evt, syncResponsavel);
    });
  
    // roda uma vez ao carregar (caso já venha preenchido)
    syncResponsavel();
  })();
  