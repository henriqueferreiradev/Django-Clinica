document.addEventListener('DOMContentLoaded', function () {
    try {
        // Pega o JSON já corretamente parseado pelo Django
        const chartData = JSON.parse(document.getElementById('chart-data').textContent);

        const ctx = document.getElementById('barChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1 }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao montar gráfico:", error);
    }
});
