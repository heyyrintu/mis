class ExcelMISGenerator {
    constructor() {
        this.rawData = [];
        this.ecomData = [];
        this.quickcomData = [];
        this.offlineData = [];
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const generateReports = document.getElementById('generateReports');
        const downloadAll = document.getElementById('downloadAll');

        // File upload events
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Report generation
        generateReports.addEventListener('click', this.generateAllReports.bind(this));
        downloadAll.addEventListener('click', this.downloadAllReports.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
            'application/csv'
        ];

        if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
            this.showError('Please upload a valid Excel (.xlsx, .xls) or CSV file.');
            return;
        }

        // Show file info
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileSize').textContent = this.formatFileSize(file.size);
        document.getElementById('fileInfo').style.display = 'block';

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let workbook;
                if (file.name.toLowerCase().endsWith('.csv')) {
                    // Handle CSV files
                    const csvData = e.target.result;
                    workbook = XLSX.read(csvData, { type: 'string' });
                } else {
                    // Handle Excel files
                    const data = new Uint8Array(e.target.result);
                    workbook = XLSX.read(data, { type: 'array' });
                }
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                this.rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (this.rawData.length > 1) {
                    document.getElementById('recordCount').textContent = `${this.rawData.length - 1} records`;
                    document.getElementById('generationSection').style.display = 'block';
                    this.hideError();
                } else {
                    this.showError('The uploaded file appears to be empty or has no data rows.');
                }
            } catch (error) {
                this.showError('Error reading file: ' + error.message);
            }
        };
        
        if (file.name.toLowerCase().endsWith('.csv')) {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    }

    generateAllReports() {
        try {
            if (this.rawData.length === 0) {
                this.showError('No data available to process.');
                return;
            }

            // Convert raw data to objects
            const headers = this.rawData[0];
            const dataObjects = this.rawData.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });

            // Generate all three reports
            this.generateEcomReport(dataObjects);
            this.generateQuickcomReport(dataObjects);
            this.generateOfflineReport(dataObjects);

            // Display results
            this.displayAllReports();
            document.getElementById('resultsSection').style.display = 'block';
            this.hideError();

        } catch (error) {
            this.showError('Error generating reports: ' + error.message);
        }
    }

    generateEcomReport(data) {
        // Filter for E-commerce channel based on Customer Group
        const ecomData = data.filter(row => {
            const customerGroup = (row['Customer Group'] || '').toLowerCase();
            return customerGroup.includes('amazon') || customerGroup.includes('flipkart');
        });

        // E-com Excel headers
        this.ecomData = ecomData.map(row => ({
            'Customer Group': row['Customer Group'] || '', // Added Customer Group
            'Vehicle Series': row['SHIPMENT Vehicle NO'] || '',
            'Dispatch Date': row['SHIPMENT Pickup DATE'] || row['DELIVERY Note DATE'] || '',
            'Customer Name': row['Customer'] || '',
            'Transporter Name': row['Transporter'] || '',
            'Vehicle No': row['SHIPMENT Vehicle NO'] || '',
            'LR No.': row['SHIPMENT Awb NUMBER'] || '',
            'Invoice No': row['SALES Invoice NO'] || row['DELIVERY Note NO'] || '',
            'Invoice SKU': row['SO Item'] || row['Description of Content'] || '',
            'Invoice Qty': row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || '',
            'Total CBM': row['SI Total CBM'] || row['DN Total CBM'] || '',
            'Number of Boxes': this.calculateBoxes(row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || 0)
        }));
    }

    generateQuickcomReport(data) {
        // Filter for Quick-commerce channel based on Customer Group
        const quickcomData = data.filter(row => {
            const customerGroup = (row['Customer Group'] || '').toLowerCase();
            return customerGroup.includes('bigbasket') || 
                   customerGroup.includes('blinkit') || 
                   customerGroup.includes('zepto') || 
                   customerGroup.includes('swiggy');
        });

        // Quick-com Excel headers
        this.quickcomData = quickcomData.map(row => ({
            'Customer Group': row['Customer Group'] || '', // Added Customer Group
            'Transporter Name': row['Transporter'] || '',
            'LR No.': row['SHIPMENT Awb NUMBER'] || '',
            'Invoice No': row['SALES Invoice NO'] || row['DELIVERY Note NO'] || '',
            'Invoice SKU': row['SO Item'] || '',
            'Invoice Qty': row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || '',
            'Per Unit CBM': row['Per Unit CBM'] || '',
            'Total CBM': row['SI Total CBM'] || row['DN Total CBM'] || '',
            'Number of Boxes': this.calculateBoxes(row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || 0)
        }));
    }

    generateOfflineReport(data) {
        // Filter for offline channels based on Customer Group
        const offlineData = data.filter(row => {
            const customerGroup = (row['Customer Group'] || '').toLowerCase();
            
            // Check if it's in e-commerce or quick-commerce categories
            const isEcom = customerGroup.includes('amazon') || customerGroup.includes('flipkart');
            const isQuickCom = customerGroup.includes('bigbasket') || 
                              customerGroup.includes('blinkit') || 
                              customerGroup.includes('zepto') || 
                              customerGroup.includes('swiggy');
            
            // If not in those categories, it's offline
            return !isEcom && !isQuickCom;
        });

        // Offline Excel headers
        this.offlineData = offlineData.map(row => ({
            'Customer': row['Customer'] || '',
            'Customer Group': row['Customer Group'] || '',
            'Transporter Name': row['Transporter'] || '',
            'LR No.': row['SHIPMENT Awb NUMBER'] || '',
            'Vehicle No': row['SHIPMENT Vehicle NO'] || '',
            'Sales Order No': row['Sales Order No'] || '',
            'Invoice No': row['SALES Invoice NO'] || row['DELIVERY Note NO'] || '',
            'Invoice SKU': row['SO Item'] || '',
            'Invoice Qty': row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || '',
            'Per Unit CBM': row['Per Unit CBM'] || '',
            'Total CBM': row['SI Total CBM'] || row['DN Total CBM'] || '',
            'Pickup Date': row['SHIPMENT Pickup DATE'] || '',
            'Delivered Date': row['DELIVERED Date'] || '',
            'Number of Boxes': this.calculateBoxes(row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || 0)
        }));
    }

    calculateBoxes(qty) {
        // Calculate number of boxes based on quantity
        const quantity = parseFloat(qty) || 0;
        return Math.max(1, Math.ceil(quantity / 20));
    }

    displayAllReports() {
        this.displayReport('ecomTable', this.ecomData, 'ecomCount');
        this.displayReport('quickcomTable', this.quickcomData, 'quickcomCount');
        this.displayReport('offlineTable', this.offlineData, 'offlineCount');
    }

    displayReport(tableId, data, countId) {
        const table = document.getElementById(tableId);
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        
        // Clear previous content
        thead.innerHTML = '';
        tbody.innerHTML = '';
        
        // Update count
        document.getElementById(countId).textContent = `${data.length} records`;
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 20px;">No data available</td></tr>';
            return;
        }
        
        // Create headers
        const headers = Object.keys(data[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        
        // Create data rows (show only first 100 rows for performance)
        const displayData = data.slice(0, 100);
        displayData.forEach(row => {
            const tr = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                td.textContent = row[header] || '';
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        // Add note if data was truncated
        if (data.length > 100) {
            const noteRow = document.createElement('tr');
            const noteCell = document.createElement('td');
            noteCell.colSpan = headers.length;
            noteCell.style.textAlign = 'center';
            noteCell.style.fontStyle = 'italic';
            noteCell.style.padding = '15px';
            noteCell.style.backgroundColor = '#f8f9ff';
            noteCell.textContent = `Showing first 100 rows. Total: ${data.length} records. Download Excel to see all data.`;
            noteRow.appendChild(noteCell);
            tbody.appendChild(noteRow);
        }
    }

    downloadAllReports() {
        this.downloadReport('ecom');
        setTimeout(() => this.downloadReport('quickcom'), 500);
        setTimeout(() => this.downloadReport('offline'), 1000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').style.display = 'block';
    }

    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }
}

// Global function for download buttons
function downloadReport(type) {
    const generator = window.misGenerator;
    let data, filename;
    
    switch(type) {
        case 'ecom':
            data = generator.ecomData;
            filename = 'e-com_excel';
            break;
        case 'quickcom':
            data = generator.quickcomData;
            filename = 'quick-com_excel';
            break;
        case 'offline':
            data = generator.offlineData;
            filename = 'offline_excel';
            break;
        default:
            return;
    }
    
    if (data.length === 0) {
        generator.showError(`No data available for ${filename}.`);
        return;
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MIS Report');

    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `${filename}_${today}.xlsx`);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.misGenerator = new ExcelMISGenerator();
});