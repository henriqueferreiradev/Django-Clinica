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
    // CPF - use a classe .cpf-mask
    document.querySelectorAll('.cpf-mask').forEach(input => {
        IMask(input, { mask: '000.000.000-00' });
    });

    // Data - use a classe .date-mask
    document.querySelectorAll('.date-mask').forEach(input => {
        IMask(input, { mask: '00/00/0000' });
    });

    // Telefone fixo
    document.querySelectorAll('.phone-mask').forEach(input => {
        IMask(input, { mask: '(00) 0000-0000' });
    });

    // Celular
    document.querySelectorAll('.cel-mask').forEach(input => {
        IMask(input, { mask: '(00) 00000-0000' });
    });

    // RG
    document.querySelectorAll('.rg-mask').forEach(input => {
        IMask(input, { mask: '00.000.000-0' });
    });

    // CEP
    document.querySelectorAll('.cep-mask').forEach(input => {
        IMask(input, { mask: '00.000-000' });
    });

    // CNPJ
    document.querySelectorAll('.cnpj-mask').forEach(input => {
        IMask(input, { mask: '00.000.000/0000-00' });
    });

    document.querySelectorAll('.insta-mask').forEach(input => {
        IMask(input, { mask: '@' });
    });
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