class MISDashboard {
    constructor() {
        this.processedData = null;
        this.currentView = 'date'; // 'date' or 'month'
        
        this.initializeUI();
        this.initializeEventListeners();
    }
    
    initializeUI() {
        const dashboardDiv = document.getElementById('dashboardSection');
        if (!dashboardDiv) {
            console.error("Dashboard section not found");
            return;
        }
        
        // Create the filter section
        dashboardDiv.innerHTML = `
            <div class="filter-section">
                <div class="filter-group">
                    <label>View By:</label>
                    <div class="toggle-buttons">
                        <button id="dateViewBtn" class="toggle-btn active">Date</button>
                        <button id="monthViewBtn" class="toggle-btn">Month</button>
                    </div>
                </div>
                
                <div id="dateFilterGroup" class="filter-group">
                    <label for="datePicker">Select Date:</label>
                    <input type="date" id="datePicker" class="date-picker">
                </div>
                
                <div id="monthFilterGroup" class="filter-group" style="display: none;">
                    <label for="monthPicker">Select Month:</label>
                    <input type="month" id="monthPicker" class="month-picker">
                </div>
            </div>
            
            <div class="dashboard-cards">
                <div class="card total-card">
                    <h3>Total</h3>
                    <div class="card-content">
                        <div class="stat">
                            <span class="label">Invoices:</span>
                            <span id="totalInvoices" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Quantity:</span>
                            <span id="totalQuantity" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Total CBM:</span>
                            <span id="totalCBM" class="value">0.00</span>
                        </div>
                    </div>
                </div>
                
                <div class="card ecom-card">
                    <h3>E-Commerce</h3>
                    <div class="card-content">
                        <div class="stat">
                            <span class="label">Invoices:</span>
                            <span id="ecomInvoices" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Quantity:</span>
                            <span id="ecomQuantity" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Total CBM:</span>
                            <span id="ecomCBM" class="value">0.00</span>
                        </div>
                    </div>
                </div>
                
                <div class="card quickcom-card">
                    <h3>Quick-Commerce</h3>
                    <div class="card-content">
                        <div class="stat">
                            <span class="label">Invoices:</span>
                            <span id="quickcomInvoices" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Quantity:</span>
                            <span id="quickcomQuantity" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Total CBM:</span>
                            <span id="quickcomCBM" class="value">0.00</span>
                        </div>
                    </div>
                </div>
                
                <div class="card offline-card">
                    <h3>Offline</h3>
                    <div class="card-content">
                        <div class="stat">
                            <span class="label">Invoices:</span>
                            <span id="offlineInvoices" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Quantity:</span>
                            <span id="offlineQuantity" class="value">0</span>
                        </div>
                        <div class="stat">
                            <span class="label">Total CBM:</span>
                            <span id="offlineCBM" class="value">0.00</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="dashboardNoData" class="no-data-message">
                <p>No data available. Please upload a file first.</p>
            </div>
        `;
    }
    
    initializeEventListeners() {
        // Toggle between date and month view
        const dateViewBtn = document.getElementById('dateViewBtn');
        const monthViewBtn = document.getElementById('monthViewBtn');
        
        if (dateViewBtn) {
            dateViewBtn.addEventListener('click', () => this.switchView('date'));
        }
        
        if (monthViewBtn) {
            monthViewBtn.addEventListener('click', () => this.switchView('month'));
        }
        
        // Date picker change handler
        const datePicker = document.getElementById('datePicker');
        if (datePicker) {
            datePicker.addEventListener('change', (e) => {
                this.filterDataByDate(e.target.value);
            });
        }
        
        // Month picker change handler
        const monthPicker = document.getElementById('monthPicker');
        if (monthPicker) {
            monthPicker.addEventListener('change', (e) => {
                this.filterDataByMonth(e.target.value);
            });
        }
        
        // Set default dates
        const today = new Date();
        if (datePicker) {
            datePicker.valueAsDate = today;
        }
        
        if (monthPicker) {
            const monthValue = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            monthPicker.value = monthValue;
        }
    }
    
    switchView(viewType) {
        this.currentView = viewType;
        
        const dateViewBtn = document.getElementById('dateViewBtn');
        const monthViewBtn = document.getElementById('monthViewBtn');
        const dateFilterGroup = document.getElementById('dateFilterGroup');
        const monthFilterGroup = document.getElementById('monthFilterGroup');
        
        if (!dateViewBtn || !monthViewBtn || !dateFilterGroup || !monthFilterGroup) {
            console.error("Some view elements not found");
            return;
        }
        
        // Update UI
        if (viewType === 'date') {
            dateViewBtn.classList.add('active');
            monthViewBtn.classList.remove('active');
            dateFilterGroup.style.display = 'flex';
            monthFilterGroup.style.display = 'none';
            
            // Apply date filter
            const dateValue = document.getElementById('datePicker').value;
            if (dateValue) {
                this.filterDataByDate(dateValue);
            }
        } else {
            dateViewBtn.classList.remove('active');
            monthViewBtn.classList.add('active');
            dateFilterGroup.style.display = 'none';
            monthFilterGroup.style.display = 'flex';
            
            // Apply month filter
            const monthValue = document.getElementById('monthPicker').value;
            if (monthValue) {
                this.filterDataByMonth(monthValue);
            }
        }
    }
    
    setData(data) {
        // Store the raw data
        this.processedData = data;
        
        const noDataMessage = document.getElementById('dashboardNoData');
        if (noDataMessage) {
            noDataMessage.style.display = 'none';
        }
        
        // Apply the current filter
        if (this.currentView === 'date') {
            const datePicker = document.getElementById('datePicker');
            if (datePicker && datePicker.value) {
                this.filterDataByDate(datePicker.value);
            }
        } else {
            const monthPicker = document.getElementById('monthPicker');
            if (monthPicker && monthPicker.value) {
                this.filterDataByMonth(monthPicker.value);
            }
        }
    }
    
    filterDataByDate(dateStr) {
        if (!this.processedData || !dateStr) return;
        
        // Format date to match the format in the data (assuming 'SALES Invoice DATE' or 'DELIVERY Note DATE')
        const searchDate = new Date(dateStr);
        const formattedDate = searchDate.toISOString().split('T')[0];
        
        // Filter data for the selected date
        const filteredData = this.processedData.filter(row => {
            const invoiceDate = row['SALES Invoice DATE'] || '';
            const deliveryDate = row['DELIVERY Note DATE'] || '';
            
            return invoiceDate.includes(formattedDate) || deliveryDate.includes(formattedDate);
        });
        
        this.updateDashboard(filteredData);
    }
    
    filterDataByMonth(monthStr) {
        if (!this.processedData || !monthStr) return;
        
        // Extract year and month from the input (format: YYYY-MM)
        const [year, month] = monthStr.split('-');
        
        // Filter data for the selected month
        const filteredData = this.processedData.filter(row => {
            const invoiceDate = row['SALES Invoice DATE'] || '';
            const deliveryDate = row['DELIVERY Note DATE'] || '';
            
            // Check if either date is in the selected month
            const checkDate = (dateStr) => {
                if (!dateStr) return false;
                // Try to extract year and month from the date string
                const parts = dateStr.split('-');
                return parts[0] === year && parts[1] === month;
            };
            
            return checkDate(invoiceDate) || checkDate(deliveryDate);
        });
        
        this.updateDashboard(filteredData);
    }
    
    updateDashboard(filteredData) {
        // Group data by category
        const ecomData = filteredData.filter(row => {
            const customerGroup = (row['Customer Group'] || '').toLowerCase();
            return customerGroup.includes('amazon') || customerGroup.includes('flipkart');
        });
        
        const quickcomData = filteredData.filter(row => {
            const customerGroup = (row['Customer Group'] || '').toLowerCase();
            return customerGroup.includes('bigbasket') || 
                   customerGroup.includes('blinkit') || 
                   customerGroup.includes('zepto') || 
                   customerGroup.includes('swiggy');
        });
        
        const offlineData = filteredData.filter(row => {
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
        
        // Calculate statistics
        const stats = {
            total: this.calculateStats(filteredData),
            ecom: this.calculateStats(ecomData),
            quickcom: this.calculateStats(quickcomData),
            offline: this.calculateStats(offlineData)
        };
        
        // Update UI
        this.updateCardStats('total', stats.total);
        this.updateCardStats('ecom', stats.ecom);
        this.updateCardStats('quickcom', stats.quickcom);
        this.updateCardStats('offline', stats.offline);
    }
    
    calculateStats(data) {
        // Count unique invoices (using SALES Invoice NO or DELIVERY Note NO)
        const uniqueInvoices = new Set();
        data.forEach(row => {
            const invoiceNo = row['SALES Invoice NO'] || row['DELIVERY Note NO'];
            if (invoiceNo) uniqueInvoices.add(invoiceNo);
        });
        
        // Calculate total quantity
        let totalQuantity = 0;
        data.forEach(row => {
            const qty = parseFloat(row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || 0);
            if (!isNaN(qty)) totalQuantity += qty;
        });
        
        // Calculate total CBM
        let totalCBM = 0;
        data.forEach(row => {
            const cbm = parseFloat(row['SI Total CBM'] || row['DN Total CBM'] || 0);
            if (!isNaN(cbm)) totalCBM += cbm;
        });
        
        return {
            invoices: uniqueInvoices.size,
            quantity: Math.round(totalQuantity),
            cbm: totalCBM.toFixed(2)
        };
    }
    
    updateCardStats(cardType, stats) {
        const invoicesElement = document.getElementById(`${cardType}Invoices`);
        const quantityElement = document.getElementById(`${cardType}Quantity`);
        const cbmElement = document.getElementById(`${cardType}CBM`);
        
        if (invoicesElement) invoicesElement.textContent = stats.invoices;
        if (quantityElement) quantityElement.textContent = stats.quantity;
        if (cbmElement) cbmElement.textContent = stats.cbm;
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new MISDashboard();
});