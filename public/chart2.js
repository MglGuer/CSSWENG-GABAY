document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById('horizontalbarchart3');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['First time tester current result'],
            datasets: [
                {
                    label: 'Positive Male',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    data: [2]
                },
                {
                    label: 'Negative Male',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    data: [38]
                },
                {
                    label: 'Positive Female',
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    data: [0]
                },
                {
                    label: 'Negative Female',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    data: [5]
                },
                {
                    label: 'Positive Transgender',
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    data: [0]
                },
                {
                    label: 'Negative Transgender',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    data: [0]
                }
            ]
        },
        options: {
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 4
                    }
                }
            }
        }
    });
});
