function copiarTexto(texto) {
    navigator.clipboard.writeText(texto).then(function () {
        const feedback = document.getElementById("feedback");
        feedback.style.display = "block";
        setTimeout(() => {
            feedback.style.display = "none";
        }, 1500);
    }).catch(function (err) {
        console.error("Erro ao copiar: ", err);
    });
}

