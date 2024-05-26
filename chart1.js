document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById('horizontalbarchart');

    new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: ['Unprotected Sex', 'Use of injectable drugs', 'Pregnancy', 'HIV-exposed child', 'PITC - Ill health', 'HIV positive partner', 'Non consensual sex and rape', 'History of blood transfusion or exposure to contaminated equipment', 'Occupational hazard health care worker (HCW)', 'Administrative reason', 'Subjective ill health or history of sexually transmitted infection(s)', 'No specific reason disclosed'],
            datasets: [
                {
                    label: 'Positive Male',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    data: [4, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0]
                },
                {
                    label: 'Negative Male',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    data: [55, 0, 0, 0, 0, 0, 0, 1, 2, 0, 0, 0]
                },
                {
                    label: 'Positive Female',
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Female',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    data: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Positive Transgender',
                    backgroundColor: 'rgba(153, 102, 255, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Transgender',
                    backgroundColor: 'rgba(255, 159, 64, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            ]
        },
        options: {
            indexAxis: 'y',
        }
    });
});
