// main-admin.js (crie este novo arquivo)
import { showStep } from './formSteps.js';
import { setupFormNavigation, setupCEPHandler, setupImagePreview, setupCPFValidation } from './formHandlers.js';

document.addEventListener("DOMContentLoaded", function () {
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

// ===== DEBUG RESPONSÁVEL MENOR DE IDADE =====
(function () {
    console.log("✅ DEBUG responsável iniciado");

    const nascimentoInput = document.querySelector("#nascimento");
    const boxResponsavel = document.querySelector("#responsavelBox");

    console.log("🔎 nascimentoInput encontrado?", !!nascimentoInput, nascimentoInput);
    console.log("🔎 responsavelBox encontrado?", !!boxResponsavel, boxResponsavel);

    if (!nascimentoInput) {
        console.warn("❌ #nascimento não encontrado. Confere o id no HTML.");
        return;
    }

    if (!boxResponsavel) {
        console.warn("❌ #responsavelBox não encontrado. Confere se a div existe no step-2 com esse id.");
        return;
    }

    function parseBRDate(str) {
        // aceita DD/MM/AAAA
        if (!str || typeof str !== "string") return null;

        const parts = str.split("/");
        if (parts.length !== 3) return null;

        const [dd, mm, yyyy] = parts.map(p => parseInt(p, 10));
        if (!dd || !mm || !yyyy) return null;

        const dt = new Date(yyyy, mm - 1, dd);
        // valida se a data não virou outra (ex: 32/13/2020)
        if (dt.getFullYear() !== yyyy || dt.getMonth() !== (mm - 1) || dt.getDate() !== dd) return null;

        return dt;
    }

    function calcIdade(nascDate) {
        const hoje = new Date();
        let idade = hoje.getFullYear() - nascDate.getFullYear();
        const m = hoje.getMonth() - nascDate.getMonth();
        if (m < 0 || (m === 0 && hoje.getDate() < nascDate.getDate())) idade--;
        return idade;
    }

    function isMenorDeIdade(valor) {
        const dt = parseBRDate(valor);
        console.log("📅 parseBRDate:", valor, "=>", dt);

        if (!dt) return false;

        const idade = calcIdade(dt);
        console.log("🎯 idade calculada:", idade);

        return idade < 18;
    }

    function toggleResponsavel() {
        const valor = nascimentoInput.value;
        console.log("🧪 nascimentoInput.value:", valor);

        const menor = isMenorDeIdade(valor);
        console.log("👶 é menor?", menor);

        if (menor) {
            boxResponsavel.classList.remove("hidden");
            console.log("✅ removi .hidden do responsavelBox");
            // torna obrigatórios só os campos do box
            boxResponsavel.querySelectorAll("input, select, textarea").forEach(el => {
                el.setAttribute("required", "true");
            });
        } else {
            boxResponsavel.classList.add("hidden");
            console.log("✅ adicionei .hidden no responsavelBox");
            boxResponsavel.querySelectorAll("input, select, textarea").forEach(el => {
                el.removeAttribute("required");
                el.classList.remove("error");
            });
        }

        console.log("📦 classList do responsavelBox:", boxResponsavel.className);
        console.log("📦 display computado:", window.getComputedStyle(boxResponsavel).display);
    }

    // Eventos (testa todos pra garantir)
    ["input", "change", "blur"].forEach(evt => {
        nascimentoInput.addEventListener(evt, () => {
            console.log(`🟣 evento disparou: ${evt}`);
            toggleResponsavel();
        });
    });

    // Teste manual no console:
    window.__toggleResponsavel = toggleResponsavel;
    console.log("🧰 Use no console: __toggleResponsavel()");
})();
