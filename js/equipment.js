$(document).ready(function() {
    // API Base URL
    const API_BASE_URL = 'http://localhost:8080/api/v1/equipment';

    // State management
    let equipmentData = [];
    let currentEditId = null;

    // Initialize the application
    loadEquipmentData();
    setupEventListeners();

    // Set up all event listeners
    function setupEventListeners() {
        // Open form popup
        $('#openFormBtn').on('click', function() {
            openEquipmentForm();
        });

        // Close form popup
        $('#closePopupBtn, #cancelBtn').on('click', function() {
            closeEquipmentForm();
        });

        // Close view popup
        $('.close-view-popup').on('click', function() {
            closeViewPopup();
        });

        // Form submission
        $('#equipmentForm').on('submit', function(e) {
            e.preventDefault();
            saveEquipment();
        });

        // Search functionality
        $('#searchInput').on('input', function() {
            filterEquipment($(this).val());
        });

        // Refresh button
        $('#refreshBtn').on('click', function() {
            loadEquipmentData();
        });

        // Export button
        $('#exportBtn').on('click', function() {
            exportEquipmentData();
        });

        // Print button
        $('#printBtn').on('click', function() {
            printEquipmentData();
        });

        // Generate full report
        $('#generateReportBtn').on('click', function() {
            generateFullReport();
        });
    }

    // Load equipment data from backend
    function loadEquipmentData() {
        showLoading(true);

        $.ajax({
            url: API_BASE_URL,
            type: 'GET',
            dataType: 'json',
            success: function(data) {
                equipmentData = data;
                renderEquipmentTable(equipmentData);
                updateStats(equipmentData);
                showLoading(false);
            },
            error: function(xhr, status, error) {
                console.error('Error loading equipment data:', error);
                showError('Failed to load equipment data. Please try again.');
                showLoading(false);
            }
        });
    }

    // Render equipment table
    function renderEquipmentTable(data) {
        const $tableBody = $('#equipmentTableBody');
        $tableBody.empty();

        if (data.length === 0) {
            $tableBody.html(`
                    <tr>
                        <td colspan="7" class="text-center py-4 text-muted">
                            <i class="fas fa-inbox fa-2x mb-2"></i>
                            <p>No equipment found. Add your first equipment to get started.</p>
                        </td>
                    </tr>
                `);
            return;
        }

        data.forEach(equipment => {
            const statusClass = getStatusClass(equipment.status);
            const statusText = equipment.status || 'Unknown';

            const row = `
                    <tr data-id="${equipment.equipmentId}">
                        <td>${equipment.equipmentId || 'N/A'}</td>
                        <td>${equipment.name || 'N/A'}</td>
                        <td>${equipment.type || 'N/A'}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>${equipment.staffId || 'N/A'}</td>
                        <td>${equipment.fieldCode || 'N/A'}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="action-btn view-btn" data-id="${equipment.equipmentId}">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="action-btn edit-btn" data-id="${equipment.equipmentId}">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="action-btn delete-btn" data-id="${equipment.equipmentId}">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;

            $tableBody.append(row);
        });

        // Add event listeners to action buttons
        $('.view-btn').on('click', function() {
            const id = $(this).data('id');
            viewEquipment(id);
        });

        $('.edit-btn').on('click', function() {
            const id = $(this).data('id');
            editEquipment(id);
        });

        $('.delete-btn').on('click', function() {
            const id = $(this).data('id');
            deleteEquipment(id);
        });
    }

    // Get CSS class for status badge
    function getStatusClass(status) {
        switch (status) {
            case 'Active': return 'status-active';
            case 'Inactive': return 'status-inactive';
            case 'Maintenance': return 'status-maintenance';
            default: return 'status-inactive';
        }
    }

    // Update statistics cards
    function updateStats(data) {
        const total = data.length;
        const active = data.filter(item => item.status === 'Active').length;
        const maintenance = data.filter(item => item.status === 'Maintenance').length;

        $('#totalEquipment').text(total);
        $('#activeEquipment').text(active);
        $('#maintenanceEquipment').text(maintenance);
    }

    // Open equipment form (add mode)
    function openEquipmentForm() {
        $('#popupTitle').text('Add New Equipment');
        $('#editMode').val('false');
        $('#editEquipmentId').val('');
        $('#equipmentForm')[0].reset();
        $('#equipmentFormPopup').addClass('active');
    }

    // Close equipment form
    function closeEquipmentForm() {
        $('#equipmentFormPopup').removeClass('active');
    }

    // Close view popup
    function closeViewPopup() {
        $('#viewEquipmentPopup').removeClass('active');
    }

    // Save equipment (create or update)
    function saveEquipment() {
        const isEditMode = $('#editMode').val() === 'true';
        const equipmentId = $('#editEquipmentId').val();

        const formData = {
            equipmentId: $('#equipmentIdInput').val(),
            name: $('#nameInput').val(),
            type: $('#typeInput').val(),
            status: $('#statusInput').val(),
            staffId: $('#staffIdInput').val(),
            fieldCode: $('#fieldCodeInput').val()
        };

        // Validate required fields
        if (!formData.equipmentId || !formData.name || !formData.type ||
            !formData.status || !formData.staffId || !formData.fieldCode) {
            showError('Please fill in all required fields.');
            return;
        }

        showLoading(true);

        const url = isEditMode ? `${API_BASE_URL}/${equipmentId}` : `${API_BASE_URL}/save`;
        const method = isEditMode ? 'PUT' : 'POST';

        $.ajax({
            url: url,
            type: method,
            contentType: 'application/json',
            data: JSON.stringify(formData),
            success: function(response) {
                showSuccess(`Equipment ${isEditMode ? 'updated' : 'added'} successfully!`);
                closeEquipmentForm();
                loadEquipmentData();
            },
            error: function(xhr, status, error) {
                console.error('Error saving equipment:', error);
                showError(`Failed to ${isEditMode ? 'update' : 'add'} equipment. Please try again.`);
                showLoading(false);
            }
        });
    }

    // View equipment details
    function viewEquipment(id) {
        showLoading(true);

        $.ajax({
            url: `${API_BASE_URL}/${id}`,
            type: 'GET',
            success: function(equipment) {
                $('#detail-id').text(equipment.equipmentId || 'N/A');
                $('#detail-name').text(equipment.name || 'N/A');
                $('#detail-type').text(equipment.type || 'N/A');
                $('#detail-staff').text(equipment.staffId || 'N/A');
                $('#detail-field').text(equipment.fieldCode || 'N/A');

                // Update status badge
                const statusClass = getStatusClass(equipment.status);
                const statusText = equipment.status || 'Unknown';
                $('#detail-status')
                    .removeClass('status-active status-inactive status-maintenance')
                    .addClass(`status-badge ${statusClass}`)
                    .text(statusText);

                $('#viewEquipmentPopup').addClass('active');
                showLoading(false);
            },
            error: function(xhr, status, error) {
                console.error('Error loading equipment details:', error);
                showError('Failed to load equipment details. Please try again.');
                showLoading(false);
            }
        });
    }

    // Edit equipment
    function editEquipment(id) {
        showLoading(true);

        $.ajax({
            url: `${API_BASE_URL}/${id}`,
            type: 'GET',
            success: function(equipment) {
                $('#popupTitle').text('Edit Equipment');
                $('#editMode').val('true');
                $('#editEquipmentId').val(equipment.equipmentId);

                // Fill form with equipment data
                $('#equipmentIdInput').val(equipment.equipmentId);
                $('#nameInput').val(equipment.name);
                $('#typeInput').val(equipment.type);
                $('#statusInput').val(equipment.status);
                $('#staffIdInput').val(equipment.staffId);
                $('#fieldCodeInput').val(equipment.fieldCode);

                $('#equipmentFormPopup').addClass('active');
                showLoading(false);
            },
            error: function(xhr, status, error) {
                console.error('Error loading equipment for edit:', error);
                showError('Failed to load equipment data for editing. Please try again.');
                showLoading(false);
            }
        });
    }

    // Delete equipment
    function deleteEquipment(id) {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                showLoading(true);

                $.ajax({
                    url: `${API_BASE_URL}/${id}`,
                    type: 'DELETE',
                    success: function() {
                        showSuccess('Equipment deleted successfully!');
                        loadEquipmentData();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error deleting equipment:', error);
                        showError('Failed to delete equipment. Please try again.');
                        showLoading(false);
                    }
                });
            }
        });
    }

    // Filter equipment based on search input
    function filterEquipment(searchTerm) {
        if (!searchTerm) {
            renderEquipmentTable(equipmentData);
            return;
        }

        const filteredData = equipmentData.filter(equipment => {
            return (
                (equipment.equipmentId && equipment.equipmentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (equipment.name && equipment.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (equipment.type && equipment.type.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (equipment.status && equipment.status.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (equipment.staffId && equipment.staffId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (equipment.fieldCode && equipment.fieldCode.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        });

        renderEquipmentTable(filteredData);
    }

    // Export equipment data
    function exportEquipmentData() {
        // Convert data to CSV
        const headers = ['Equipment ID', 'Name', 'Type', 'Status', 'Staff ID', 'Field Code'];
        const csvData = equipmentData.map(equipment => [
            equipment.equipmentId || '',
            equipment.name || '',
            equipment.type || '',
            equipment.status || '',
            equipment.staffId || '',
            equipment.fieldCode || ''
        ]);

        // Create CSV content
        let csvContent = headers.join(',') + '\n';
        csvData.forEach(row => {
            csvContent += row.map(field => `"${field}"`).join(',') + '\n';
        });

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'equipment_data.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showSuccess('Equipment data exported successfully!');
    }

    // Print equipment data
    function printEquipmentData() {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
                <html>
                    <head>
                        <title>Equipment Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            h1 { color: #3498db; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                            th { background-color: #f2f2f2; }
                            .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
                            .status-active { background-color: #d4edda; color: #155724; }
                            .status-inactive { background-color: #f8d7da; color: #721c24; }
                            .status-maintenance { background-color: #fff3cd; color: #856404; }
                        </style>
                    </head>
                    <body>
                        <h1>Equipment Report</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Equipment ID</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Staff ID</th>
                                    <th>Field Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${equipmentData.map(equipment => `
                                    <tr>
                                        <td>${equipment.equipmentId || 'N/A'}</td>
                                        <td>${equipment.name || 'N/A'}</td>
                                        <td>${equipment.type || 'N/A'}</td>
                                        <td><span class="status-badge ${getStatusClass(equipment.status)}">${equipment.status || 'Unknown'}</span></td>
                                        <td>${equipment.staffId || 'N/A'}</td>
                                        <td>${equipment.fieldCode || 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                </html>
            `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }

    // Generate full report - FIXED VERSION
    function generateFullReport() {
        // Create a comprehensive report with charts
        const printWindow = window.open('', '_blank');

        // Count equipment by status, type, and field
        const statusCounts = countByProperty('status');
        const typeCounts = countByProperty('type');
        const fieldCounts = countByProperty('fieldCode');

        // Create HTML content for the report
        const reportContent = `
                <html>
                    <head>
                        <title>Equipment Management System - Full Report</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 30px; }
                            h1 { color: #3498db; text-align: center; margin-bottom: 20px; }
                            h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
                            .report-section { margin-bottom: 30px; }
                            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                            th { background-color: #f8f9fa; }
                            .summary-card { background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0; }
                            .summary-card h3 { margin-top: 0; color: #2c3e50; }
                            .status-badge { padding: 4px 8px; border-radius: 12px; font-size: 12px; }
                            .status-active { background-color: #d4edda; color: #155724; }
                            .status-inactive { background-color: #f8d7da; color: #721c24; }
                            .status-maintenance { background-color: #fff3cd; color: #856404; }
                            .chart-container { display: flex; justify-content: space-around; margin: 20px 0; }
                            .chart { width: 30%; text-align: center; }
                            .chart-title { font-weight: bold; margin-bottom: 10px; }
                            @media print {
                                body { margin: 15px; }
                                .no-print { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Equipment Management System - Full Report</h1>
                        <p>Generated on: ${new Date().toLocaleString()}</p>

                        <div class="report-section">
                            <h2>Executive Summary</h2>
                            <div class="summary-card">
                                <h3>Total Equipment: ${equipmentData.length}</h3>
                                <p>Active: ${statusCounts.Active || 0} | Inactive: ${statusCounts.Inactive || 0} | Maintenance: ${statusCounts.Maintenance || 0}</p>
                            </div>
                        </div>

                        <div class="report-section">
                            <h2>Equipment List</h2>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Equipment ID</th>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Staff ID</th>
                                        <th>Field Code</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${equipmentData.map(equipment => `
                                        <tr>
                                            <td>${equipment.equipmentId || 'N/A'}</td>
                                            <td>${equipment.name || 'N/A'}</td>
                                            <td>${equipment.type || 'N/A'}</td>
                                            <td><span class="status-badge ${getStatusClass(equipment.status)}">${equipment.status || 'Unknown'}</span></td>
                                            <td>${equipment.staffId || 'N/A'}</td>
                                            <td>${equipment.fieldCode || 'N/A'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>

                        <div class="report-section">
                            <h2>Statistical Analysis</h2>
                            <div class="chart-container">
                                <div class="chart">
                                    <div class="chart-title">Status Distribution</div>
                                    <div>${Object.entries(statusCounts).map(([status, count]) => `
                                        <div>${status}: ${count} (${Math.round((count / equipmentData.length) * 100)}%)</div>
                                    `).join('')}</div>
                                </div>
                                <div class="chart">
                                    <div class="chart-title">Type Distribution</div>
                                    <div>${Object.entries(typeCounts).map(([type, count]) => `
                                        <div>${type}: ${count} (${Math.round((count / equipmentData.length) * 100)}%)</div>
                                    `).join('')}</div>
                                </div>
                                <div class="chart">
                                    <div class="chart-title">Field Distribution</div>
                                    <div>${Object.entries(fieldCounts).map(([field, count]) => `
                                        <div>${field}: ${count} (${Math.round((count / equipmentData.length) * 100)}%)</div>
                                    `).join('')}</div>
                                </div>
                            </div>
                        </div>

                        <div class="no-print" style="margin-top: 30px; text-align: center;">
                            <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 5px; cursor: pointer;">
                                Print Report
                            </button>
                        </div>
                    </body>
                </html>
            `;

        printWindow.document.write(reportContent);
        printWindow.document.close();
    }

    // Helper function to count by property
    function countByProperty(property) {
        const counts = {};
        equipmentData.forEach(equipment => {
            const value = equipment[property] || 'Unknown';
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    // Helper function to get color for status
    function getStatusColor(status) {
        switch (status) {
            case 'Active': return '#28a745';
            case 'Inactive': return '#dc3545';
            case 'Maintenance': return '#ffc107';
            default: return '#6c757d';
        }
    }

    // Report generation functions with different chart types
    window.generateStatusReport = function() {
        const statusCounts = countByProperty('status');
        const categories = Object.keys(statusCounts);
        const data = Object.values(statusCounts);
        const colors = categories.map(status => getStatusColor(status));

        Swal.fire({
            title: '<i class="fas fa-chart-pie" style="color: #3498db;"></i> Equipment Status Distribution',
            html: `
            <div id="statusChartContainer" style="width: 100%; height: 300px;"></div>
        `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true,
            closeButtonHtml: '<i class="fas fa-times"></i>',
            didOpen: () => {
                // Initialize and render the chart
                Highcharts.chart('statusChartContainer', {
                    chart: {
                        type: 'pie',
                        height: 300
                    },
                    title: {
                        text: 'Equipment Status Distribution'
                    },
                    tooltip: {
                        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                    },
                    accessibility: {
                        point: {
                            valueSuffix: '%'
                        }
                    },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer,',
                            dataLabels: {
                                enabled: true,
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                            }
                        }
                    },
                    series: [{
                        name: 'Equipment',
                        colorByPoint: true,
                        data: categories.map((category, index) => ({
                            name: category,
                            y: data[index],
                            color: colors[index]
                        }))
                    }],
                    credits: {
                        enabled: false
                    }
                });

                // Hide the default SweetAlert icon
                const icon = document.querySelector('.swal2-icon.swal2-info');
                if (icon) {
                    icon.style.display = 'none';
                }
            }
        });
    };
    // Helper function to get icon for status
    function getStatusIcon(status) {
        switch (status) {
            case 'Active': return 'fas fa-check-circle';
            case 'Inactive': return 'fas fa-times-circle';
            case 'Maintenance': return 'fas fa-wrench';
            default: return 'fas fa-question-circle';
        }
    }

    window.generateTypeReport = function() {
        const typeCounts = countByProperty('type');
        const categories = Object.keys(typeCounts);
        const data = Object.values(typeCounts);

        Swal.fire({
            title: '<i class="fas fa-tags" style="color: #3498db;"></i> Equipment Type Analysis',
            html: `
            <div id="typeChartContainer" style="width: 100%; height: 300px;"></div>
        `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true,
            closeButtonHtml: '<i class="fas fa-times"></i>',
            didOpen: () => {
                // Initialize and render the chart
                Highcharts.chart('typeChartContainer', {
                    chart: {
                        type: 'bar',
                        height: 300
                    },
                    title: {
                        text: 'Equipment Type Analysis'
                    },
                    xAxis: {
                        categories: categories,
                        title: {
                            text: null
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Count',
                            align: 'high'
                        },
                        labels: {
                            overflow: 'justify'
                        }
                    },
                    tooltip: {
                        valueSuffix: ' units'
                    },
                    plotOptions: {
                        bar: {
                            dataLabels: {
                                enabled: true
                            }
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    series: [{
                        name: 'Equipment Count',
                        data: data,
                        color: '#3498db'
                    }]
                });

                // Hide the default SweetAlert icon
                const icon = document.querySelector('.swal2-icon.swal2-info');
                if (icon) {
                    icon.style.display = 'none';
                }
            }
        });
    };
    window.generateFieldReport = function() {
        const fieldCounts = countByProperty('fieldCode');
        const categories = Object.keys(fieldCounts);
        const data = Object.values(fieldCounts);

        Swal.fire({
            title: '<i class="fas fa-map-marked-alt" style="color: #3498db;"></i> Equipment Field Allocation',
            html: `
            <div id="fieldChartContainer" style="width: 100%; height: 300px;"></div>
        `,
            width: '800px',
            showConfirmButton: false,
            showCloseButton: true,
            closeButtonHtml: '<i class="fas fa-times"></i>',
            didOpen: () => {
                // Initialize and render the chart
                Highcharts.chart('fieldChartContainer', {
                    chart: {
                        type: 'column',
                        height: 300
                    },
                    title: {
                        text: 'Equipment Field Allocation'
                    },
                    xAxis: {
                        categories: categories,
                        title: {
                            text: 'Field Code'
                        }
                    },
                    yAxis: {
                        min: 0,
                        title: {
                            text: 'Equipment Count'
                        }
                    },
                    tooltip: {
                        pointFormat: '<b>{point.y}</b> equipment in {point.x}'
                    },
                    plotOptions: {
                        column: {
                            pointPadding: 0.2,
                            borderWidth: 0,
                            dataLabels: {
                                enabled: true
                            }
                        }
                    },
                    legend: {
                        enabled: false
                    },
                    credits: {
                        enabled: false
                    },
                    series: [{
                        name: 'Equipment Count',
                        data: data,
                        color: '#6c5ce7'
                    }]
                });

                // Hide the default SweetAlert icon
                const icon = document.querySelector('.swal2-icon.swal2-info');
                if (icon) {
                    icon.style.display = 'none';
                }
            }
        });
    };


    // Helper functions
    function showLoading(show) {
        if (show) {
            $('#loadingSpinner').show();
            $('.btn-primary, .btn-secondary, .btn-icon').prop('disabled', true);
        } else {
            $('#loadingSpinner').hide();
            $('.btn-primary, .btn-secondary, .btn-icon').prop('disabled', false);
        }
    }

    function showSuccess(message) {
        Swal.fire({
            icon: 'success',
            title: 'Success',
            text: message,
            timer: 2000,
            showConfirmButton: false
        });
    }

    function showError(message) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: message
        });
    }
});