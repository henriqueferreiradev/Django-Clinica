
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

        reader.onload = function(e) {
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
function abrirModal(profissionalId) {
    console.log("Chamando modal para o profissional:", profissionalId);
    fetch(`/api/profissional/${profissionalId}/`)
        .then(response => response.json())
        .then(data => {
            const endereco = montarEndereco(data)
            document.getElementById('profissionalNome').innerText = `Perfil do profissional - ${data.nome} ${data.sobrenome}`;
            document.getElementById('profissionalNascimento').innerText = `Nascimento: ${data.nascimento}`;
            document.getElementById('profissionalIdade').innerText = data.idade;
            document.getElementById('profissionalRg').innerText = data.rg;
            document.getElementById('profissionalCpf').innerText = data.cpf;
            document.getElementById('profissionalTelefone').innerText = data.telefone;
            document.getElementById('profissionalCelular').innerText = data.celular;
            document.getElementById('profissionalCor').innerText = data.cor_raca;
            document.getElementById('profissionalSexo').innerText = data.sexo;
            document.getElementById('profissionalEstadoCivil').innerText = data.estado_civil;
            document.getElementById('profissionalEmail').innerText = data.email;
            document.getElementById('profissionalEndereco').innerText = endereco;
            document.getElementById('profissionalObs').innerText = data.observacao;
            const img = document.getElementById('profissionalFoto');
         
            
            if (data.foto) {
              img.src = window.location.origin + data.foto;
            } else {
              img.src = "/static/core/img/defaultPerfil.png";
            }
            // Mostrar modal
            document.getElementById('modalOverlay').style.display = 'flex';
        });
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';
}

function abrirFicha(url) {
    const novaAba = window.open(url, '_blank');
    novaAba.onload = function () {
      novaAba.print();
    };
  }
