class MISDashboard {
    constructor() {
        this.processedData = null;
        this.currentView = 'date'; // 'date' or 'month'
        
        // Performance optimizations
        this.statsCache = new Map();
        this.lastDataHash = null;
        this.compiledRegex = {
            ecom: /amazon|flipkart/i,
            quickcom: /bigbasket|blinkit|zepto|swiggy/i
        };
        this.excludedPlatforms = ['flipkart', 'amazon', 'bigbasket', 'blinkit', 'zepto', 'swiggy'];
        
        this.initializeUI();
        this.initializeEventListeners();
    }
    
    initializeUI() {
        const dashboardDiv = document.getElementById('dashboardSection');
        if (!dashboardDiv) {
            console.error("Dashboard section not found");
            return;
        }
        
        // Create the modern dashboard layout
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
            
            <div class="dashboard-grid">
                <!-- Total Card -->
                <div class="dashboard-card total-card">
                    <div class="card-header">
                        <h3>📊 Total</h3>
                        <div class="card-icon">🎯</div>
                    </div>
                    <div class="card-body">
                        <div class="metric">
                            <div class="metric-label">Total Invoices</div>
                            <div class="metric-value" id="totalInvoices">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Invoice Quantity</div>
                            <div class="metric-value" id="totalQuantity">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Total CBM</div>
                            <div class="metric-value" id="totalCBM">0.00</div>
                        </div>
                        <div class="metric" data-metric="lr-pending">
                            <div class="metric-label">LR Pending</div>
                            <div class="metric-value" id="totalLRPending">0</div>
                        </div>
                    </div>
                </div>
                
                <!-- E-Commerce Card -->
                <div class="dashboard-card ecom-card">
                    <div class="card-header">
                        <h3>🛒 E-Commerce</h3>
                        <div class="card-icon">📱</div>
                    </div>
                    <div class="card-body">
                        <div class="metric">
                            <div class="metric-label">Total Invoices</div>
                            <div class="metric-value" id="ecomInvoices">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Invoice Quantity</div>
                            <div class="metric-value" id="ecomQuantity">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Total CBM</div>
                            <div class="metric-value" id="ecomCBM">0.00</div>
                        </div>
                        <div class="metric" data-metric="lr-pending">
                            <div class="metric-label">LR Pending</div>
                            <div class="metric-value" id="ecomLRPending">0</div>
                        </div>
                    </div>
                </div>
                
                <!-- Quick-Commerce Card -->
                <div class="dashboard-card quickcom-card">
                    <div class="card-header">
                        <h3>⚡ Quick-Commerce</h3>
                        <div class="card-icon">🚀</div>
                    </div>
                    <div class="card-body">
                        <div class="metric">
                            <div class="metric-label">Total Invoices</div>
                            <div class="metric-value" id="quickcomInvoices">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Invoice Quantity</div>
                            <div class="metric-value" id="quickcomQuantity">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Total CBM</div>
                            <div class="metric-value" id="quickcomCBM">0.00</div>
                        </div>
                        <div class="metric" data-metric="lr-pending">
                            <div class="metric-label">LR Pending</div>
                            <div class="metric-value" id="quickcomLRPending">0</div>
                        </div>
                    </div>
                </div>
                
                <!-- Offline Card -->
                <div class="dashboard-card offline-card">
                    <div class="card-header">
                        <h3>🏪 Offline</h3>
                        <div class="card-icon">🏬</div>
                    </div>
                    <div class="card-body">
                        <div class="metric">
                            <div class="metric-label">Total Invoices</div>
                            <div class="metric-value" id="offlineInvoices">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Invoice Quantity</div>
                            <div class="metric-value" id="offlineQuantity">0</div>
                        </div>
                        <div class="metric">
                            <div class="metric-label">Total CBM</div>
                            <div class="metric-value" id="offlineCBM">0.00</div>
                        </div>
                        <div class="metric" data-metric="lr-pending">
                            <div class="metric-label">LR Pending</div>
                            <div class="metric-value" id="offlineLRPending">0</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="dashboardNoData" class="no-data-message" style="display: none;">
                <div class="no-data-content">
                    <div class="no-data-icon">📄</div>
                    <h3>No Data Available</h3>
                    <p>Please upload an Excel file to view dashboard metrics.</p>
                </div>
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
        if (!filteredData || !Array.isArray(filteredData)) return;
        
        // Check cache first
        const dataHash = this.hashData(filteredData);
        if (this.lastDataHash === dataHash && this.statsCache.has('dashboard_stats')) {
            const cachedStats = this.statsCache.get('dashboard_stats');
            this.updateAllCardStats(cachedStats);
            return;
        }
        
        // Single-pass categorization and calculation for maximum performance
        const stats = this.calculateStatsOptimized(filteredData);
        
        // Cache results
        this.statsCache.set('dashboard_stats', stats);
        this.lastDataHash = dataHash;
        
        // Update UI
        this.updateAllCardStats(stats);
    }
    
    // Optimized single-pass calculation
    calculateStatsOptimized(data) {
        const stats = {
            total: { invoices: 0, quantity: 0, cbm: 0, lrPending: 0 },
            ecom: { invoices: 0, quantity: 0, cbm: 0, lrPending: 0 },
            quickcom: { invoices: 0, quantity: 0, cbm: 0, lrPending: 0 },
            offline: { invoices: 0, quantity: 0, cbm: 0, lrPending: 0 }
        };
        
        // Track unique invoices for each category
        const uniqueInvoices = {
            total: new Set(),
            ecom: new Set(),
            quickcom: new Set(),
            offline: new Set()
        };
        
        // Single pass through data
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const customerGroup = (row['Customer Group'] || '').toLowerCase();
            
            // Determine category using pre-compiled regex
            let category = 'offline';
            if (this.compiledRegex.ecom.test(customerGroup)) {
                category = 'ecom';
            } else if (this.compiledRegex.quickcom.test(customerGroup)) {
                category = 'quickcom';
            }
            
            // Calculate values once
            const invoiceNo = row['SALES Invoice NO'] || row['DELIVERY Note NO'];
            const quantity = this.getQuantity(row);
            const cbm = parseFloat(row['SI Total CBM'] || row['DN Total CBM'] || 0);
            const lrNo = row['SHIPMENT Awb NUMBER'] || '';
            const hasLR = lrNo && lrNo.toString().trim() !== '';
            
            // Update stats for total and specific category
            [stats.total, stats[category]].forEach((statObj, index) => {
                const invoiceSet = index === 0 ? uniqueInvoices.total : uniqueInvoices[category];
                
                if (invoiceNo && invoiceNo.toString().trim() !== '') {
                    invoiceSet.add(invoiceNo.toString().trim());
                }
                
                statObj.quantity += quantity;
                if (!isNaN(cbm) && cbm >= 0) {
                    statObj.cbm += cbm;
                }
                if (!hasLR) {
                    statObj.lrPending++;
                }
            });
        }
        
        // Set invoice counts from unique sets
        stats.total.invoices = uniqueInvoices.total.size;
        stats.ecom.invoices = uniqueInvoices.ecom.size;
        stats.quickcom.invoices = uniqueInvoices.quickcom.size;
        stats.offline.invoices = uniqueInvoices.offline.size;
        
        // Format CBM values
        Object.values(stats).forEach(stat => {
            stat.cbm = stat.cbm.toFixed(2);
        });
        
        return stats;
    }
    
    // Simple hash function for data change detection
    hashData(data) {
        if (!Array.isArray(data) || data.length === 0) return 'empty';
        
        // Create a simple hash based on data length and first/last rows
        const firstRow = data[0];
        const lastRow = data[data.length - 1];
        const hash = `${data.length}_${JSON.stringify(firstRow)}_${JSON.stringify(lastRow)}`;
        
        // Simple string hash
        let hashValue = 0;
        for (let i = 0; i < hash.length; i++) {
            const char = hash.charCodeAt(i);
            hashValue = ((hashValue << 5) - hashValue) + char;
            hashValue = hashValue & hashValue; // Convert to 32-bit integer
        }
        
        return hashValue.toString();
    }
    
    // Helper method to update all card stats
    updateAllCardStats(stats) {
        this.updateCardStats('total', stats.total);
        this.updateCardStats('ecom', stats.ecom);
        this.updateCardStats('quickcom', stats.quickcom);
        this.updateCardStats('offline', stats.offline);
    }

    // Sort data by Invoice Date only
    sortDataByDate(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return data;
        }

        // Get the selected sort order from the main page
        const sortOrderSelect = document.getElementById('sortOrder');
        const sortOrder = sortOrderSelect ? sortOrderSelect.value : 'newest';

        return data.sort((a, b) => {
            // Get Invoice Date from both records (only SALES Invoice DATE)
            const dateA = this.parseDate(a['SALES Invoice DATE'] || '');
            const dateB = this.parseDate(b['SALES Invoice DATE'] || '');
            
            // If dates are equal, maintain original order
            if (dateA.getTime() === dateB.getTime()) return 0;
            
            // Sort based on selected order
            if (sortOrder === 'oldest') {
                return dateA.getTime() - dateB.getTime(); // Oldest first
            } else {
                return dateB.getTime() - dateA.getTime(); // Newest first (default)
            }
        });
    }

    // Parse date string and return Date object
    parseDate(dateStr) {
        if (!dateStr || dateStr === '') {
            return new Date(0); // Return epoch for empty dates (will sort to end)
        }

        try {
            // Handle various date formats
            let date;
            
            // If it's already a Date object
            if (dateStr instanceof Date) {
                date = dateStr;
            }
            // If it's a string, try to parse it
            else if (typeof dateStr === 'string') {
                // Try different date formats
                const formats = [
                    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
                    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
                    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
                    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY
                    /^\d{1,2}-\d{1,2}-\d{4}$/ // M-D-YYYY
                ];
                
                // Check if it matches any known format
                const isKnownFormat = formats.some(format => format.test(dateStr.trim()));
                
                if (isKnownFormat) {
                    date = new Date(dateStr);
                } else {
                    // Try to parse as-is
                    date = new Date(dateStr);
                }
            } else {
                date = new Date(dateStr);
            }
            
            // Check if the date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date format in dashboard:', dateStr);
                return new Date(0); // Return epoch for invalid dates
            }
            
            return date;
        } catch (error) {
            console.error('Error parsing date in dashboard:', dateStr, error);
            return new Date(0); // Return epoch for error cases
        }
    }
    
    calculateStats(data) {
        if (!Array.isArray(data) || data.length === 0) {
            return {
                invoices: 0,
                quantity: 0,
                cbm: '0.00',
                lrPending: 0
            };
        }

        try {
            // Count unique invoices (using SALES Invoice NO or DELIVERY Note NO)
            const uniqueInvoices = new Set();
            data.forEach(row => {
                if (row && typeof row === 'object') {
                    const invoiceNo = row['SALES Invoice NO'] || row['DELIVERY Note NO'];
                    if (invoiceNo && invoiceNo.toString().trim() !== '') {
                        uniqueInvoices.add(invoiceNo.toString().trim());
                    }
                }
            });
            
            // Calculate total quantity using the same logic as script.js (with fallback)
            let totalQuantity = 0;
            data.forEach(row => {
                if (row && typeof row === 'object') {
                    const qty = this.getQuantity(row);
                    totalQuantity += qty;
                }
            });
            
            // Calculate total CBM (ensuring non-negative values)
            let totalCBM = 0;
            data.forEach(row => {
                if (row && typeof row === 'object') {
                    const cbm = parseFloat(row['SI Total CBM'] || row['DN Total CBM'] || 0);
                    if (!isNaN(cbm) && cbm >= 0) {
                        totalCBM += cbm;
                    }
                }
            });
            
            // Calculate LR Pending - records without LR Number
            let lrPending = 0;
            data.forEach(row => {
                if (row && typeof row === 'object') {
                    const lrNo = row['SHIPMENT Awb NUMBER'] || '';
                    // Count as pending if LR Number is empty, null, or just whitespace
                    if (!lrNo || lrNo.toString().trim() === '') {
                        lrPending++;
                    }
                }
            });
            
            return {
                invoices: uniqueInvoices.size,
                quantity: Math.round(totalQuantity),
                cbm: totalCBM.toFixed(2),
                lrPending: lrPending
            };
        } catch (error) {
            console.error('Error calculating stats:', error);
            return {
                invoices: 0,
                quantity: 0,
                cbm: '0.00',
                lrPending: 0
            };
        }
    }
    
    // Get the quantity as a proper number (ensuring non-negative values)
    // This method matches the logic from script.js to ensure consistency
    // Optimized quantity calculation with caching
    getQuantity(row) {
        if (!row || typeof row !== 'object') return 0;
        
        // Check cache first
        if (row._cachedQuantity !== undefined) {
            return row._cachedQuantity;
        }
        
        try {
            // Try different quantity fields in order of preference
            let qty = row['SALES Invoice QTY'] || row['DELIVERY Note QTY'] || 0;
            
            if (qty === null || qty === undefined) {
                row._cachedQuantity = 0;
                return 0;
            }
            
            // Fast numeric conversion
            const numQty = +qty; // Faster than parseFloat for most cases
            
            // Cache the result
            row._cachedQuantity = isNaN(numQty) ? 0 : Math.max(0, numQty);
            return row._cachedQuantity;
            
        } catch (error) {
            row._cachedQuantity = 0;
            return 0;
        }
    }
    
    updateCardStats(cardType, stats) {
        const invoicesElement = document.getElementById(`${cardType}Invoices`);
        const quantityElement = document.getElementById(`${cardType}Quantity`);
        const cbmElement = document.getElementById(`${cardType}CBM`);
        const lrPendingElement = document.getElementById(`${cardType}LRPending`);
        
        if (invoicesElement) {
            invoicesElement.textContent = stats.invoices.toLocaleString();
        }
        if (quantityElement) {
            quantityElement.textContent = stats.quantity.toLocaleString();
        }
        if (cbmElement) {
            cbmElement.textContent = parseFloat(stats.cbm).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        if (lrPendingElement) {
            lrPendingElement.textContent = stats.lrPending.toLocaleString();
        }
    }
}

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication before initializing dashboard
    if (window.auth && window.auth.isUserAuthenticated()) {
        window.dashboard = new MISDashboard();
    }
});