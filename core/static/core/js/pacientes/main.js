// main-admin.js (crie este novo arquivo)
import { showStep } from './formSteps.js';
import { setupFormNavigation, setupCEPHandler, setupImagePreview, setupCPFValidation } from './formHandlers.js';

document.addEventListener("DOMContentLoaded", function() {
    // Debug inicial
    console.log("Admin JS carregado");
    
    // Verifica elementos críticos
    const elements = {
        formSection: document.querySelector("#form-section"),
        steps: document.querySelectorAll(".form-step"),
        cpfField: document.getElementById("cpf")
    };
    console.log("Elementos encontrados:", elements);

    // Inicializa o formulário
    if (elements.steps.length > 0) {
        showStep(0);
        setupFormNavigation();
        setupCEPHandler();
        setupImagePreview();
        setupCPFValidation();
    } else {
        console.error("Elementos do formulário não encontrados!");
    }

    // Animação opcional (se existir #form-section)
    if (elements.formSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("slide-up");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        observer.observe(elements.formSection);
    }
});