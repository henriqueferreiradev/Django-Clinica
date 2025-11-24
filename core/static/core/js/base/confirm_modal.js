let currentForm = null;

function showConfirmModal(title, message, form) {
    const modal = document.getElementById("confirmModal");
    document.getElementById("confirmModalTitle").textContent =
        title || "Confirmar ação";
    document.getElementById("confirmModalMessage").textContent =
        message || "Deseja realmente executar esta ação?";

    currentForm = form;

    modal.classList.add("show");
    modal.style.display = "flex";

    // Adiciona evento ao botão confirmar
    document.getElementById("confirmModalConfirmBtn").onclick = function () {
        if (currentForm) {
            currentForm.submit();
        }
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById("confirmModal");
    modal.classList.remove("show");
    setTimeout(() => {
        modal.style.display = "none";
    }, 300);
    currentForm = null;
}

// Fechar modal ao clicar fora ou pressionar ESC
window.addEventListener("click", function (event) {
    if (event.target === document.getElementById("confirmModal")) {
        closeConfirmModal();
    }
});

document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
        closeConfirmModal();
    }
});