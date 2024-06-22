document.addEventListener('DOMContentLoaded', function () {
    handleResponse();

    let btn = document.querySelector('#btn');
    let sidebar = document.querySelector('.sidebar');
    btn.onclick = function () {
        sidebar.classList.toggle('active');
    };

    const editModal = document.getElementById('editModal');
    const editForm = document.getElementById('editForm');
    const span = document.getElementsByClassName('close')[0];
    const editButtons = document.querySelectorAll('.btn-edit');

    editButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            const patientId = event.target.closest('a').getAttribute('data-id');
            console.log('Fetching data for patient ID:', patientId); // Debug log

            // Fetch patient data
            try {
                const response = await fetch(`/edit/${patientId}`);
                const data = await response.json();
                const patient = data.patient;
                console.log('Received patient data:', patient); // Debug log

                if (!patient || !patient.data_type) {
                    console.error('Patient data_type is missing or invalid.');
                    alert('An error occurred: patient data_type is missing or invalid.');
                    return;
                }

                // Populate form with patient data
                let formContent = `
                    <input type="hidden" name="id" value="${patient._id}">
                    <div class="field">
                        <label for="gender" class="data-label">Gender:</label>
                        <label class="radio-option">
                            <input type="radio" name="gender" value="male" ${patient.gender === 'male' ? 'checked' : ''} required>
                            <span>Male</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="gender" value="female" ${patient.gender === 'female' ? 'checked' : ''} required>
                            <span>Female</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="gender" value="transgender" ${patient.gender === 'transgender' ? 'checked' : ''} required>
                            <span>Transgender</span>
                        </label>
                    </div>`;

                console.log('Patient data type:', patient.data_type);
                
                if (patient.data_type === 'biomedical') {
                    formContent += `
                    <div class="edit-biomedicalfield">
                        <label for="location" class="data-label">Location:</label>
                        <label class="radio-option">
                            <input type="radio" name="location" value="caloocan" ${patient.biomedical.location === 'caloocan' ? 'checked' : ''} onclick="toggleLocationFields()">
                            <span>Caloocan</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="location" value="not_in_caloocan" ${patient.biomedical.location === 'not_in_caloocan' ? 'checked' : ''} onclick="toggleLocationFields()">
                            <span>Not in Caloocan</span>
                        </label>
                    </div>
                    <div id="barangay-field">
                        <label for="barangay" class="data-label">Barangay:</label>
                        <input type="number" id="barangay" name="barangay" class="data-input" min="1" max="188" value="${patient.biomedical.barangay}">
                    </div>
                    <div id="remarks-field">
                        <label for="remarks" class="data-label">Remarks:</label>
                        <input type="text" id="remarks" name="remarks" class="data-input" value="${patient.biomedical.remarks}">
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="age" class="data-label">Age:</label>  
                        <select id="age" name="age">
                            <option value="" disabled>Select age range</option>
                            <option value="0 to 18 months" ${patient.biomedical.age_range === '0 to 18 months' ? 'selected' : ''}>0 to 18 months</option>
                            <option value="19 months to 9 years" ${patient.biomedical.age_range === '19 months to 9 years' ? 'selected' : ''}>19 months to 9 years</option>
                            <option value="10 to 14 years" ${patient.biomedical.age_range === '10 to 14 years' ? 'selected' : ''}>10 to 14 years</option>
                            <option value="15 to 19 years" ${patient.biomedical.age_range === '15 to 19 years' ? 'selected' : ''}>15 to 19 years</option>
                            <option value="20 to 24 years" ${patient.biomedical.age_range === '20 to 24 years' ? 'selected' : ''}>20 to 24 years</option>
                            <option value="25 to 29 years" ${patient.biomedical.age_range === '25 to 29 years' ? 'selected' : ''}>25 to 29 years</option>
                            <option value="30 to 39 years" ${patient.biomedical.age_range === '30 to 39 years' ? 'selected' : ''}>30 to 39 years</option>
                            <option value="40 to 49 years" ${patient.biomedical.age_range === '40 to 49 years' ? 'selected' : ''}>40 to 49 years</option>
                            <option value="50-plus" ${patient.biomedical.age_range === '50-plus' ? 'selected' : ''}>50 years and older</option>
                        </select>
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="tested_before" class="data-label">Has the person been tested before?</label>
                        <label class="radio-option">
                            <input type="radio" name="tested_before" value="true" ${patient.biomedical.tested_before ? 'checked' : ''}>
                            <span>Yes</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="tested_before" value="false" ${!patient.biomedical.tested_before ? 'checked' : ''}>
                            <span>No</span>
                        </label>
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="test_result" class="data-label">Test result:</label>
                        <label class="radio-option">
                            <input type="radio" name="test_result" value="positive" ${patient.biomedical.test_result === 'positive' ? 'checked' : ''}>
                            <span>Positive</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="test_result" value="negative" ${patient.biomedical.test_result === 'negative' ? 'checked' : ''}>
                            <span>Negative</span>
                        </label>
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="reason" class="data-label">Reason for taking the test:</label>
                        <select id="reason" name="reason">
                            <option value="" disabled selected>Select reason</option>
                            <option value="unprotected" ${patient.biomedical.reason === 'unprotected' ? 'selected' : ''}>Unprotected Sex</option>
                            <option value="injectable-drugs" ${patient.biomedical.reason === 'injectable-drugs' ? 'selected' : ''}>Use of injectable drugs</option>
                            <option value="pregnancy" ${patient.biomedical.reason === 'pregnancy' ? 'selected' : ''}>Pregnancy</option>
                            <option value="exposed-child" ${patient.biomedical.reason === 'exposed-child' ? 'selected' : ''}>HIV-exposed child</option>
                            <option value="pitc" ${patient.biomedical.reason === 'pitc' ? 'selected' : ''}>PITC - III health</option>
                            <option value="positive-partner" ${patient.biomedical.reason === 'positive-partner' ? 'selected' : ''}>HIV positive partner</option>
                            <option value="rape" ${patient.biomedical.reason === 'rape' ? 'selected' : ''}>Non consensual sex and rape</option>
                            <option value="bloodtransfusion" ${patient.biomedical.reason === 'bloodtransfusion' ? 'selected' : ''}>History of blood transfusion or exposure to contaminated equipment</option>
                            <option value="hcw" ${patient.biomedical.reason === 'hcw' ? 'selected' : ''}>Occupational hazard health care worker (HCW)</option>
                            <option value="administrative" ${patient.biomedical.reason === 'administrative' ? 'selected' : ''}>Administrative reason</option>
                            <option value="history" ${patient.biomedical.reason === 'history' ? 'selected' : ''}>Subjective ill health or history of sexually transmitted infection(s)</option>
                            <option value="no-reason" ${patient.biomedical.reason === 'no-reason' ? 'selected' : ''}>No specific reason disclosed</option>
                        </select>
                    </div>

                    <div class="edit-biomedicalfield">
                        <label for="kvp" class="data-label">Key or Vulnerable Population (KVP) at higher risk:</label>
                        <select id="kvp" name="kvp">
                            <option value="" disabled selected>Select population</option>
                            <option value="pwid" ${patient.biomedical.kvp === 'pwid' ? 'selected' : ''}>Person who injects drugs (PWID) or other needle sharing</option>
                            <option value="msm" ${patient.biomedical.kvp === 'msm' ? 'selected' : ''}>Gay and other Men having Sex with Men (MSM)</option>
                            <option value="transgenders" ${patient.biomedical.kvp === 'transgenders' ? 'selected' : ''}>Transgenders</option>
                            <option value="sex-worker" ${patient.biomedical.kvp === 'sex-worker' ? 'selected' : ''}>Sex/entertainment worker</option>
                            <option value="pdl" ${patient.biomedical.kvp === 'pdl' ? 'selected' : ''}>Prisoner/detainee</option>
                            <option value="migrant" ${patient.biomedical.kvp === 'migrant' ? 'selected' : ''}>Mobile and migrant populations</option>
                            <option value="pwud" ${patient.biomedical.kvp === 'pwud' ? 'selected' : ''}>Person who uses non-injectable drugs (PWUD)</option>
                            <option value="uniformed" ${patient.biomedical.kvp === 'uniformed' ? 'selected' : ''}>Uniformed forces (military, police, security)</option>
                            <option value="sexual-partners" ${patient.biomedical.kvp === 'sexual-partners' ? 'selected' : ''}>Sexual Partners of identified KP at higher risk</option>
                            <option value="agew" ${patient.biomedical.kvp === 'agew' ? 'selected' : ''}>Adolescent Girls and Young Women (AGEW)</option>
                            <option value="disability" ${patient.biomedical.kvp === 'disability' ? 'selected' : ''}>Persons with disability</option>
                            <option value="plhiv" ${patient.biomedical.kvp === 'plhiv' ? 'selected' : ''}>HIV-negative sexual partners of PLHIV</option>
                            <option value="not-disclosed" ${patient.biomedical.kvp === 'not-disclosed' ? 'selected' : ''}>No key or vulnerable population known or not disclosed</option>
                        </select>
                    </div>

                    <div class="edit-biomedicalfield">
                        <label for="linkage" class="data-label">Linkage:</label>
                        <select id="linkage" name="linkage">
                            <option value="" disabled selected>Select linkage</option>
                            <option value="treatment-facility" ${patient.biomedical.linkage === 'treatment-facility' ? 'selected' : ''}>Linked to Treatment Facility</option>
                            <option value="follow-up" ${patient.biomedical.linkage === 'follow-up' ? 'selected' : ''}>Linkage not yet confirmed, under follow-up</option>
                            <option value="unconfirmed" ${patient.biomedical.linkage === 'unconfirmed' ? 'selected' : ''}>Linkage unconfirmed (after 3 months follow-up)</option>
                        </select>
                    </div>`;
                } else if (patient.data_type === 'nonbiomedical') {
                    formContent += `
                    <div class="edit-nonbiomedicalfield">
                        <label for="stigma" class="data-label">Stigma:</label>
                        <select id="stigma" name="stigma">
                            <option value="" disabled>Select category</option>
                            <option value="Public Stigma" ${patient.nonbiomedical.stigma === 'Public Stigma' ? 'selected' : ''}>Public Stigma</option>
                            <option value="Family Stigma" ${patient.nonbiomedical.stigma === 'Family Stigma' ? 'selected' : ''}>Family Stigma</option>
                            <option value="Self-stigma" ${patient.nonbiomedical.stigma === 'Self-stigma' ? 'selected' : ''}>Self-stigma</option>
                        </select>
                    </div>
                    <div class="edit-nonbiomedicalfield">
                        <label for="discrimination" class="data-label">Discrimination:</label>
                        <select id="discrimination" name="discrimination">
                            <option value="" disabled>Select category</option>
                            <option value="Verbal Abuse" ${patient.nonbiomedical.discrimination === 'Verbal Abuse' ? 'selected' : ''}>Verbal Abuse</option>
                            <option value="Physical Abuse" ${patient.nonbiomedical.discrimination === 'Physical Abuse' ? 'selected' : ''}>Physical Abuse</option>
                            <option value="Emotional Abuse" ${patient.nonbiomedical.discrimination === 'Emotional Abuse' ? 'selected' : ''}>Emotional Abuse</option>
                        </select>
                    </div>
                    <div class="edit-nonbiomedicalfield">
                        <label for="violence" class="data-label">Violence:</label>
                        <select id="violence" name="violence">
                            <option value="" disabled>Select category</option>
                            <option value="Economic Abuse" ${patient.nonbiomedical.violence === 'Economic Abuse' ? 'selected' : ''}>Economic Abuse</option>
                            <option value="Sexual Abuse" ${patient.nonbiomedical.violence === 'Sexual Abuse' ? 'selected' : ''}>Sexual Abuse</option>
                            <option value="Hate Crime" ${patient.nonbiomedical.violence === 'Hate Crime' ? 'selected' : ''}>Hate Crime</option>
                        </select>
                    </div>`;
                }
                
                formContent += `<div class="edit-record">
                <button type="submit" class="edit-button">Update Patient Record</button>
                </div>`;
                editForm.innerHTML = formContent;

                // Display the modal
                editModal.style.display = "block";
            } catch (error) {
                console.error('Error fetching patient data:', error);
                alert('An error occurred while fetching patient data.');
            }
        });
    });

    span.onclick = function () {
        editModal.style.display = "none";
    }

    window.onclick = function (event) {
        if (event.target == editModal) {
            editModal.style.display = "none";
        }
    }

    editForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(editForm);
        const id = formData.get('id');
        const data = Object.fromEntries(formData.entries());
        console.log('Submitting updated data for patient ID:', id, data); // Debug log

        // Send updated data to the server
        try {
            const response = await fetch(`/edit/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();
            if (result.success) {
                alert('Patient information updated successfully');
                editModal.style.display = "none";
                // Optionally, refresh the page or update the displayed patient list
            } else {
                alert('An error occurred while updating the patient information');
            }
        } catch (error) {
            console.error('Error updating patient data:', error);
            alert('An error occurred while updating patient data.');
        }
    });

    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            if (!confirm('Are you sure you want to delete this record?')) {
                event.preventDefault(); 
            }
        });
    });

});

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
            barangayField.style.display = 'flex';
            remarksField.style.display = 'none';
        } else if (location.value === 'not_in_caloocan') {
            barangayField.style.display = 'none';
            remarksField.style.display = 'flex';
        }
    } else {
        barangayField.style.display = 'none';
        remarksField.style.display = 'none';
    }
}