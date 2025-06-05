function buscarCep() {
    let cep = document.getElementById('cepInput').value.replace(/\D/g, '');

    if (cep.length !== 8) {
        alert('CEP inválido');
        return false; // impede o envio do form
    }

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
            if (data.erro) {
                alert('CEP não encontrado ', { cep });
                console.log(cep);
                return;
            }

            const rua = document.getElementById('ruaInput');
            const bairro = document.getElementById('bairro');
            const cidade = document.getElementById('cidade');
            const estado = document.getElementById('estado');

            rua.value = data.logradouro || '';
            bairro.value = data.bairro || '';
            cidade.value = data.localidade || '';
            estado.value = data.uf || '';

            // Forçar o "input" para o label subir
            rua.dispatchEvent(new Event('input'));
            bairro.dispatchEvent(new Event('input'));
            cidade.dispatchEvent(new Event('input'));
            estado.dispatchEvent(new Event('input'));
        })
        .catch(error => {
            alert('Erro ao buscar o CEP');
            console.error(error);
        });

    return false;
}
