// config.js
document.getElementById("current-year").textContent = new Date().getFullYear();

// Contador de caracteres
const textarea = document.getElementById("observacao");
const charCount = document.querySelector(".char-count .current-count");

if (textarea && charCount) {
    textarea.addEventListener("input", function () {
        charCount.textContent = this.value.length;
    });
}