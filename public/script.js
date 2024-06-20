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
        biomedicalFields.forEach(field => field.style.display = 'flex');
        nonbiomedicalFields.forEach(field => field.style.display = 'none');
    } else {
        biomedicalFields.forEach(field => field.style.display = 'none');
        nonbiomedicalFields.forEach(field => field.style.display = 'flex');
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

    // Add event listener to data_type radio buttons
    const dataTypeRadioButtons = document.querySelectorAll('input[name="data_type"]');
    dataTypeRadioButtons.forEach(radio => radio.addEventListener('change', toggleFields));

    // Add event listener to location radio buttons
    const locationRadioButtons = document.querySelectorAll('input[name="location"]');
    locationRadioButtons.forEach(radio => radio.addEventListener('change', toggleLocationFields));

    let btn = document.querySelector('#btn');
    let sidebar = document.querySelector('.sidebar');

    btn.onclick = function () {
        sidebar.classList.toggle('active');
    };

});
