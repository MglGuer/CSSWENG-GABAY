document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById('barchart');

    new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: ['Positive', 'Negative', 'Don\'t Know'],
            datasets: [
                {
                    label: 'Positive Male',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    data: [2, 2, 0]
                },
                {
                    label: 'Negative Male',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    data: [0, 20, 0]
                },
                {
                    label: 'Positive Female',
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    data: [0, 0, 0]
                },
                {
                    label: 'Negative Female',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    data: [0, 0, 0]
                },
                {
                    label: 'Positive Transgender',
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    data: [0, 0, 0]
                },
                {
                    label: 'Negative Transgender',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    data: [0, 0, 0]
                }
            ]
        },
        options: {
            indexAxis: 'y',  
            scales: {
                x: {
                  beginAtZero: true
                }
            }
        }
    });
});
