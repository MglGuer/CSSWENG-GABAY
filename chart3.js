document.addEventListener("DOMContentLoaded", function() {
    const ctx = document.getElementById('horizontalbarchart2');

    new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: ['Person who injects drugs (PWID) or other needle sharing', 'Gay and other Men having Sex with Men (MSM)', 'Transgenders', 
                'Sex /entertainment worker', 'Prisoner / detainee', 'Mobile and migrant populations', 'Person who uses non-injectable drugs (PWUD)', 
                'Uniformed forces (military, police, security)', 'Sexual Partners of identified KP at higher risk', 'Adolescent Girls and Young Women (AGEW)', 
                'Persons with disability', 'HIV-negative sexual partners of PLHIV', 'No key-  or vulnerable population known or not disclosed'],
            datasets: [
                {
                    label: 'Positive Male',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)',
                    data: [1, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Male',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)',
                    data: [0, 29, 0, 2, 0, 0, 0, 1, 2, 0, 0, 27]
                },
                {
                    label: 'Positive Female',
                    backgroundColor: 'rgba(255, 206, 86, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                },
                {
                    label: 'Negative Female',
                    backgroundColor: 'rgba(75, 192, 192, 0.5)',
                    data: [0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0]
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
