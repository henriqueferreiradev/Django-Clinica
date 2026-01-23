
function setPage(pageNumber, event) {
    event.preventDefault();
    document.getElementById("page-input").value = pageNumber;
    document.getElementById("paginator-form").submit();
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

function setPage(pageNumber, event) {
    event.preventDefault();
    document.getElementById("page-input").value = pageNumber;
    document.getElementById("paginator-form").submit();
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
    // Fecha qualquer dropdown aberto antes
    document.querySelectorAll(".dropdown").forEach(drop => {
        if (drop !== button.nextElementSibling) {
            drop.style.display = "none";
        }
    });

    const dropdown = button.nextElementSibling;
    dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
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

function abrirFicha(url) {
    const novaAba = window.open(url, '_blank');
    novaAba.onload = function () {
        novaAba.print();
    };
}
