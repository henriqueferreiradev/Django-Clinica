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

function inputMasks() {
    const cpfInput = document.getElementById('cpfInput');
    if (cpfInput) {
        IMask(cpfInput, {
            mask: '000.000.000-00'
        });
    }

    const telefoneInput = document.getElementById('telefoneInput');
    if (telefoneInput) {
        IMask(telefoneInput, {
            mask: '(00) 0000-0000'
        });
    }

    const cepInput = document.getElementById('cepInput');
    if (cepInput) {
        IMask(cepInput, {
            mask: '00.000-000'
        });
    }

    const celularInput = document.getElementById('celularInput');
    if (celularInput) {
        IMask(celularInput, {
            mask: '(00) 00000-0000'
        });
    }

    const rgInput = document.getElementById('rgInput');
    if (rgInput) {
        IMask(rgInput, {
            mask: '00.000.000-0'
        });
    }
    const telEmergenciaInput = document.getElementById('telEmergenciaInput');
    if (telEmergenciaInput) {
        IMask(telEmergenciaInput, {
            mask: '(00) 00000-0000'
        });
        const nascimentoInput = document.getElementById('nascimentoInput');
        if (nascimentoInput) {
            IMask(nascimentoInput, {
                mask: '00/00/0000'
            });
        }
    }
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
 

// ===== DEBUG RESPONSÁVEL MENOR DE IDADE =====
(function () {
    console.log("✅ DEBUG responsável iniciado");

    const nascimentoInput = document.querySelector("#nascimento");
    const boxResponsavel = document.querySelector("#responsavelBox");

    console.log("🔎 nascimentoInput encontrado?", !!nascimentoInput, nascimentoInput);
    console.log("🔎 responsavelBox encontrado?", !!boxResponsavel, boxResponsavel);

    if (!nascimentoInput) {
        console.warn("❌ #nascimento não encontrado. Confere o id no HTML.");
        return;
    }

    if (!boxResponsavel) {
        console.warn("❌ #responsavelBox não encontrado. Confere se a div existe no step-2 com esse id.");
        return;
    }

    function parseBRDate(str) {
        // aceita DD/MM/AAAA
        if (!str || typeof str !== "string") return null;

        const parts = str.split("/");
        if (parts.length !== 3) return null;

        const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
        if (!dd || !mm || !yyyy) return null;

        const dt = new Date(yyyy, mm - 1, dd);
        // valida se a data não virou outra (ex: 32/13/2020)
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
        console.log("📅 parseBRDate:", valor, "=>", dt);

        if (!dt) return false;

        const idade = calcIdade(dt);
        console.log("🎯 idade calculada:", idade);

        return idade < 18;
    }

    function toggleResponsavel() {
        const valor = nascimentoInput.value;
        console.log("🧪 nascimentoInput.value:", valor);

        const menor = isMenorDeIdade(valor);
        console.log("👶 é menor?", menor);

        if (menor) {
            boxResponsavel.classList.remove("hidden");
            console.log("✅ removi .hidden do responsavelBox");
            // torna obrigatórios só os campos do box
            boxResponsavel.querySelectorAll("input, select, textarea").forEach(el => {
                el.setAttribute("required", "true");
            });
        } else {
            boxResponsavel.classList.add("hidden");
            console.log("✅ adicionei .hidden no responsavelBox");
            boxResponsavel.querySelectorAll("input, select, textarea").forEach(el => {
                el.removeAttribute("required");
                el.classList.remove("error");
            });
        }

        console.log("📦 classList do responsavelBox:", boxResponsavel.className);
        console.log("📦 display computado:", window.getComputedStyle(boxResponsavel).display);
    }

    // Eventos (testa todos pra garantir)
    ["input", "change", "blur"].forEach(evt => {
        nascimentoInput.addEventListener(evt, () => {
            console.log(`🟣 evento disparou: ${evt}`);
            toggleResponsavel();
        });
    });

    // Teste manual no console:
    window.__toggleResponsavel = toggleResponsavel;
    console.log("🧰 Use no console: __toggleResponsavel()");
})();




document.querySelector('input[name="q"]').addEventListener('keyup', function () {
    const search = this.value.toLowerCase();
    const rows = document.querySelectorAll("table tbody tr");

    rows.forEach(function (row) {
        const nome = row.querySelector("td:nth-child(1)").textContent.toLowerCase();
        const cpf = row.querySelector("td:nth-child(2)").textContent.toLowerCase();

        const match = nome.includes(search) || cpf.includes(search);
        row.style.display = match ? "" : "none";
    });

})