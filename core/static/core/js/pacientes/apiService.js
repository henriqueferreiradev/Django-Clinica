// apiService.js
export async function checkCPF(cpf) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
        const response = await fetch(`/api/verificar-cpf/?cpf=${cpf}`, {
            signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        if (!response.ok) throw new Error('Erro na resposta da API');
        return await response.json();
    } catch (error) {
        console.error('Erro ao verificar CPF:', error);
        throw error;
    }
}

export async function buscarCEP(cep) {
    const cepNumerico = cep.replace(/\D/g, '');
    
    if (cepNumerico.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cepNumerico}/json/`);
    const data = await response.json();
    
    if (data.erro) {
        throw new Error('CEP não encontrado');
    }
    
    return data;
}