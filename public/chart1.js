document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById('linechart');

    new Chart(ctx, {
        type: 'line', 
        data: {
            labels: [ '0 to 18 months', '19 months to 9 years', '10 to 14 years', '15 to 19 years',
                '20 to 24 years', '25 to 29 years', '30 to 39 years', '40 to 49 years', '50 years and older' ],
            datasets: [
                {
                    label: 'Positive Male',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    data: [0, 0, 0, 0, 2, 1, 3, 0, 0]
                },
                {
                    label: 'Negative Male',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    data: [0, 0, 0, 0, 0, 10, 8, 1, 0]
                },
                {
                    label: 'Positive Female',
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Female',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    data: [0, 0, 0, 1, 4, 0, 0, 0, 0]
                },
                {
                    label: 'Positive Transgender',
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Transgender',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            ]
        },
        options: {
            scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    stepSize: 5 
                    }
                }
            }
        }
    });
});
