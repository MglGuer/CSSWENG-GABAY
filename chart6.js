document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById('linechart2');

    new Chart(ctx, {
        type: 'line', 
        data: {
            labels: [ 'Linked to Treatment Facility', 'Linkage not yet confirmed, under follow-up', 'linkage unconfirmed (after 3 months follow-up)'],
            datasets: [
                {
                    label: 'Positive Male',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    data: [4, 2, 0]
                },
                {
                    label: 'Negative Male',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    data: [0, 0, 0]
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
