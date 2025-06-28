// Global variables
let entries = [];
let lastBackupTime = null;
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ASHOK KUMAR AND SONS - PROFIT TRACKER INITIALIZED ===');
    
    // Load existing entries from localStorage
    loadEntries();
    
    // Setup the application
    setDefaultDate();
    updateSummary();
    renderEntries();
    setupEventListeners();
    
    // Setup automatic backup
    setupAutoBackup();
    
    // Add test function for debugging
    window.addTestData = addTestData;
    window.exportBackup = exportBackup;
    window.importBackup = importBackup;
    
    console.log('Application setup complete. Entries loaded:', entries.length);
    console.log('Data persistence: Enhanced with automatic backups');
});

// Setup automatic backup system
function setupAutoBackup() {
    // Create backup every 5 minutes
    setInterval(() => {
        createBackup();
    }, BACKUP_INTERVAL);
    
    // Create backup on page unload
    window.addEventListener('beforeunload', () => {
        createBackup();
    });
    
    console.log('Automatic backup system initialized');
}

// Create backup of current data
function createBackup() {
    try {
        const backupData = {
            entries: entries,
            timestamp: new Date().toISOString(),
            version: '1.0',
            totalEntries: entries.length
        };
        
        // Save to localStorage as backup
        localStorage.setItem('profitEntries_backup', JSON.stringify(backupData));
        
        // Also save to sessionStorage as additional backup
        sessionStorage.setItem('profitEntries_session', JSON.stringify(backupData));
        
        lastBackupTime = new Date();
        console.log('Backup created successfully at:', lastBackupTime);
        
        // Update backup status in UI
        updateBackupStatus();
        
    } catch (error) {
        console.error('Error creating backup:', error);
    }
}

// Update backup status in UI
function updateBackupStatus() {
    const statusElement = document.getElementById('backupStatus');
    if (statusElement && lastBackupTime) {
        statusElement.textContent = `Last backup: ${formatDateTime(lastBackupTime)}`;
        statusElement.style.color = '#28a745';
    }
}

// Load entries from localStorage with enhanced error handling
function loadEntries() {
    try {
        // Try to load from main storage
        let savedData = localStorage.getItem('profitEntries');
        let backupData = localStorage.getItem('profitEntries_backup');
        
        if (savedData) {
            entries = JSON.parse(savedData);
            console.log('Loaded entries from main storage:', entries.length);
        } else if (backupData) {
            // If main data is missing, try backup
            const backup = JSON.parse(backupData);
            entries = backup.entries || [];
            console.log('Loaded entries from backup storage:', entries.length);
            showMessage('Data restored from backup!', 'success');
        } else {
            entries = [];
            console.log('No saved entries found, starting fresh');
        }
        
        // Validate entries data
        entries = validateEntries(entries);
        
        // Create immediate backup
        createBackup();
        
    } catch (error) {
        console.error('Error loading entries:', error);
        entries = [];
        showMessage('Error loading data, starting fresh', 'error');
    }
}

// Validate entries data structure
function validateEntries(entriesArray) {
    if (!Array.isArray(entriesArray)) {
        console.warn('Entries is not an array, resetting to empty array');
        return [];
    }
    
    const validEntries = [];
    
    entriesArray.forEach((entry, index) => {
        if (entry && typeof entry === 'object') {
            // Ensure all required fields exist
            const validEntry = {
                date: entry.date || new Date().toISOString().split('T')[0],
                revenue: parseFloat(entry.revenue) || 0,
                commission: parseFloat(entry.commission) || 0,
                expenses: parseFloat(entry.expenses) || 0,
                profit: parseFloat(entry.profit) || 0,
                timestamp: entry.timestamp || new Date().toISOString(),
                id: entry.id || Date.now() + index
            };
            
            validEntries.push(validEntry);
        } else {
            console.warn(`Invalid entry at index ${index}, skipping`);
        }
    });
    
    console.log(`Validated ${validEntries.length} entries out of ${entriesArray.length}`);
    return validEntries;
}

// Setup event listeners
function setupEventListeners() {
    const profitForm = document.getElementById('profitForm');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const exportCSVBtn = document.getElementById('exportCSV');
    const exportBackupBtn = document.getElementById('exportBackup');
    const importBackupBtn = document.getElementById('importBackup');
    const expensesInput = document.getElementById('expenses');
    const commissionInput = document.getElementById('commission');
    
    if (profitForm) {
        profitForm.addEventListener('submit', handleEntrySubmit);
        console.log('Profit form listener added');
    }
    
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearHistory);
        console.log('Clear history listener added');
    }
    
    if (exportCSVBtn) {
        exportCSVBtn.addEventListener('click', exportToCSV);
        console.log('Export CSV listener added');
    }
    
    if (exportBackupBtn) {
        exportBackupBtn.addEventListener('click', exportBackup);
        console.log('Export backup listener added');
    }
    
    if (importBackupBtn) {
        importBackupBtn.addEventListener('click', importBackup);
        console.log('Import backup listener added');
    }
    
    // Auto-set commission equal to expenses
    if (expensesInput) {
        expensesInput.addEventListener('input', function() {
            const expensesValue = parseFloat(this.value) || 0;
            if (commissionInput) {
                commissionInput.value = expensesValue.toFixed(2);
                console.log('Commission auto-set to:', expensesValue);
            }
        });
        console.log('Expenses auto-commission listener added');
    }
}

// Handle entry submission
function handleEntrySubmit(e) {
    e.preventDefault();
    console.log('=== ENTRY SUBMITTED ===');
    
    // Get form values
    const entryDate = document.getElementById('entryDate').value;
    const revenue = parseFloat(document.getElementById('revenue').value);
    const commission = parseFloat(document.getElementById('commission').value);
    const expenses = parseFloat(document.getElementById('expenses').value);
    
    console.log('Form values:', { entryDate, revenue, commission, expenses });
    
    // Validate inputs
    if (!entryDate || isNaN(revenue) || isNaN(commission) || isNaN(expenses)) {
        showMessage('Please fill all fields with valid values!', 'error');
        return;
    }
    
    const entry = {
        date: entryDate,
        revenue: revenue,
        commission: commission,
        expenses: expenses,
        profit: commission - expenses,
        timestamp: new Date().toISOString(),
        id: Date.now()
    };
    
    console.log('Entry created:', entry);
    
    // Add to entries array
    entries.unshift(entry);
    console.log('Entry added. Total entries:', entries.length);
    
    // Save to localStorage
    saveEntries();
    
    // Update UI
    updateSummary();
    renderEntries();
    
    // Reset form
    const form = document.getElementById('profitForm');
    if (form) {
        form.reset();
        setDefaultDate();
    }
    
    // Show success message
    showMessage('Entry saved successfully!', 'success');
}

// Update summary cards
function updateSummary() {
    console.log('Updating summary cards...');
    
    const totalRevenue = entries.reduce((sum, e) => sum + e.revenue, 0);
    const totalCommission = entries.reduce((sum, e) => sum + e.commission, 0);
    const totalExpenses = entries.reduce((sum, e) => sum + e.expenses, 0);
    const netProfit = totalCommission - totalExpenses;
    
    console.log('Summary calculations:', { totalRevenue, totalCommission, totalExpenses, netProfit });
    
    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalCommissionEl = document.getElementById('totalCommission');
    const totalExpensesEl = document.getElementById('totalExpenses');
    const netProfitEl = document.getElementById('netProfit');
    
    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
    if (totalCommissionEl) totalCommissionEl.textContent = formatCurrency(totalCommission);
    if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
    if (netProfitEl) netProfitEl.textContent = formatCurrency(netProfit);
    
    console.log('Summary cards updated');
}

// Render entries table
function renderEntries() {
    console.log('=== RENDERING ENTRIES ===');
    console.log('Entries to render:', entries.length);
    
    const tbody = document.getElementById('entriesBody');
    
    if (!tbody) {
        console.error('CRITICAL ERROR: entriesBody element not found!');
        showMessage('Error: Entries table not found!', 'error');
        return;
    }
    
    console.log('Found tbody element, clearing content...');
    tbody.innerHTML = '';
    
    if (entries.length === 0) {
        console.log('No entries to display, showing empty message');
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px; color: #666;">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                    No entries found. Add your first entry above.
                </td>
            </tr>
        `;
        return;
    }
    
    console.log('Rendering', entries.length, 'entries...');
    
    entries.forEach((entry, index) => {
        console.log(`Rendering entry ${index + 1}:`, entry);
        
        const row = document.createElement('tr');
        row.className = 'new-entry';
        
        // Format date and time
        const dateStr = formatDate(entry.date);
        const timeStr = formatTime(entry.timestamp);
        
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${timeStr}</td>
            <td>${formatCurrency(entry.revenue)}</td>
            <td>${formatCurrency(entry.commission)}</td>
            <td>${formatCurrency(entry.expenses)}</td>
            <td style="font-weight: 600; color: ${entry.profit >= 0 ? '#28a745' : '#dc3545'}">
                ${formatCurrency(entry.profit)}
            </td>
            <td>
                <button class="btn-delete" onclick="deleteEntry(${index})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        console.log(`Entry ${index + 1} rendered successfully`);
    });
    
    console.log('=== ENTRIES RENDERED SUCCESSFULLY ===');
}

// Delete entry
function deleteEntry(index) {
    if (confirm('Are you sure you want to delete this entry?')) {
        console.log('Deleting entry at index:', index);
        entries.splice(index, 1);
        saveEntries();
        updateSummary();
        renderEntries();
        showMessage('Entry deleted successfully!', 'success');
    }
}

// Clear all history
function clearHistory() {
    if (confirm('Are you sure you want to clear all entries? This action cannot be undone.')) {
        console.log('Clearing all entries');
        entries = [];
        saveEntries();
        updateSummary();
        renderEntries();
        showMessage('All entries cleared!', 'success');
    }
}

// Make functions globally accessible
window.deleteEntry = deleteEntry;

// Save entries to localStorage with enhanced persistence
function saveEntries() {
    try {
        // Save to main storage
        localStorage.setItem('profitEntries', JSON.stringify(entries));
        
        // Create immediate backup
        createBackup();
        
        // Also save to sessionStorage as additional backup
        sessionStorage.setItem('profitEntries_current', JSON.stringify(entries));
        
        console.log('Entries saved successfully to multiple locations');
        console.log('Total entries saved:', entries.length);
        
        // Update backup status
        updateBackupStatus();
        
    } catch (error) {
        console.error('Error saving entries:', error);
        showMessage('Error saving data! Trying alternative storage...', 'error');
        
        // Try alternative storage methods
        try {
            sessionStorage.setItem('profitEntries_emergency', JSON.stringify(entries));
            console.log('Emergency backup created in sessionStorage');
        } catch (emergencyError) {
            console.error('Emergency backup also failed:', emergencyError);
            showMessage('Critical error: Data may not be saved!', 'error');
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date and time (for backward compatibility)
function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Show message
function showMessage(message, type) {
    console.log(`Showing message: ${message} (${type})`);
    
    // Remove existing messages
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of main content
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        mainContent.insertBefore(messageDiv, mainContent.firstChild);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 3000);
}

// Export data to CSV
function exportToCSV() {
    console.log('=== EXPORTING TO CSV ===');
    console.log('Entries to export:', entries.length);
    
    if (entries.length === 0) {
        showMessage('No data to export!', 'error');
        console.log('No entries to export');
        return;
    }
    
    // Define headers
    const headers = [
        'Date',
        'Time',
        'Revenue (₹)',
        'Commission (₹)',
        'Expenses (₹)',
        'Profit (₹)'
    ];
    
    // Create CSV content
    const csvRows = [];
    
    // Add headers
    csvRows.push(headers.join(','));
    
    // Add entry data
    entries.forEach((entry, index) => {
        console.log(`Exporting entry ${index + 1}:`, entry);
        
        // Format date and time
        const dateStr = formatDate(entry.date);
        const timeStr = formatTime(entry.timestamp);
        
        const row = [
            dateStr,
            timeStr,
            entry.revenue.toFixed(2),
            entry.commission.toFixed(2),
            entry.expenses.toFixed(2),
            entry.profit.toFixed(2)
        ];
        
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    console.log('CSV content created, length:', csvContent.length);
    console.log('CSV content preview:', csvContent.substring(0, 200) + '...');
    
    try {
        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ashok_kumar_and_sons_profit_${new Date().toISOString().split('T')[0]}.csv`;
        
        // Trigger download
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        window.URL.revokeObjectURL(url);
        
        console.log('CSV file downloaded successfully');
        showMessage(`Data exported to CSV successfully! (${entries.length} entries)`, 'success');
        
    } catch (error) {
        console.error('Error exporting CSV:', error);
        showMessage('Error exporting CSV file!', 'error');
    }
}

// Test function to add sample data
function addTestData() {
    console.log('=== ADDING TEST DATA ===');
    
    const testEntries = [
        {
            date: '2023-12-15',
            revenue: 10000,
            commission: 500,
            expenses: 2000,
            profit: 500 - 2000,
            timestamp: new Date('2023-12-15T10:30:00').toISOString(),
            id: Date.now() + 1
        },
        {
            date: '2023-12-15',
            revenue: 8000,
            commission: 400,
            expenses: 1500,
            profit: 400 - 1500,
            timestamp: new Date('2023-12-15T14:45:00').toISOString(),
            id: Date.now() + 2
        },
        {
            date: '2023-12-16',
            revenue: 12000,
            commission: 600,
            expenses: 3000,
            profit: 600 - 3000,
            timestamp: new Date('2023-12-16T09:15:00').toISOString(),
            id: Date.now() + 3
        }
    ];
    
    testEntries.forEach((entry, index) => {
        entries.unshift(entry);
        console.log(`Test entry ${index + 1} added:`, entry);
    });
    
    saveEntries();
    updateSummary();
    renderEntries();
    
    console.log('Test data added. Total entries:', entries.length);
    showMessage(`${testEntries.length} test entries added successfully!`, 'success');
}

// Set default date to today
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('entryDate');
    if (dateInput) {
        dateInput.value = today;
        console.log('Default date set:', today);
    } else {
        console.error('Date input not found!');
    }
}

// Export backup data to file
function exportBackup() {
    console.log('=== EXPORTING BACKUP ===');
    
    if (entries.length === 0) {
        showMessage('No data to backup!', 'error');
        return;
    }
    
    const backupData = {
        entries: entries,
        timestamp: new Date().toISOString(),
        version: '1.0',
        totalEntries: entries.length,
        company: 'Ashok Kumar and Sons',
        exportDate: new Date().toLocaleString('en-IN')
    };
    
    try {
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { 
            type: 'application/json;charset=utf-8;' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ashok_kumar_and_sons_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        console.log('Backup exported successfully');
        showMessage(`Backup exported successfully! (${entries.length} entries)`, 'success');
        
    } catch (error) {
        console.error('Error exporting backup:', error);
        showMessage('Error exporting backup!', 'error');
    }
}

// Import backup data from file
function importBackup() {
    console.log('=== IMPORTING BACKUP ===');
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const backupData = JSON.parse(e.target.result);
                
                if (backupData.entries && Array.isArray(backupData.entries)) {
                    // Validate imported data
                    const validEntries = validateEntries(backupData.entries);
                    
                    if (validEntries.length > 0) {
                        // Ask user if they want to replace or merge
                        const action = confirm(
                            `Found ${validEntries.length} entries in backup.\n\n` +
                            'Click OK to replace all current data.\n' +
                            'Click Cancel to merge with existing data.'
                        );
                        
                        if (action) {
                            // Replace all data
                            entries = validEntries;
                            showMessage(`Imported ${validEntries.length} entries (replaced existing data)`, 'success');
                        } else {
                            // Merge data
                            const existingIds = new Set(entries.map(e => e.id));
                            const newEntries = validEntries.filter(e => !existingIds.has(e.id));
                            entries = [...newEntries, ...entries];
                            showMessage(`Imported ${newEntries.length} new entries (merged with existing data)`, 'success');
                        }
                        
                        saveEntries();
                        updateSummary();
                        renderEntries();
                        
                        console.log('Backup imported successfully');
                        
                    } else {
                        showMessage('No valid entries found in backup file!', 'error');
                    }
                } else {
                    showMessage('Invalid backup file format!', 'error');
                }
                
            } catch (error) {
                console.error('Error parsing backup file:', error);
                showMessage('Error reading backup file!', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
} 