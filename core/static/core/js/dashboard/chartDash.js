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
    try {
        const chartDataEvo = JSON.parse(document.getElementById('evolucao-chart').textContent);
 
        const ctx2 = document.getElementById('evolucaoMensalChart').getContext('2d');
    
        new Chart(ctx2, {
            type: 'line',
            data: chartDataEvo,
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao montar gráfico de evolução mensal:", error);
    }
    
});
