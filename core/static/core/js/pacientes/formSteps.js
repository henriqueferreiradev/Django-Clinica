// formSteps.js
import { validarCPF, validarFormatoCPF } from './formValidation.js';
import { checkCPF } from './apiService.js';

export const steps = document.querySelectorAll(".form-step");
export const progressSteps = document.querySelectorAll(".progress-step");
export let currentStep = 0;

 
const state = {
    currentStep: 0,
    
};

export function getCurrentStep() {
    return state.currentStep;
}

export function setCurrentStep(step) {
    state.currentStep = step;
}

export function nextStep() {
    state.currentStep++;
}

export function prevStep() {
    state.currentStep--;
}
export function showStep(index) {
    steps.forEach((step, i) => {
        step.classList.toggle("active", i === index);
        step.setAttribute("aria-hidden", i !== index);
    });

    progressSteps.forEach((step, i) => {
        step.classList.toggle("active", i <= index);
        step.setAttribute("aria-current", i === index ? "step" : "false");
    });

    currentStep = index;
}

export async function validateCurrentStep() {
    const currentStepFields = steps[currentStep].querySelectorAll("[required]");
    let isValid = true;

    currentStepFields.forEach((field) => {
        if (!field.value) {
            field.classList.add("error");
            isValid = false;

            if (!field.nextElementSibling?.classList?.contains("error-message")) {
                const errorMsg = document.createElement("span");
                errorMsg.className = "error-message";
                errorMsg.textContent = "Este campo é obrigatório";
                field.after(errorMsg);
            }
        }
    });

    if (!isValid) return false;

    const cpfField = steps[currentStep].querySelector('#cpf');
    if (cpfField) {
        let cpfFeedback = cpfField.nextElementSibling?.classList?.contains("error-message")
            ? cpfField.nextElementSibling
            : document.createElement("span");

        if (!cpfFeedback.classList.contains("error-message")) {
            cpfFeedback.className = "error-message";
            cpfField.after(cpfFeedback);
        }

        const cpfNumerico = cpfField.value.replace(/\D/g, '');

        if (cpfNumerico.length !== 11) {
            cpfField.classList.add("error");
            cpfFeedback.textContent = 'CPF deve ter 11 dígitos';
            cpfFeedback.style.color = '#d32f2f';
            return false;
        }

        if (!validarCPF(cpfField.value)) {
            cpfField.classList.add("error");
            cpfFeedback.textContent = 'CPF inválido';
            cpfFeedback.style.color = '#d32f2f';
            return false;
        }

        try {
            cpfFeedback.textContent = 'Verificando CPF...';
            cpfFeedback.style.color = '#666';

            // Verifica se está em modo de edição (procura um campo hidden com o ID)
            const pacienteId = document.querySelector('input[name="paciente_id"]')?.value || null;
            const data = await checkCPF(cpfField.value, pacienteId);

            if (data.existe) {
                cpfField.classList.add("error");
                cpfFeedback.textContent = 'Este CPF já está cadastrado para outro paciente!';
                cpfFeedback.style.color = '#d32f2f';
                return false;
            }

            cpfFeedback.textContent = '';
            return true;

        } catch (error) {
            cpfFeedback.textContent = 'Erro na verificação. Tente novamente.';
            cpfFeedback.style.color = '#d32f2f';
            return false;
        }
    }

    return isValid;
}
export function validateAllSteps() {
    let allValid = true;

    steps.forEach((step) => {
        const fields = step.querySelectorAll("[required]");
        fields.forEach(field => {
            if (!field.value) {
                allValid = false;
                field.classList.add("error");

                if (!field.nextElementSibling || !field.nextElementSibling.classList.contains("error-message")) {
                    const errorMsg = document.createElement("span");
                    errorMsg.className = "error-message";
                    errorMsg.textContent = "Este campo é obrigatório";
                    field.after(errorMsg);
                }
            }
        });
    });

    return allValid;
}