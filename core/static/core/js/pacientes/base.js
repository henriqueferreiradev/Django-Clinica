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