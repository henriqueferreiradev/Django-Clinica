function abrirFicha(url) {
    const novaAba = window.open(url, '_blank');
    novaAba.onload = function () {
        novaAba.print();
    };
}

function previewImage(event) {
    const preview = document.getElementById('preview');
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();

        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block'; // Exibe a imagem
        };

        reader.readAsDataURL(file);
    }
}

function atualizarContador() {
    const textarea = document.getElementById('observacaoInput');
    const contador = document.getElementById('contador');
    contador.textContent = textarea.value.length;
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

    document.querySelectorAll(".dropdown_menu").forEach(menu => {
        if (menu !== dropdown) {
            menu.style.display = "none";
        }
    });

    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";

    function handleClickOutside(event) {
        if (!wrapper.contains(event.target)) {
            dropdown.style.display = "none";
            document.removeEventListener("click", handleClickOutside);
        }
    }

    setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
    }, 0);
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