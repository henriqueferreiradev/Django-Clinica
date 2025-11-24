// formHandlers.js
import { showStep, validateCurrentStep, validateAllSteps, steps, nextStep, getCurrentStep, prevStep } from './formSteps.js';
import { buscarCEP } from './apiService.js';


export function setupFormNavigation() {
    const nextBtns = document.querySelectorAll(".btn-next");
    const prevBtns = document.querySelectorAll(".btn-prev");
    const submitBtn = document.getElementById('submitBtn');
    const formContent = document.getElementById('form-content');


    nextBtns.forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();
            btn.disabled = true;

            try {
                if (await validateCurrentStep()) {
                    nextStep();
                    showStep(getCurrentStep());
                    if (formContent) {
                        formContent.scrollTo({ top: 0, behavior: "smooth" });

                    } else {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                    }
                } else {
                    const firstError = steps[getCurrentStep()].querySelector(".error");
                    if (firstError) {
                        firstError.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
            } catch (error) {
                console.error('Erro durante validação:', error);
            } finally {
                btn.disabled = false;
            }
        });
    });

    prevBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            prevStep();
            showStep(getCurrentStep());
            if (formContent) {
                formContent.scrollTo({ top: 0, behavior: "smooth" });

            } else {
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        });
    });

    submitBtn.addEventListener('click', function (e) {
        e.preventDefault();

        if (validateAllSteps()) {
            this.querySelector('.btn-text').classList.add('hidden');
            this.querySelector('.btn-loading').classList.remove('hidden');
            document.querySelector('form').submit();
        } else {
            const firstInvalidStep = [...steps].findIndex(step =>
                step.querySelector("[required].error")
            );

            if (firstInvalidStep !== -1) {
                getCurrentStep() = firstInvalidStep;
                showStep(getCurrentStep());
                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        }
    });

    document.querySelectorAll(".form-input, .form-select, .form-textarea").forEach((field) => {
        field.addEventListener("input", function () {
            if (this.value) {
                this.classList.remove("error");
                const errorMsg = this.parentNode.querySelector(".error-message");
                if (errorMsg) errorMsg.remove();
            }
        });
    });
}

export function setupCEPHandler() {
    const btnBuscarCep = document.getElementById("btnBuscarCep");
    if (btnBuscarCep) {
        btnBuscarCep.addEventListener("click", async function () {
            const cepField = document.getElementById("cep");
            const cep = cepField.value;

            try {
                btnBuscarCep.innerHTML = '<span class="btn-loading"></span> Buscando...';
                btnBuscarCep.disabled = true;

                const data = await buscarCEP(cep);

                document.getElementById("rua").value = data.logradouro;
                document.getElementById("bairro").value = data.bairro;
                document.getElementById("cidade").value = data.localidade;
                document.getElementById("estado").value = data.uf;
                document.getElementById("numero").focus();

            } catch (error) {
                console.error("Erro ao buscar CEP:", error);
                alert(error.message);
                cepField.classList.add("error");
            } finally {
                btnBuscarCep.innerHTML = "Buscar CEP";
                btnBuscarCep.disabled = false;
            }
        });
    }
}

export function setupImagePreview() {
    function previewImage(event) {
        const input = event.target;
        const preview = document.getElementById("filePreview");

        if (input.files && input.files[0]) {
            const reader = new FileReader();
            const file = input.files[0];

            if (file.size > 2 * 1024 * 1024) {
                alert("A imagem deve ter no máximo 2MB");
                input.value = "";
                return;
            }

            reader.onload = function (e) {
                preview.innerHTML = `
                <div class="preview-image">
                    <img src="${e.target.result}" alt="Pré-visualização da foto">
                    <button type="button" class="btn-remove-image" aria-label="Remover imagem">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18 6L6 18M6 6L18 18" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>`;

                const btnRemove = preview.querySelector(".btn-remove-image");
                btnRemove.addEventListener("click", function () {
                    input.value = "";
                    preview.innerHTML = "";
                });
            };

            reader.readAsDataURL(input.files[0]);
        }
    }

    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
        fileInput.addEventListener('change', previewImage);
    }
}

export function setupCPFValidation() {
    const cpfField = document.getElementById('cpf');
    if (cpfField) {
        cpfField.addEventListener('blur', function () {
            if (this.value) {
                const cpfFeedback = this.nextElementSibling?.classList?.contains("error-message")
                    ? this.nextElementSibling
                    : document.createElement("span");

                if (!validarCPF(this.value)) {
                    this.classList.add("error");
                    cpfFeedback.textContent = 'CPF inválido';
                    cpfFeedback.className = "error-message";
                    cpfFeedback.style.color = '#d32f2f';
                    this.after(cpfFeedback);
                } else {
                    this.classList.remove("error");
                    if (cpfFeedback.classList.contains("error-message")) {
                        cpfFeedback.remove();
                    }
                }
            }
        });
    }
}