/**
 * Event listener for the DOMContentLoaded event.
 * Initializes the page and sets up event handlers.
 */
document.addEventListener('DOMContentLoaded', async function () {
    // Handle URL response parameters for displaying messages or errors
    await handleResponse();

    // Fetch data and initialize charts after the DOM is fully loaded
    await initializeCharts();
        
    /**
     * Filters graphs by month
     */
    let monthValue = undefined; 
    let monthlyFilter = document.querySelector('#monthlyFilter');
    if (monthlyFilter){
        monthlyFilter.onchange = async function () {
            monthValue = monthlyFilter.value;    
            try{
                console.log('The month is ' + monthValue);
                removeNoDataMessage('.graph3', 'Testing outcomes by main reason for HIV Test:','chartReason');
                removeNoDataMessage('.graph5', 'Testing outcomes by Key or Vulnerable Population (KVP) at higher risk','chartKVP');
                removeNoDataMessage('.graph1', 'Testing outcomes for clients who were tested before (repeat testers)','chartTestedBefore');
                removeNoDataMessage('.graph2', 'Testing outcomes by age','chartAge');
                removeNoDataMessage('.graph4', 'Testing outcomes for first time testers','chartFirstTimeTesters');
                removeNoDataMessage('.graph6', 'Linkage for positive clients','chartLinkage');
                removeNoDataMessage('.graph7', 'Testing outcomes for stigma','chartStigma');
                removeNoDataMessage('.graph8', 'Testing outcomes for discrimination','chartDiscrimination');
                removeNoDataMessage('.graph9', 'Testing outcomes for violence','chartViolence');
                await initializeCharts(monthValue,yearValue);
            }
            catch(error) {
                    console.error('Error fetching patient data:', error);
                    alert('An error occurred while filtering biomedical patient data.');
                }
        };

    }

    /**
     * Filters graphs by year
     */
    let yearValue = undefined; 
    let yearlyFilter = document.querySelector('#yearlyFilter');
    if (yearlyFilter){
        yearlyFilter.onchange = async function () {
            yearValue = yearlyFilter.value;
            try{
                console.log('The year is ' + yearValue);
                removeNoDataMessage('.graph3', 'Testing outcomes by main reason for HIV Test:','chartReason');
                removeNoDataMessage('.graph5', 'Testing outcomes by Key or Vulnerable Population (KVP) at higher risk','chartKVP');
                removeNoDataMessage('.graph1', 'Testing outcomes for clients who were tested before (repeat testers)','chartTestedBefore');
                removeNoDataMessage('.graph2', 'Testing outcomes by age','chartAge');
                removeNoDataMessage('.graph4', 'Testing outcomes for first time testers','chartFirstTimeTesters');
                removeNoDataMessage('.graph6', 'Linkage for positive clients','chartLinkage');
                removeNoDataMessage('.graph7', 'Testing outcomes for stigma','chartStigma');
                removeNoDataMessage('.graph8', 'Testing outcomes for discrimination','chartDiscrimination');
                removeNoDataMessage('.graph9', 'Testing outcomes for violence','chartViolence');
                await initializeCharts(monthValue,yearValue);
            }
            catch(error) {
                    console.error('Error fetching patient data:', error);
                    alert('An error occurred while filtering biomedical patient data.');
                }
        };

    }

    /**
     * Event listener for the sidebar toggle button.
     * Toggles the active class on the sidebar when the button is clicked.
     */
    let btn = document.querySelector('#btn');
    let sidebar = document.querySelector('.sidebar');
    btn.onclick = function () {
        sidebar.classList.toggle('active');
    };

    /**
     * Event listener for exporting the data from dashboard into images.
     * Exports the data into a zip file containing the png images, excel sheet and a summary text file.
     */
    document.getElementById('exportImagesButton').addEventListener('click', async () => {
        try {
            // fetch ExcelJS from server
            const response = await fetch('/exceljs');
            if (!response.ok) {
                throw new Error('Failed to fetch ExcelJS');
            }
            const scriptText = await response.text();
            eval(scriptText);
    
            // initializing ExcelJS workbook and other necessary variables
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('GABAY Charts Summary'); 
            const charts = document.querySelectorAll('canvas');
            const zip = new JSZip();
            let summaryContent = '';
    
            // processing each chart
            for (let i = 0; i < charts.length; i++) {
                const chart = charts[i];
                const reason = chart.getAttribute('data-reason') || '';
                const chartInstance = Chart.getChart(chart);
                const datasets = chartInstance.data.datasets;
    
                let chartData = []; // preparing data for excel and summary text
    
                // populating chart data
                chartInstance.data.labels.forEach((label, index) => {
                    let rowData = {
                        'Label': label
                    };
    
                    // populating data for each category
                    datasets.forEach((dataset, datasetIndex) => {
                        const categoryName = dataset.label || `Category ${datasetIndex + 1}`;
                        const value = dataset.data[index];
                        rowData[categoryName] = value;
                    });
    
                    chartData.push(rowData);
                });
    
                // adding main header row 
                const mainHeaderStartRow = worksheet.actualRowCount + 1;
                const mainHeaderEndColumnIndex = datasets.length;
                const mainHeaderEndColumn = String.fromCharCode(65 + mainHeaderEndColumnIndex); 
    
                const mainHeaderCell = worksheet.getCell(`A${mainHeaderStartRow}`);
                mainHeaderCell.value = `Chart ${i + 1} - ${reason}`;
                mainHeaderCell.alignment = { horizontal: 'left' };
                mainHeaderCell.font = {
                    bold: true,
                    color: { argb: 'FFFFFFFF' },
                    name: 'Arial',
                    size: 12,
                    family: 2
                };
                mainHeaderCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF9B112E' }
                };
    
                if (datasets.length > 0) {
                    worksheet.mergeCells(`A${mainHeaderStartRow}:${mainHeaderEndColumn}${mainHeaderStartRow}`);
                }
    
                // adding subheader row 
                const subheaderRow = worksheet.addRow(['Label', ...datasets.map((dataset, idx) => dataset.label || `Category ${idx + 1}`)]);
                subheaderRow.eachCell((cell) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFF6AA26' }
                    };
                    cell.font = {
                        bold: true,
                        color: { argb: 'FFFFFFFF' },
                        name: 'Arial',
                        size: 12,
                        family: 2
                    };
                    cell.alignment = { horizontal: 'center' };
                });
    
                // adding data rows to worksheet
                chartData.forEach(dataRow => {
                    const rowData = [];
                    rowData.push(dataRow.Label);
    
                    datasets.forEach(dataset => {
                        rowData.push(dataRow[dataset.label] || '');
                    });
    
                    const dataRowInstance = worksheet.addRow(rowData);
    
                    dataRowInstance.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        if (colNumber === 1) {
                            cell.alignment = { horizontal: 'left' };
                        } else {
                            cell.alignment = { horizontal: 'center' };
                        }
                    });
                });
    
                // adding spacing between charts in summary text
                summaryContent += `Chart ${i + 1} - ${reason}\n`;
    
                // adding category data to summary text
                datasets.forEach((dataset, datasetIndex) => {
                    const datasetLabel = dataset.label || `Dataset ${datasetIndex + 1}`;
                    summaryContent += `${datasetLabel}:\n`;
    
                    dataset.data.forEach((value, index) => {
                        const label = chartInstance.data.labels[index];
                        summaryContent += `${label}: ${value}\n`;
                    });
    
                    summaryContent += '\n';
                });
    
                // adding horizontal line between charts in summary text
                summaryContent += '-------------------------------------------------\n';
    
                // generating image for the chart and adding to ZIP
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const originalCanvas = await html2canvas(chart);
                canvas.width = originalCanvas.width;
                canvas.height = originalCanvas.height + 60;
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.font = 'bold 18px Poppins';
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';
                ctx.fillText(reason, canvas.width / 2, 20);
                ctx.drawImage(originalCanvas, 0, 30);
                const dataURL = canvas.toDataURL('image/png');
                zip.file(`chart${i + 1}.png`, dataURL.split('base64,')[1], { base64: true });
            }
    
            // auto-fit column widths based on content length for all columns
            worksheet.columns.forEach((column) => {
                let maxWidth = 0;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    const cellWidth = cell.value ? cell.value.toString().length + 2 : 10; 
                    if (cellWidth > maxWidth) {
                        maxWidth = cellWidth;
                    }
                });
                column.width = maxWidth < 25 ? maxWidth : 25; 
            });
    
            // generating excel file and add to ZIP
            const excelBuffer = await workbook.xlsx.writeBuffer();
            zip.file('GABAY Summary.xlsx', excelBuffer);
    
            // adding summary text file to ZIP
            zip.file('GABAY Summary.txt', summaryContent);
    
            // generating ZIP file and trigger download
            zip.generateAsync({ type: 'blob' }).then(content => {
                saveAs(content, 'GABAY Charts & Summary.zip');
            });
        } catch (error) {
            console.error('Error exporting charts and data:', error);
        }
    });
    
    /** 
     * Event listener for exporting the data from dashboard into PDF.
     * Exports the data into a PDF file containing the chart images and a summary
    */
    document.getElementById('exportPDFButton').addEventListener('click', async () => {
        try {
            //Setup PDF file
            const summaryPDF = new jsPDF();
        
            const charts = document.querySelectorAll('canvas');
            
            for (let i = 0; i < charts.length; i++) {
                const chart = charts[i];
                const reason = chart.getAttribute('data-reason') || '';
                const chartInstance = Chart.getChart(chart);
                const datasets = chartInstance.data.datasets;
    
                let chartData = []; // preparing data for excel and summary text
    
                // populating chart data
                chartInstance.data.labels.forEach((label, index) => {
                    let rowData = {
                        'Label': label
                    };
    
                    // populating data for each category
                    datasets.forEach((dataset, datasetIndex) => {
                        const categoryName = dataset.label || `Category ${datasetIndex + 1}`;
                        const value = dataset.data[index];
                        rowData[categoryName] = value;
                    });
    
                    chartData.push(rowData);
                });
                
                //Convert chart to image 
                const canvasImage = chart.toDataURL('image/jpg', 1.0);
                
                summaryPDF.setFontSize(14);
                summaryPDF.setFont("times", "bold");
                summaryPDF.text(`Chart ${i + 1} ${reason}`, 15, 30);

                // addImage(file, file format, left margin, top margin, width, height)
                summaryPDF.addImage(canvasImage, 'JPEG', 15, 40, 180, 110);
                
                summaryPDF.setFontSize(12);
                summaryPDF.setFont("times", "normal");

                //This variable is basically top margin
                var verticalOffset = 160;

                // adding category data
                datasets.forEach((dataset, datasetIndex) => {
                    const datasetLabel = dataset.label || `Dataset ${datasetIndex + 1}`;
                    summaryPDF.text(`${datasetLabel}:`, 15, verticalOffset);
                    
                    verticalOffset += 5;

                    dataset.data.forEach((value, index) => {
                        const label = chartInstance.data.labels[index];
                        summaryPDF.text(`${label}: ${value}`, 15, verticalOffset);
                        verticalOffset += 5;
                    });

                    verticalOffset += 5;
                });
    
                // Add a new page for the next chart
                if (i < charts.length - 1) {
                    summaryPDF.addPage();
                }
            }
    
            summaryPDF.save('Gabay-Summary.pdf');

        } catch (error) {
            console.error('Error exporting to PDF:', error);
        }
    });



    /**
     * Event listener for exporting the overall data from dashboard into excel sheet.
     * Exports the data into excel sheet.
     */
    document.getElementById('exportExcelButton').addEventListener('click', async () => {
        try {
            const response = await fetch('/dashboard/export');
            if (response.ok) {
                const blob = await response.blob();
                saveAs(blob, 'GABAY Data Sheet.xlsx');
            } else {
                console.error('Failed to export data:', response.statusText);
            }
        } catch (error) {
            console.error('Error exporting data to Excel:', error);
        }
    });

    /**
     * Event listener for the edit button.
     * Opens the edit modal with the data of the selected patient.
     */
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
                
                if (patient.data_type === 'Biomedical') {
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
                } else if (patient.data_type === 'Nonbiomedical') {
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

    /**
    * Event listener for the close button of the edit modal.
    * Closes the edit modal when clicked.
    */
    span.onclick = function () {
        editModal.style.display = "none";
    }

    /**
    * Event listener for clicks outside the modal.
    * Closes the edit modal if the user clicks outside of it.
    */
    window.onclick = function (event) {
        if (event.target == editModal) {
            editModal.style.display = "none";
        }
    }

    /**
    * Event listener for the edit form submission.
    * Submits the updated patient data to the server.
    * @param {Event} event - The form submission event.
    */
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
    
    /**
    * Event listeners for the delete button.
    * Confirms deletion of a record.
    */
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            if (!confirm('Are you sure you want to delete this record?')) {
                event.preventDefault(); 
            }
        });
    });

});

/**
 * Fetches and handles response parameters from the URL.
 * Displays an alert if a message or error is present in the URL parameters.
 */
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

/**
 * Toggles the display of graphs and filters in the container.
 * @param {HTMLElement} button - The button that triggers the toggle.
 */
function toggleGraphs(button) {
    const container = button.closest('.container');
    const graphContainer = container.querySelector('.biomedical-container') || container.querySelector('.nonbiomedical-container');
    const filter = container.querySelector('.filter');
    
    if (graphContainer.style.display === 'none') {
        graphContainer.style.display = 'grid';
        filter.style.display = 'flex'; 
        button.querySelector('i').classList.replace('bxs-chevron-up', 'bxs-chevron-down');
    } else {
        graphContainer.style.display = 'none';
        filter.style.display = 'none';
        button.querySelector('i').classList.replace('bxs-chevron-down', 'bxs-chevron-up');
    }
}

/**
 * Toggles the visibility of fields based on the selected data type.
 */
function toggleFields() {
    const dataType = document.querySelector('input[name="data_type"]:checked').value;
    const biomedicalFields = document.querySelectorAll('.biomedicalfield, #barangay-field, #remarks-field');
    const nonbiomedicalFields = document.querySelectorAll('.nonbiomedicalfield');

    if (dataType === 'Biomedical') {
        biomedicalFields.forEach(field => {
            field.style.display = 'flex';
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => input.required = true);
        });
        // Toggle location-specific fields based on location selection
        toggleLocationFields();
        nonbiomedicalFields.forEach(field => {
            field.style.display = 'none';
            const inputs = field.querySelectorAll('input, select');
            inputs.forEach(input => input.required = false);
        });
    } else if (dataType === 'Nonbiomedical') {
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

/**
 * Toggles the visibility of location-specific fields in the form.
 */
function toggleLocationFields() {
    const location = document.querySelector('input[name="location"]:checked');
    const barangayField = document.getElementById('barangay-field');
    const remarksField = document.getElementById('remarks-field');

    if (location && document.querySelector('input[name="data_type"]:checked').value === 'Biomedical') {
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

/**
 * Toggles the visibility of location-specific fields in the edit form.
 */
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

/**
 * Clears the form inputs.
 */
function clearForm() {
    var form = document.getElementById('tracker-form');
    form.reset();
}

/**
 * Checks if a field is empty.
 * @param {string} field - The field value to check.
 * @returns {boolean} True if the field is not empty, false otherwise.
 */
function checkEmpty(field){
    if(/^\s*$/.test(field)){
        return false;
    }
    else{
        return true;
    }
}

/**
 * Validates the form before submission.
 * Ensures the appropriate selections based on the tested and result values.
 * @returns {boolean} True if the form is valid, false otherwise.
 */
function validateForm() {
    var tested = document.querySelector('input[name="tested"]:checked');
    var result = document.querySelector('input[name="result"]:checked');

    if (result && result.value === "Do Not Know") {
        if (!tested || tested.value !== "Yes") {
            alert("You can only select 'Don't Know' if the person has been tested before.");
            return false;
        }
    }

    // Check location-specific fields based on chosen location
    var location = document.querySelector('input[name="location"]:checked');
    if (location) {
        if (location.value === "Caloocan") {
            var barangay = document.getElementById('barangay').value;
            if (!barangay) {
                alert("Please fill the Barangay field.");
                return false;
            }
            document.getElementById('remarks').removeAttribute('required');
        } else if (location.value === "Not in Caloocan") {
            var remarks = document.getElementById('remarks').value;
            if (!remarks) {
                alert("Please fill the Remarks field.");
                return false;
            }
            document.getElementById('barangay').removeAttribute('required');
        }
    }

    // Check if all required fields are filled (excluding location-specific fields already validated)
    var requiredFields = document.querySelectorAll('#tracker-form [required]:not(#barangay, #remarks)');
    for (var i = 0; i < requiredFields.length; i++) {
        if (!requiredFields[i].value || (requiredFields[i].type === 'radio' && !document.querySelector(`input[name="${requiredFields[i].name}"]:checked`))) {
            alert("Please fill all required fields.");
            return false;
        }
    }

    // Submit the form if all validations pass
    document.getElementById("tracker-form").submit();
}

/**
 * Fetches data from the given endpoint.
 * @async
 * @param {string} endpoint - The URL to fetch data from.
 * @returns {Promise<Object|null>} The fetched data or null in case of an error.
 */
async function fetchData(endpoint) {
    try {
        const response = await fetch(endpoint);
        const responseData = await response.json();
        return responseData.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

/**
 * Processes biomedical data for a specific chart.
 * @param {Array} array - The data array to process.
 * @param {string} labelKey - The key used for labeling data points.
 * @returns {Object} An object containing labels and datasets for the chart.
 */
function processBiomedicalChartData(array, labelKey) {
    if (!Array.isArray(array) || array.length === 0) {
        console.error('Expected a non-empty array for data processing:', array);
        return { labels: [], datasets: [] };
    }

    const labels = [];
    const datasets = [];

    array.forEach(item => {
        const { gender, test_result } = item._id;
        const count = item.count;
        const label = item._id[labelKey];

        if (!gender || !test_result) {
            console.error('Missing gender or test_result in data:', item._id);
            return; // skip this item if gender or test_result is missing
        }

        const datasetLabel = `${test_result} ${gender}`;
        let dataset = datasets.find(ds => ds.label === datasetLabel);

        if (!dataset) {
            dataset = {
                label: datasetLabel,
                backgroundColor: getBioColor(test_result, gender),
                data: [],
                meta: []
            };
            datasets.push(dataset);
        }

        const labelIndex = labels.indexOf(label);
        if (labelIndex === -1) {
            labels.push(label);
            datasets.forEach(ds => ds.data.push(0));
            dataset.data[labels.indexOf(label)] = count;
        } else {
            dataset.data[labelIndex] = count;
        }

        dataset.meta[labelIndex] = { gender, test_result, count };
    });

    const filteredDatasets = datasets.filter(ds => ds.data.some(data => data !== 0));
   
    return { labels, datasets: filteredDatasets };
}

/**
 * Processes nonbiomedical data for a specific chart.
 * @param {Array} array - The data array to process.
 * @param {string} labelKey - The key used for labeling data points.
 * @returns {Object} An object containing labels and datasets for the chart.
 */
function processNonBiomedicalChartData(array, labelKey) {
    if (!Array.isArray(array) || array.length === 0) {
        console.error('Expected a non-empty array for data processing:', array);
        return { labels: [], datasets: [] };
    }

    const labels = [];
    const datasets = [];

    array.forEach(item => {
        const { gender } = item._id;
        const count = item.count;
        const label = item._id[labelKey];

        if (!gender || !label) {
            console.error('Missing gender or label in data:', item._id);
            return; // skip this item if gender or label is missing
        }

        const datasetLabel = `${gender}`;
        let dataset = datasets.find(ds => ds.label === datasetLabel);

        if (!dataset) {
            dataset = {
                label: datasetLabel,
                backgroundColor: getNonbioColor(gender),
                data: [],
                meta: []
            };
            datasets.push(dataset);
        }

        const labelIndex = labels.indexOf(label);
        if (labelIndex === -1) {
            labels.push(label);
            datasets.forEach(ds => ds.data.push(0));
            dataset.data[labels.indexOf(label)] = count;
        } else {
            dataset.data[labelIndex] = count;
        }

        dataset.meta[labelIndex] = { gender, count };
    });

    const filteredDatasets = datasets.filter(ds => ds.data.some(data => data !== 0));
   
    return { labels, datasets: filteredDatasets };
}

/**
 * Determines the color based on test_result and gender for biomedical records.
 * @param {string} test_result - The test result (e.g., "Positive", "Negative").
 * @param {string} gender - The gender (e.g., "Male", "Female", "Transgender").
 * @returns {string} The corresponding color in rgba format.
 */
function getBioColor(test_result, gender) {
    const colors = {
        Positive: {
            Male: 'rgba(0, 150, 136, 0.3)',    
            Female: 'rgba(233, 30, 99, 0.3)', 
            Transgender: 'rgba(225, 152, 0, 0.3)'
        },
        Negative: {
            Male: 'rgba(159, 244, 245, 0.7)',    
            Female: 'rgba(233, 30, 99, 0.7)', 
            Transgender: 'rgba(255, 152, 0, 0.7)'
        },
        'Do Not Know': {
            Male: 'rgba(95, 125, 139, 0.3)',    
            Female: 'rgba(255, 105, 180, 0.5)', 
            Transgender: 'rgba(255, 152, 0, 0.5)'
        }
    };
    
    // check if test_result and gender are valid keys in colors object
    if (colors[test_result] && colors[test_result][gender]) {
        return colors[test_result][gender];
    } else {
        // return a default color if combination is not recognized
        return 'rgba(0, 0, 0, 0.5)';
    }
}

/**
 * Determines the color based on gender for nonbiomedical records.
 * @param {string} gender - The gender (e.g., "Male", "Female", "Transgender").
 * @returns {string} The corresponding color in rgba format.
 */
function getNonbioColor(gender) {
    const colors = {
        Male: 'rgba(0, 150, 136, 0.3)',    
        Female: 'rgba(233, 30, 99, 0.3)', 
        Transgender: 'rgba(225, 152, 0, 0.3)'
    };

    if (colors[gender]) {
        return colors[gender];
    } else {
        return 'rgba(0, 0, 0, 0.5)'; // default color
    }
}

//declaring charts
let bioChart1;
let bioChart2;
let bioChart3;
let bioChart4;
let bioChart5;
let bioChart6;
let nonbioChart1;
let nonbioChart2;
let nonbioChart3;

/**
 * Renders a chart using Chart.js.
 * @param {CanvasRenderingContext2D} ctx - The context of the canvas element to render the chart on.
 * @param {Object} data - The data for the chart.
 * @param {Object} config - The configuration options for the chart.
 */
function renderChart(ctx, data, config) {
    try {
        return new Chart(ctx, { ...config, data });
    } catch (error) {
        console.error('Error rendering chart:', error);
    }
}

/**
 * Initializes charts by fetching data and rendering them.
 */
async function initializeCharts(monthly=0,yearly=0) {
    try {
        monthlyQuery = monthly !== 0 ? `monthly=${monthly}` : ''
        yearlyQuery = yearly !== 0 ? `yearly=${yearly}`: ''
        connector1 = monthly !== 0 && yearly !== 0 ? `&`: ''
        queryParams = `?${monthlyQuery}${connector1}${yearlyQuery}`

        const data = await fetchData(`/dashboard/data${queryParams}`);
        if (!data) {
            displayNoDataMessage('.biomedical-container, .nonbiomedical-container'); // display message if no data fetched
            return;
        }
        const config = {
            type: 'bar',
            data: {},
            options: {
                indexAxis: 'y',
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            precision: 0
                        }
                    }
                }
            }
        };

        // Get chart contexts for biomedical records
        const ctxReason = document.getElementById('chartReason').getContext('2d');
        const ctxKVP = document.getElementById('chartKVP').getContext('2d');
        const ctxTestedBefore = document.getElementById('chartTestedBefore').getContext('2d');
        const ctxAge = document.getElementById('chartAge').getContext('2d');
        const ctxFirstTimeTesters = document.getElementById('chartFirstTimeTesters').getContext('2d');
        const ctxLinkage = document.getElementById('chartLinkage').getContext('2d');

        // Check if each dataset has data, otherwise display a message
        const reasonData = processBiomedicalChartData(data.reason, 'reason');
        if (reasonData.datasets.length === 0) {
            displayNoDataMessage('.graph3', 'Testing outcomes by main reason for HIV Test:','chartReason');
        } else {
            if (bioChart1 != undefined){
                bioChart1.destroy();
                bioChart1 = renderChart(ctxReason, reasonData, config);
            }
            else{
                bioChart1 = renderChart(ctxReason, reasonData, config);
            }
            document.getElementById('chartReason').setAttribute('data-reason', 'Testing outcomes by main reason for HIV Test');
        }

        const kvpData = processBiomedicalChartData(data.kvp, 'kvp');
        if (kvpData.datasets.length === 0) {
            displayNoDataMessage('.graph5', 'Testing outcomes by Key or Vulnerable Population (KVP) at higher risk','chartKVP');
        } else {
            if (bioChart2 != undefined){
                bioChart2.destroy();
                bioChart2 = renderChart(ctxKVP, kvpData, config);
            }
            else{
                bioChart2 = renderChart(ctxKVP, kvpData, config);
            }
            document.getElementById('chartKVP').setAttribute('data-reason', 'Testing outcomes by Key or Vulnerable Population (KVP) at higher risk');
        }

        const testedBeforeData = processBiomedicalChartData(data.testedBefore, 'tested_before');
        if (testedBeforeData.datasets.length === 0) {
            displayNoDataMessage('.graph1', 'Testing outcomes for clients who were tested before (repeat testers)','chartTestedBefore');
        } else {
            if (bioChart3 != undefined){
                bioChart3.destroy();
                bioChart3 = renderChart(ctxTestedBefore, testedBeforeData, config);
            }
            else{
                bioChart3 = renderChart(ctxTestedBefore, testedBeforeData, config);
            }
            document.getElementById('chartTestedBefore').setAttribute('data-reason', 'Testing outcomes for clients who were tested before (repeat testers)');
        }

        const ageData = processBiomedicalChartData(data.ageRange, 'age');
        if (ageData.datasets.length === 0) {
            displayNoDataMessage('.graph2', 'Testing outcomes by age','chartAge');
        } else {
            if (bioChart4 != undefined){
                bioChart4.destroy();
                bioChart4 = renderChart(ctxAge, ageData, config);
            }
            else{
                bioChart4 = renderChart(ctxAge, ageData, config);
            }
            document.getElementById('chartAge').setAttribute('data-reason', 'Testing outcomes by age');
        }

        const firstTimeTestersData = processBiomedicalChartData(data.testedBefore.filter(item => item._id.tested_before === 'No'), 'tested_before');
        if (firstTimeTestersData.datasets.length === 0) {
            displayNoDataMessage('.graph4', 'Testing outcomes for first time testers','chartFirstTimeTesters');
        } else {
            if (bioChart5 != undefined){
                bioChart5.destroy();
                bioChart5 = renderChart(ctxFirstTimeTesters, firstTimeTestersData, config);
            }
            else{
                bioChart5 = renderChart(ctxFirstTimeTesters, firstTimeTestersData, config);
            }
            document.getElementById('chartFirstTimeTesters').setAttribute('data-reason', 'Testing outcomes for first time testers');
        }

        const linkageData = processBiomedicalChartData(data.linkage, 'linkage');
        if (linkageData.datasets.length === 0) {
            displayNoDataMessage('.graph6', 'Linkage for positive clients','chartLinkage');
        } else {
            if (bioChart6 != undefined){
                bioChart6.destroy();
                bioChart6 = renderChart(ctxLinkage, linkageData, config);
            }
            else{
                bioChart6 = renderChart(ctxLinkage, linkageData, config);
            }
            document.getElementById('chartLinkage').setAttribute('data-reason', 'Linkage for positive clients');
        }

        // Get chart contexts for nonbiomedical records
        const ctxStigma = document.getElementById('chartStigma').getContext('2d');
        const ctxDiscrimination = document.getElementById('chartDiscrimination').getContext('2d');
        const ctxViolence = document.getElementById('chartViolence').getContext('2d');

       // Check if each dataset has data, otherwise display a message
       const stigmaData = processNonBiomedicalChartData(data.stigma, 'stigma');
       if (stigmaData.datasets.length === 0) {
           displayNoDataMessage('.graph7', 'Testing outcomes for stigma','chartStigma');
       } else {
            if (nonbioChart1 != undefined){
                nonbioChart1.destroy();
                nonbioChart1 = renderChart(ctxStigma, stigmaData, config);
            }
            else{
                nonbioChart1 = renderChart(ctxStigma, stigmaData, config);
            }
            document.getElementById('chartStigma').setAttribute('data-reason', 'Testing outcomes for stigma');
       }

       const discriminationData = processNonBiomedicalChartData(data.discrimination, 'discrimination');
       if (discriminationData.datasets.length === 0) {
           displayNoDataMessage('.graph8', 'Testing outcomes for discrimination','chartDiscrimination');
       } else {
            if (nonbioChart2 != undefined){
                nonbioChart2.destroy();
                nonbioChart2 = renderChart(ctxDiscrimination, discriminationData, config);
            }
            else{
                nonbioChart2 = renderChart(ctxDiscrimination, discriminationData, config);
            }
            document.getElementById('chartDiscrimination').setAttribute('data-reason', 'Testing outcomes for discrimination');
       }

       const violenceData = processNonBiomedicalChartData(data.violence, 'violence');
       if (violenceData.datasets.length === 0) {
           displayNoDataMessage('.graph9', 'Testing outcomes for violence','chartViolence');
       } else {
            if (nonbioChart3 != undefined){
                nonbioChart3.destroy();
                nonbioChart3 = renderChart(ctxViolence, violenceData, config);
            }
            else{
                nonbioChart3 = renderChart(ctxViolence, violenceData, config);
            }
            document.getElementById('chartViolence').setAttribute('data-reason', 'Testing outcomes for violence');
       }

    } catch (error) {
        console.error('Error fetching or processing data:', error);
        displayNoDataMessage('.biomedical-container, .nonbiomedical-container'); 
    }
}

/**
* Displays a message indicating no data available.
* @param {string} selector - CSS selector for the container where the message should be displayed.
* @param {string} reasonText - Reason text to display alongside the message.
*/
function displayNoDataMessage(selector, reasonText, targetId) {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
        container.innerHTML = `
            <p class="reason">${reasonText}</p>
            <p class="message">No data available yet.</p>
            <div class="chart">
                <canvas id="${targetId}"></canvas>
            </div>
        `;
    });
}

/**
* Removes no data message.
* @param {string} selector - CSS selector for the container where the message should be displayed.
* @param {string} reasonText - Reason text to display alongside the message.
*/
function removeNoDataMessage(selector, reasonText, targetId) {
    const containers = document.querySelectorAll(selector);
    containers.forEach(container => {
        container.innerHTML = `
            <p class="reason">${reasonText}</p>
            <div class="chart">
                <canvas id="${targetId}"></canvas>
            </div>
        `;
    });
}