function handleResponse() {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    const error = params.get('error');

    if (message) {
        alert(message); 
    }

    if (error) {
        alert(error); 
    }
}

function toggleFields() {
    const dataType = document.querySelector('input[name="data_type"]:checked').value;
    const biomedicalFields = document.querySelectorAll('.biomedicalfield');
    const nonbiomedicalFields = document.querySelectorAll('.nonbiomedicalfield');

    if (dataType === 'biomedical') {
        biomedicalFields.forEach(field => {
            field.style.display = 'flex';
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => input.required = true);
        });
        nonbiomedicalFields.forEach(field => {
            field.style.display = 'none';
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => input.required = false);
        });
    } else {
        biomedicalFields.forEach(field => {
            field.style.display = 'none';
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => input.required = false);
        });
        nonbiomedicalFields.forEach(field => {
            field.style.display = 'flex';
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => input.required = true);
        });
    }
}

function toggleLocationFields() {
    const location = document.querySelector('input[name="location"]:checked');

    const barangayField = document.getElementById('barangay-field');
    const remarksField = document.getElementById('remarks-field');

    if (location) {
        if (location.value === 'caloocan') {
            barangayField.style.display = 'block';
            remarksField.style.display = 'none';
        } else if (location.value === 'not_in_caloocan') {
            barangayField.style.display = 'none';
            remarksField.style.display = 'block';
        }
    } else {
        barangayField.style.display = 'none';
        remarksField.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    handleResponse();
    toggleFields(); 
    toggleLocationFields(); 

    let btn = document.querySelector('#btn');
    let sidebar = document.querySelector('.sidebar');

    btn.onclick = function () {
        sidebar.classList.toggle('active');
    };

});
