document.addEventListener('DOMContentLoaded', async function () {
    await handleResponse();

    let btn = document.querySelector('#btn');
    let sidebar = document.querySelector('.sidebar');
    btn.onclick = function () {
        sidebar.classList.toggle('active');
    };

    document.getElementById("sign-up").onclick = function(){
        if(!(checkEmpty(document.getElementById("name-field").value))){
            return false; //stop the submit
        }
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
                            <input type="radio" name="gender" value="Male" ${patient.gender === 'Male' ? 'checked' : ''} required>
                            <span>Male</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="gender" value="Female" ${patient.gender === 'Female' ? 'checked' : ''} required>
                            <span>Female</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="gender" value="Transgender" ${patient.gender === 'Transgender' ? 'checked' : ''} required>
                            <span>Transgender</span>
                        </label>
                    </div>`;

                console.log('Patient data type:', patient.data_type);
                
                if (patient.data_type === 'biomedical') {
                    formContent += `
                    <div class="edit-biomedicalfield">
                        <label for="location" class="data-label">Location:</label>
                        <label class="radio-option">
                            <input type="radio" name="location" value="Caloocan" ${patient.biomedical.location === 'Caloocan' ? 'checked' : ''} onclick="toggleEditLocationFields()">
                            <span>Caloocan</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="location" value="Not in Caloocan" ${patient.biomedical.location === 'Not in Caloocan' ? 'checked' : ''} onclick="toggleEditLocationFields()">
                            <span>Not in Caloocan</span>
                        </label>
                    </div>
                    <div id="edit-barangay-field" class="form-group ${patient.biomedical.location === 'Caloocan' ? 'visible' : 'hidden'}">
                        <label for="barangay" class="data-label">Barangay:</label>
                        <input type="number" id="barangay" name="barangay" class="data-input" min="1" max="188" value="${patient.biomedical.barangay}">
                    </div>
                    <div id="edit-remarks-field" class="${patient.biomedical.location === 'Not in Caloocan' ? 'visible' : 'hidden'}">
                        <label for="remarks" class="data-label">Remarks:</label>
                        <input type="text" id="remarks" name="remarks" class="data-input" value="${patient.biomedical.remarks}">
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="age" class="data-label">Age:</label>  
                        <select id="age" name="age_range">
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
                            <input type="radio" name="tested_before" value="Yes" ${patient.biomedical.tested_before  === 'Yes' ? 'checked' : ''}>
                            <span>Yes (Has been tested before)</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="tested_before" value="No" ${patient.biomedical.tested_before  === 'No' ? 'checked' : ''}>
                            <span>No (First Time Tester)</span>
                        </label>
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="test_result" class="data-label">Test result:</label>
                        <label class="radio-option">
                            <input type="radio" name="test_result" value="Positive" ${patient.biomedical.test_result === 'Positive' ? 'checked' : ''}>
                            <span>Positive</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="test_result" value="Negative" ${patient.biomedical.test_result === 'Negative' ? 'checked' : ''}>
                            <span>Negative</span>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="test_result" value="Do Not Know" ${patient.biomedical.test_result === 'Do Not Know' ? 'checked' : ''}>
                            <span>Don't Know (For repeat testers)</span>
                        </label>
                    </div>
                    <div class="edit-biomedicalfield">
                        <label for="reason" class="data-label">Reason for taking the test:</label>
                        <select id="reason" name="reason">
                            <option value="" disabled selected>Select reason</option>
                            <option value="Unprotected Sex" ${patient.biomedical.reason === 'Unprotected Sex' ? 'selected' : ''}>Unprotected Sex</option>
                            <option value="Injectable drugs" ${patient.biomedical.reason === 'Injectable drugs' ? 'selected' : ''}>Use of injectable drugs</option>
                            <option value="Pregnancy" ${patient.biomedical.reason === 'Pregnancy' ? 'selected' : ''}>Pregnancy</option>
                            <option value="Exposed-child" ${patient.biomedical.reason === 'Exposed-child' ? 'selected' : ''}>HIV-exposed child</option>
                            <option value="PITC" ${patient.biomedical.reason === 'PITC' ? 'selected' : ''}>PITC - III health</option>
                            <option value="Positive-partner" ${patient.biomedical.reason === 'Positive-partner' ? 'selected' : ''}>HIV positive partner</option>
                            <option value="Rape" ${patient.biomedical.reason === 'Rape' ? 'selected' : ''}>Non consensual sex and rape</option>
                            <option value="Bloodtransfusion" ${patient.biomedical.reason === 'Bloodtransfusion' ? 'selected' : ''}>History of blood transfusion or exposure to contaminated equipment</option>
                            <option value="HCW" ${patient.biomedical.reason === 'HCW' ? 'selected' : ''}>Occupational hazard health care worker (HCW)</option>
                            <option value="Administrative" ${patient.biomedical.reason === 'Administrative' ? 'selected' : ''}>Administrative reason</option>
                            <option value="History" ${patient.biomedical.reason === 'History' ? 'selected' : ''}>Subjective ill health or history of sexually transmitted infection(s)</option>
                            <option value="No reason" ${patient.biomedical.reason === 'No reason' ? 'selected' : ''}>No specific reason disclosed</option>
                        </select>
                    </div>

                    <div class="edit-biomedicalfield">
                        <label for="kvp" class="data-label">Key or Vulnerable Population (KVP) at higher risk:</label>
                        <select id="kvp" name="kvp">
                            <option value="" disabled selected>Select population</option>
                            <option value="PWID" ${patient.biomedical.kvp === 'PWID' ? 'selected' : ''}>Person who injects drugs (PWID) or other needle sharing</option>
                            <option value="MSM" ${patient.biomedical.kvp === 'MSM' ? 'selected' : ''}>Gay and other Men having Sex with Men (MSM)</option>
                            <option value="Transgenders" ${patient.biomedical.kvp === 'Transgenders' ? 'selected' : ''}>Transgenders</option>
                            <option value="Sex-worker" ${patient.biomedical.kvp === 'Sex-worker' ? 'selected' : ''}>Sex/entertainment worker</option>
                            <option value="Prisoner" ${patient.biomedical.kvp === 'Prisoner' ? 'selected' : ''}>Prisoner/detainee</option>
                            <option value="Migrant" ${patient.biomedical.kvp === 'Migrant' ? 'selected' : ''}>Mobile and migrant populations</option>
                            <option value="PWUD" ${patient.biomedical.kvp === 'PWUD' ? 'selected' : ''}>Person who uses non-injectable drugs (PWUD)</option>
                            <option value="Uniformed forces" ${patient.biomedical.kvp === 'Uniformed forces' ? 'selected' : ''}>Uniformed forces (military, police, security)</option>
                            <option value="Sexual-partners" ${patient.biomedical.kvp === 'Sexual-partners' ? 'selected' : ''}>Sexual Partners of identified KP at higher risk</option>
                            <option value="AGEW" ${patient.biomedical.kvp === 'AGEW' ? 'selected' : ''}>Adolescent Girls and Young Women (AGEW)</option>
                            <option value="PWD" ${patient.biomedical.kvp === 'PWD' ? 'selected' : ''}>Persons with disability</option>
                            <option value="PLHIV" ${patient.biomedical.kvp === 'PLHIV' ? 'selected' : ''}>HIV-negative sexual partners of PLHIV</option>
                            <option value="Not disclosed" ${patient.biomedical.kvp === 'Not disclosed' ? 'selected' : ''}>No key or vulnerable population known or not disclosed</option>
                        </select>
                    </div>

                    <div class="edit-biomedicalfield">
                        <label for="linkage" class="data-label">Linkage:</label>
                        <select id="linkage" name="linkage">
                            <option value="" disabled selected>Select linkage</option>
                            <option value="Treatment facility" ${patient.biomedical.linkage === 'Treatment facility' ? 'selected' : ''}>Linked to Treatment Facility</option>
                            <option value="Follow-up" ${patient.biomedical.linkage === 'Follow-up' ? 'selected' : ''}>Linkage not yet confirmed, under follow-up</option>
                            <option value="Unconfirmed" ${patient.biomedical.linkage === 'Unconfirmed' ? 'selected' : ''}>Linkage unconfirmed (after 3 months follow-up)</option>
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
        console.log('Submitting updated data for patient ID:', id, data);
    
        try {
            const response = await fetch(`/edit/${id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const result = await response.json();
            if (result.success) {
                alert('Patient information updated successfully');
                editModal.style.display = "none";
                window.location.href = `/data`;
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

async function handleResponse() {
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

function toggleGraphs(button) {
    const containerGraphs = button.closest('.container-graphs');
    const container = containerGraphs.querySelector('.container');
    const filter = containerGraphs.querySelector('.filter');
    
    if (container.style.display === 'none') {
        container.style.display = 'grid';
        filter.style.display = 'flex'; 
        button.querySelector('i').classList.replace('bxs-chevron-up', 'bxs-chevron-down');
    } else {
        container.style.display = 'none';
        filter.style.display = 'none';
        button.querySelector('i').classList.replace('bxs-chevron-down', 'bxs-chevron-up');
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

function toggleEditLocationFields() {
    const caloocanRadio = document.querySelector('input[name="location"][value="Caloocan"]');
    const barangayField = document.getElementById('edit-barangay-field');
    const remarksField = document.getElementById('edit-remarks-field');

    if (caloocanRadio.checked) {
        barangayField.classList.add('visible');
        barangayField.classList.remove('hidden');
        remarksField.classList.add('hidden');
        remarksField.classList.remove('visible');
    } else {
        remarksField.classList.add('visible');
        remarksField.classList.remove('hidden');
        barangayField.classList.add('hidden');
        barangayField.classList.remove('visible');
    }
}

function toggleLocationFields() {
    const location = document.querySelector('input[name="location"]:checked');
    const barangayField = document.getElementById('barangay-field');
    const remarksField = document.getElementById('remarks-field');

    if (location) {
        if (location.value === 'Caloocan') {
            barangayField.style.display = 'flex';
            remarksField.style.display = 'none';
        } else if (location.value === 'Not in Caloocan') {
            barangayField.style.display = 'none';
            remarksField.style.display = 'flex';
        }
    } else {
        barangayField.style.display = 'none';
        remarksField.style.display = 'none';
    }
}

function clearForm() {
    var form = document.getElementById('tracker-form');
    form.reset();
}

function checkEmpty(field){
    if(/^\s*$/.test(field)){
        return false;
    }
    else{
        return true;
    }
}

function validateForm() {
    var tested = document.querySelector('input[name="tested"]:checked');
    var result = document.querySelector('input[name="result"]:checked');

    if (result && result.value === "Do Not Know") {
        if (!tested || tested.value !== "Yes") {
            alert("You can only select 'Don't Know' if the person has been tested before.");
            return false;
        }
    }

    alert("Form submitted successfully!");
    document.getElementById("tracker-form").submit(); 
}