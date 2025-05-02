 
function previewImage(event) {
    const preview = document.getElementById('preview');
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = '#';
        preview.style.display = 'none';
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
function abrirModal() {
    document.getElementById("modalOverlay").style.display = "flex";
    inputMasks()

}
function abrirModalVisulizar() {

}

function abrirModalEditar(botao) {
    inputMasks()
    const id = botao.dataset.id;
    const nome = botao.dataset.nome;
    const cpf = botao.dataset.cpf;
    const telefone = botao.dataset.telefone;
    const rg = botao.dataset.rg;
    const data_nascimento = botao.dataset.data_nascimento;
    const cor = botao.dataset.cor_raca;
    const sexo = botao.dataset.sexo;
    const naturalidade = botao.dataset.naturalidade;
    const uf = botao.dataset.uf;
    const apelido = botao.dataset.apelido;
    const estado_civil = botao.dataset.estado_civil;
    const midia = botao.dataset.midia;


    const cep = botao.dataset.cep;
    const rua = botao.dataset.rua;
    const numero = botao.dataset.numero;
    const bairro = botao.dataset.bairro;
    const cidade = botao.dataset.cidade;
    const estado = botao.dataset.estado;
    const celular = botao.dataset.celular;
    const telEmergencia = botao.dataset.telEmergencia;
    const email = botao.dataset.email;
    const observacao = botao.dataset.observacao;


    // cadastro paciente
    document.getElementById('pacienteId').value = id;
    document.getElementById('nomeInput').value = nome;
    document.getElementById('cpfInput').value = cpf;
    document.getElementById('rgInput').value = rg
    document.getElementById('nascimentoInput').value = data_nascimento
    document.getElementById('corInput').value = cor
    document.getElementById('sexoInput').value = sexo
    document.getElementById('naturalidadeInput').value = naturalidade
    document.getElementById('ufInput').value = uf
    document.getElementById('nomeSocialInput').value = apelido
    document.getElementById('estadoCivilInput').value = estado_civil
    document.getElementById('midiaInput').value = midia

    // cadastro endereço
    document.getElementById('cepInput').value = cep
    document.getElementById('ruaInput').value = rua
    document.getElementById('numero').value = numero
    document.getElementById('bairro').value = bairro
    document.getElementById('cidade').value = cidade
    document.getElementById('estado').value = estado
    document.getElementById('telefoneInput').value = telefone;
    document.getElementById('celularInput').value = celular;
    document.getElementById('telEmergenciaInput').value = telEmergencia;
    document.getElementById('emailInput').value = email;
    document.getElementById('observacaoInput').value = observacao;



    document.getElementById('modalTitulo').textContent = 'Editar Paciente - ' + botao.dataset.nome;




    document.getElementById('modalOverlay').style.display = 'flex';
}

function fecharModal() {
    document.getElementById('modalOverlay').style.display = 'none';


    document.getElementById('formPaciente').reset();
    document.getElementById('pacienteId').value = '';
    document.getElementById('modalTitulo').textContent = "Cadastrar Paciente";
}

document.querySelector('input[name="q"]').addEventListener('keyup', function () {
    const search = this.value.toLowerCase();
    const rows = document.querySelectorAll("table tbody tr");

    rows.forEach(function (row) {
        const nome = row.querySelector("td:nth-child(2)").textContent.toLowerCase();
        const cpf = row.querySelector("td:nth-child(3)").textContent.toLowerCase();

        const match = nome.includes(search) || cpf.includes(search);
        row.style.display = match ? "" : "none";
    });
})
function temporizadorAlerta() {
    setTimeout(() => {
        const alert = document.getElementById("alert-container");
        if (alert) alert.style.display = "none";
      }, 4000); 
}

temporizadorAlerta()