document.querySelectorAll('.formField input, .formField textarea, .formField select').forEach(el => {
    const atualizarClasse = () => {
        if (el.value.trim()) {
            el.classList.add('input-preenchido');
        } else {
            el.classList.remove('input-preenchido');
        }
    };

    el.addEventListener('input', atualizarClasse);  // para digitação em inputs/textarea
    el.addEventListener('change', atualizarClasse); // para selects
    el.addEventListener('blur', atualizarClasse);   // ao perder o foco

    // Inicializa corretamente no carregamento
    atualizarClasse();
});

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
    }
    const nascimentoInput = document.getElementById('nascimentoInput');
    if (nascimentoInput) {
        IMask(nascimentoInput, {
            mask: '00/00/0000'
        });
    }
    const cnpjInput = document.getElementById('cnpjInput');
    if (cnpjInput) {
        IMask(cnpjInput, {
            mask: '00.000.000/0000-00'
        });
    }

}
function capitalizeWords(str) {
    return str.replace(/\b\w/g, c => c.toUpperCase()).replace(/\B\w*/g, c => c.toLowerCase());
}

document.querySelectorAll('.capitalize-input').forEach(input => {
    input.addEventListener('input', function () {
        const caret = this.selectionStart; // salva posição do cursor
        this.value = capitalizeWords(this.value);
        this.setSelectionRange(caret, caret); // mantém posição do cursor
    });
});
inputMasks()
capitalizeWords()