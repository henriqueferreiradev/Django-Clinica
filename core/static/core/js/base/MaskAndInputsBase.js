document.querySelectorAll('.form-input, .form-textarea,.form-select').forEach(el => {
    const atualizarClasse = () => {
        // Verifica se é radio/checkbox (usa `checked`) ou outro campo (usa `value`)
        const isFilled = el.type === 'radio' || el.type === 'checkbox'
            ? el.checked
            : el.value.trim() !== '';

        if (isFilled) {
            el.classList.add('input-preenchido');
        } else {
            el.classList.remove('input-preenchido');
        }
    };

    // Adiciona os listeners
    el.addEventListener('input', atualizarClasse);
    el.addEventListener('change', atualizarClasse);
    el.addEventListener('blur', atualizarClasse);

    // Inicializa o estado
    atualizarClasse();
});
function inputMasks() {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        IMask(cpfInput, {
            mask: '000.000.000-00'
        });
    }

    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        IMask(telefoneInput, {
            mask: '(00) 0000-0000'
        });
    }

    const cepInput = document.getElementById('cep');
    if (cepInput) {
        IMask(cepInput, {
            mask: '00.000-000'
        });
    }

    const celularInput = document.getElementById('celular');
    if (celularInput) {
        IMask(celularInput, {
            mask: '(00) 00000-0000'
        });
    }

    const rgInput = document.getElementById('rg');
    if (rgInput) {
        IMask(rgInput, {
            mask: '00.000.000-0'
        });
    }
    const telEmergenciaInput = document.getElementById('telEmergencia');
    if (telEmergenciaInput) {
        IMask(telEmergenciaInput, {
            mask: '(00) 00000-0000'
        });
    }
    const nascimentoInput = document.getElementById('nascimento');
    if (nascimentoInput) {
        IMask(nascimentoInput, {
            mask: '00/00/0000'
        });
    }
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        IMask(cnpjInput, {
            mask: '00.000.000/0000-00'
        });
    }


}
function capitalizeWords(str) {
    const lowercaseWords = ['da', 'de', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'com'];

    return str
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            if (lowercaseWords.includes(word) && index !== 0) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

document.querySelectorAll('.capitalize-input').forEach(input => {
    input.addEventListener('input', function () {
        const caret = this.selectionStart;
        this.value = capitalizeWords(this.value);
        this.setSelectionRange(caret, caret);
    });
});
inputMasks()
capitalizeWords()