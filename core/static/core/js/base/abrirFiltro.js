document.addEventListener('DOMContentLoaded', function () {
    // Toggle do filtro
    const filtroToggle = document.querySelector('.filtro-toggle');
    const filtroBody = document.querySelector('.filtro-body');
    const filtroAcoes = document.querySelector('.filtro-acoes');

    if (filtroToggle) {
        filtroToggle.addEventListener('click', function () {
            const isHidden = filtroBody.style.display === 'none' || filtroBody.style.display === '';

            if (isHidden) {
                // abrir
                filtroBody.style.display = 'grid';
                if (filtroAcoes) filtroAcoes.style.display = 'flex';
                filtroToggle.innerHTML = '<i class="bx bx-chevron-up"></i>';
            } else {
                // fechar
                filtroBody.style.display = 'none';
                if (filtroAcoes) filtroAcoes.style.display = 'none';
                filtroToggle.innerHTML = '<i class="bx bx-chevron-down"></i>';
            }
        });
    }
});
