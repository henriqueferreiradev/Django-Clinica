document.addEventListener('DOMContentLoaded', () => {
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (!dateInputs.length) return;

    dateInputs.forEach(input => {
        flatpickr(input, {
            dateFormat: "Y-m-d",
            altInput: true,
            altFormat: "d/m/Y",
            locale: "pt",
            disableMobile: true,
            onReady: (_, __, instance) => {
                instance.altInput.placeholder = input.getAttribute("placeholder") || "Selecione uma data";
            }
        });
    });
});
