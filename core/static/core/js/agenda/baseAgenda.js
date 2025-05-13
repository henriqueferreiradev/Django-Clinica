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

