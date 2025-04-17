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
                alert('CEP não encontrado ',{cep});
                console.log(cep)
                return;
            }

            document.getElementById('ruaInput').value = data.logradouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
        })
        .catch(error => {
            alert('Erro ao buscar o CEP');
            console.error(error);
        });

    return false; // impede o envio automático do form até você decidir
}
