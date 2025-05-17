let modoPercentual = true;

window.calcularDesconto = function () {
    const valorPacote = parseFloat(document.getElementById('valor_pacote').value) || 0;
    const desconto = parseFloat(document.getElementById('desconto').value) || 0;
    let valorFinal = 0;

    if (modoPercentual) {
        valorFinal = valorPacote - (valorPacote * (desconto / 100));
    } else {
        valorFinal = valorPacote - desconto;
    }

    document.getElementById('valor_final').value = valorFinal.toFixed(2);
};

window.alternarModoDesconto = function () {
    modoPercentual = !modoPercentual;
    const descontoButton = document.getElementById('desconto_button');
    const descontoLabel = document.getElementById('desconto_label');
    descontoLabel.textContent = modoPercentual ? 'Desconto (%)' : 'Desconto (R$)';
    descontoButton.textContent = modoPercentual ? 'R$' : '%';
    calcularDesconto();
};

window.alterarDesconto = function () {
    const valorPacote = parseFloat(document.getElementById('valor_pacote').value) || 0;
    const valorFinal = parseFloat(document.getElementById('valor_final').value) || 0;

    let descontoCalculado = 0;

    if (modoPercentual && valorPacote !== 0) {
        descontoCalculado = ((valorPacote - valorFinal) / valorPacote) * 100;
    } else {
        descontoCalculado = valorPacote - valorFinal;
    }

    document.getElementById('desconto').value = descontoCalculado.toFixed(2);
};

// Quando trocar o serviço no select:
document.getElementById('pacotesInput').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    const valor = parseFloat(selectedOption.getAttribute('data-valor')) || 0;

    document.getElementById('valor_pacote').value = valor.toFixed(2);
    calcularDesconto();  // <- necessário para atualizar o valor final automaticamente
});

const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const sidebar = document.getElementById('sidebar');

openBtn.addEventListener('click', () => {
    sidebar.classList.add('active');
});

closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

const input = document.getElementById('busca');
const sugestoes = document.getElementById('sugestoes');
const pacienteIdInput = document.getElementById('paciente_id');

input.addEventListener('input', async () => {
    const query = input.value.trim();
    if (query.length === 0) {
        sugestoes.innerHTML = '';
        pacienteIdInput.value = '';
        return;
    }

    try {
        const res = await fetch(`/api/buscar-pacientes/?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);
        const data = await res.json();

        sugestoes.innerHTML = '';
        data.resultados.forEach(paciente => {
            const div = document.createElement('div');
            div.textContent = `${paciente.nome} ${paciente.sobrenome} - ${paciente.cpf}`;
            div.style.padding = '5px';
            div.style.cursor = 'pointer';

            div.addEventListener('click', () => {
                input.value = `${paciente.nome} ${paciente.sobrenome} - ${paciente.cpf}`;
                pacienteIdInput.value = paciente.id;
                sugestoes.innerHTML = '';  // esconde sugestões
            });

            sugestoes.appendChild(div);
        });
    } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
    }
});

document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('.submenu-header').forEach(header => {
        header.addEventListener('click', function () {
            const submenu = this.parentElement;
            submenu.classList.toggle('open');
        });
    });
});


document.getElementById('pacotesInput').addEventListener('change', function () {
    const selectedOption = this.options[this.selectedIndex];
    const valor = selectedOption.getAttribute('data-valor');

    const valorInput = document.getElementById('valor_pacote');
    valorInput.value = valor || '';
});