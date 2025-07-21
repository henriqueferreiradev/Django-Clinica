document.addEventListener('DOMContentLoaded', function () {
    try {
        // Pega o JSON já corretamente parseado pelo Django
        const chartData = JSON.parse(document.getElementById('chart-data').textContent);

        const ctx = document.getElementById('barChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: chartData,
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom', // ou 'top', 'left', 'right'
                        labels: {
                            color: 'white', // ajusta a cor no modo dark
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
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
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom', // ou 'top', 'left', 'right'
                        labels: {
                            color: 'white', // ajusta a cor no modo dark
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
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
    try {
        const distribuicaoProfissionalChart = JSON.parse(document.getElementById('distribuicao_por_profissional-chart').textContent);

        const ctx3 = document.getElementById('distribuicaoProfissionalChart').getContext('2d')

        new Chart(ctx3, {
            type: 'pie',
            data: distribuicaoProfissionalChart,
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 5, // espaço entre os itens da legenda
                            boxWidth: 15,
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            display: false
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            display: false
                        },
                        grid: {
                            display: false
                        },
                        beginAtZero: false
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao montar gráfico de evolução mensal:", error);
    }
    try {
        const servicosMaisContratadosChart = JSON.parse(document.getElementById('servicos-chart').textContent);

        const ctx4 = document.getElementById('servicosChart').getContext('2d');

        new Chart(ctx4, {
            type: 'doughnut',
            data: servicosMaisContratadosChart,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: -150// espaçamento entre a legenda (à esquerda) e o gráfico
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 5, // espaço entre os itens da legenda
                            boxWidth: 15,
                            color: 'white'
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            display: false
                        },
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        ticks: {
                            display: false
                        },
                        grid: {
                            display: false
                        },
                        beginAtZero: false
                    }
                }
            }
        });
    } catch (error) {
        console.error("Erro ao montar gráfico de serviços contratados:", error);
    }
    try {
        const statusAgendametosChart = JSON.parse(document.getElementById('status-chart').textContent);
        const ctx5 = document.getElementById('statusChart').getContext('2d');

        new Chart(ctx5, {
            type: 'bar',
            data: statusAgendametosChart,
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: {
                        left: -150
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 5,
                            boxWidth: 15,
                            color: 'white'
                        }
                    },
                    datalabels: {
                        color: 'white',
                        anchor: 'center',
                        align: 'center',
                        font: {
                            weight: 'normal'
                        },
                        formatter: function (value, context) {
                            const label = context.chart.data.labels[context.dataIndex]
                            return `${label} (${value})`;
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            display: true
                        },
                        grid: {
                            display: true
                        }
                    },
                    y: {
                        ticks: {
                            display: true
                        },
                        grid: {
                            display: true
                        },
                        beginAtZero: false
                    }
                }
            },
            plugins: [ChartDataLabels] // <- ativa o plugin
        });
    } catch (error) {
        console.error("Erro ao montar gráfico de status:", error);
    }
    try {
        // Pega o JSON já corretamente parseado pelo Django
        const pagamentoChart = JSON.parse(document.getElementById('formas_pagamento-chart').textContent);

        const ctx6 = document.getElementById('pagamentoChart').getContext('2d');
        new Chart(ctx6, {
            type: 'bar',
            data: pagamentoChart,
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom', // ou 'top', 'left', 'right'
                        labels: {
                            color: 'white', // ajusta a cor no modo dark
                            boxWidth: 15,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    }
                },
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
})