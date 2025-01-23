// Global variables
let currentItems = [];
let changedItems = new Set();
let currentPage = 1;
const itemsPerPage = 10;

// Load menu items from the server
async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu-items');
        if (!response.ok) throw new Error('Failed to fetch menu items');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to load menu items');
        
        // Get all items from different categories
        const allItems = [
            ...(result.data.limited || []),
            ...(result.data.regular || []),
            ...(result.data.other || [])
        ];
        
        currentItems = allItems;
        renderMenuItems(allItems);
        
        // Show summary of all items
        const summary = [
            `總共: ${allItems.length} 個菜單項目`,
            `限時供應: ${result.data.limited.length} 個 (未提供但在有效期內)`,
            `常規供應: ${result.data.regular.length} 個 (總是提供)`,
            `其他項目: ${result.data.other.length} 個 (正在提供)`
        ];
        
        console.log('Menu items loaded:', summary); // Debug log
    } catch (error) {
        console.error('Error loading menu items:', error);
        showAlert('danger', '載入菜單項目失敗：' + error.message);
    }
}

// Load serving items
async function loadServingItems() {
    console.log('Loading serving items...'); // Debug log
    try {
        const response = await fetch('/api/menu-items');
        const result = await response.json();
        
        if (result.success) {
            const now = new Date();
            
            // Get all items that are currently being served:
            // 1. Always available items (regular)
            // 2. Limited time items within date range
            // 3. Items marked as currently provided
            const servingItems = [
                ...result.data.regular,  // Always available items
                ...result.data.limited,  // Limited time items in valid range
                ...result.data.other     // Currently provided items
            ];
            
            if (servingItems.length === 0) {
                showAlert('danger', '沒有找到正在提供的菜單項目');
                return;
            }
            
            currentItems = servingItems;
            renderMenuItems(servingItems);
            
            // Show summary by category
            const summary = [
                `總共: ${servingItems.length} 個正在提供的菜單項目`,
                `常規供應: ${result.data.regular.length} 個`,
                `限時供應: ${result.data.limited.length} 個`,
                `其他項目: ${result.data.other.length} 個`
            ];
            
            showAlert('success', summary.join('\n'));
        } else {
            throw new Error(result.error || '載入失敗');
        }
    } catch (error) {
        console.error('Error loading serving items:', error);
        showAlert('danger', '載入正在提供菜單項目失敗：' + error.message);
    }
}

// Load un-served items
async function loadUnservedItems() {
    console.log('Loading unserved items...'); // Debug log
    try {
        const response = await fetch('/api/menu-items');
        const result = await response.json();
        
        if (result.success) {
            const now = new Date();
            console.log('Current time:', now.toISOString());
            
            // Get all items from different categories
            const allItems = [
                ...(result.data.limited || []),
                ...(result.data.regular || []),
                ...(result.data.other || [])
            ];
            
            console.log('All items loaded:', allItems.length);
            console.log('Limited items:', result.data.limited.length);
            console.log('Regular items:', result.data.regular.length);
            console.log('Other items:', result.data.other.length);
            
            // Filter for unserved items:
            // 1. Not always available
            // 2. Not currently provided
            // 3. Either has no dates OR is outside valid date range
            const unservedItems = allItems.filter(item => {
                console.log('\nChecking item:', item.displayTitle);
                console.log('alwaysItem:', item.alwaysItem);
                console.log('nowProvid:', item.nowProvid);
                console.log('startDate:', item.startDate);
                console.log('endDate:', item.endDate);
                
                // Skip if always available or currently provided
                if (item.alwaysItem || item.nowProvid) {
                    console.log('Skipping - always available or currently provided');
                    return false;
                }
                
                // If no dates are set, it's unserved
                if (!item.startDate || !item.endDate) {
                    console.log('Including - no dates set');
                    return true;
                }
                
                // Check if current date is outside the valid range
                const startDate = new Date(item.startDate);
                const endDate = new Date(item.endDate);
                const isBeforeStart = now < startDate;
                const isAfterEnd = now > endDate;
                const isOutsideRange = isBeforeStart || isAfterEnd;
                
                console.log('Date comparison:');
                console.log('- Start date:', startDate.toISOString());
                console.log('- End date:', endDate.toISOString());
                console.log('- Before start:', isBeforeStart);
                console.log('- After end:', isAfterEnd);
                console.log('- Outside range:', isOutsideRange);
                
                return isOutsideRange;
            });
            
            console.log('\nUnserved items found:', unservedItems.length);
            unservedItems.forEach(item => {
                console.log('- ' + item.displayTitle);
            });
            
            currentItems = unservedItems;
            if (unservedItems.length === 0) {
                showAlert('danger', '沒有找到未提供的菜單項目');
                return;
            }
            
            renderMenuItems(unservedItems);
            
            // Show summary
            const summary = [
                `總共: ${unservedItems.length} 個未提供的菜單項目`,
                `過期限時供應: ${unservedItems.filter(item => item.startDate && item.endDate).length} 個`,
                `未設定日期: ${unservedItems.filter(item => !item.startDate || !item.endDate).length} 個`
            ];
            
            showAlert('success', summary.join('\n'));
        } else {
            throw new Error(result.error || '載入失敗');
        }
    } catch (error) {
        console.error('Error loading un-served items:', error);
        showAlert('danger', '載入未提供菜單項目失敗：' + error.message);
    }
}

// Update page info
function updatePageInfo() {
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, currentItems.length);
    const total = currentItems.length;
    
    // Update individual spans
    const startSpan = document.getElementById('startRange');
    const endSpan = document.getElementById('endRange');
    const totalSpan = document.getElementById('totalItems');
    
    if (startSpan) startSpan.textContent = total > 0 ? start + 1 : 0;
    if (endSpan) endSpan.textContent = end;
    if (totalSpan) totalSpan.textContent = total;
}

// Add pagination button
function addPaginationButton(text, page, isActive = false, isDisabled = false) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    const li = document.createElement('li');
    li.className = `page-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`;
    
    const button = document.createElement('button');
    button.className = 'page-link';
    button.textContent = text;
    if (!isDisabled) {
        button.onclick = () => changePage(page);
    }
    
    li.appendChild(button);
    pagination.appendChild(li);
}

// Update pagination
function updatePagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    
    pagination.innerHTML = '';
    
    const totalPages = Math.ceil(currentItems.length / itemsPerPage);
    if (totalPages <= 1) return; // Don't show pagination if only one page
    
    // Previous button
    addPaginationButton('Previous', currentPage - 1, false, currentPage === 1);
    
    // Page buttons
    for (let i = 1; i <= totalPages; i++) {
        addPaginationButton(i.toString(), i, i === currentPage);
    }
    
    // Next button
    addPaginationButton('Next', currentPage + 1, false, currentPage >= totalPages);
}

// Change page
function changePage(newPage) {
    currentPage = newPage;
    renderMenuItems(currentItems);
}

// Render menu items to the table
function renderMenuItems(items) {
    const tbody = document.getElementById('menuItemsList');
    if (!tbody) {
        console.error('Could not find menuItemsList element');
        return;
    }
    
    // Update current items and calculate page items
    currentItems = items || [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, currentItems.length);
    const pageItems = currentItems.slice(start, end);
    
    // Reset to first page if current page is invalid
    if (currentItems.length > 0 && pageItems.length === 0) {
        currentPage = 1;
        return renderMenuItems(currentItems);
    }
    
    tbody.innerHTML = '';
    
    pageItems.forEach(item => {
        const row = document.createElement('tr');
        row.dataset.id = item._id;
        
        // Determine if date fields should be disabled
        const datesDisabled = item.alwaysItem || item.nowProvid;
        
        row.innerHTML = `
            <td class="text-center">
                ${item.foodImage ? 
                    `<img src="${item.foodImage}" class="img-preview" alt="${item.displayTitle}">` : 
                    'No Image'}
            </td>
            <td>${item.displayTitle}</td>
            <td>${item.smallDescription || ''}</td>
            <td class="text-center">
                <div class="form-check d-flex justify-content-center">
                    <input type="checkbox" class="form-check-input" 
                           ${item.alwaysItem ? 'checked' : ''} 
                           onchange="updateItem('${item._id}', 'alwaysItem', this.checked)">
                </div>
            </td>
            <td class="text-center">
                <div class="form-check d-flex justify-content-center">
                    <input type="checkbox" class="form-check-input" 
                           ${item.nowProvid ? 'checked' : ''} 
                           onchange="updateItem('${item._id}', 'nowProvid', this.checked)">
                </div>
            </td>
            <td class="text-center">
                <input type="date" class="form-control form-control-sm" 
                       data-field="startDate"
                       value="${item.startDate ? item.startDate.split('T')[0] : ''}"
                       onchange="updateItem('${item._id}', 'startDate', this.value)"
                       ${datesDisabled ? 'disabled' : ''}>
            </td>
            <td class="text-center">
                <input type="date" class="form-control form-control-sm" 
                       data-field="endDate"
                       value="${item.endDate ? item.endDate.split('T')[0] : ''}"
                       onchange="updateItem('${item._id}', 'endDate', this.value)"
                       ${datesDisabled ? 'disabled' : ''}>
            </td>
            <td class="text-center">
                <div class="btn-group">
                    <button class="btn btn-primary me-2" onclick="editItem('${item._id}')">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteItem('${item._id}')">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Update pagination
    updatePageInfo();
    updatePagination();
}

// Update item when a field changes
function updateItem(id, field, value) {
    const item = currentItems.find(i => i._id === id);
    if (item) {
        item[field] = value;
        
        // If Always Item or Now Providing is checked, clear dates
        if ((field === 'alwaysItem' || field === 'nowProvid') && value === true) {
            item.startDate = null;
            item.endDate = null;
            
            // Update the date inputs in the UI
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                const startDateInput = row.querySelector('input[type="date"][data-field="startDate"]');
                const endDateInput = row.querySelector('input[type="date"][data-field="endDate"]');
                if (startDateInput) {
                    startDateInput.value = '';
                    startDateInput.disabled = true;
                }
                if (endDateInput) {
                    endDateInput.value = '';
                    endDateInput.disabled = true;
                }
            }
        }
        
        changedItems.add(id);
        document.getElementById('saveAllBtn').disabled = false;
    }
}

// Save all changes
async function saveAllChanges() {
    try {
        const promises = [];
        for (const [id, changes] of changedItems.entries()) {
            promises.push(updateItemInDatabase(id, changes));
        }
        
        await Promise.all(promises);
        changedItems.clear();
        document.getElementById('saveAllBtn').disabled = true;
        showAlert('success', 'All changes saved successfully!');
    } catch (error) {
        console.error('Error saving changes:', error);
        showAlert('danger', 'Failed to save changes: ' + error.message);
    }
}

// Delete an item
async function deleteItem(id) {
    if (!confirm('確定要刪除這個菜單項目嗎？')) return;
    
    try {
        const response = await fetch(`/api/menu-items/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete item');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.error || 'Failed to delete item');
        
        currentItems = currentItems.filter(item => item._id !== id);
        renderMenuItems(currentItems);
        showAlert('success', '菜單項目已刪除');
    } catch (error) {
        console.error('Error deleting item:', error);
        showAlert('danger', '刪除菜單項目失敗：' + error.message);
    }
}

// Prompt before reloading
function promptReload() {
    if (changedItems.size > 0) {
        if (!confirm('有未保存的更改。確定要重新載入嗎？')) return;
    }
    loadMenuItems();
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded'); // Debug log
    
    // Initialize Bootstrap components
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Add event listeners
    document.getElementById('loadServingBtn')?.addEventListener('click', loadServingItems);
    document.getElementById('loadUnserveBtn')?.addEventListener('click', loadUnservedItems);
    document.getElementById('editFoodImage')?.addEventListener('change', handleImagePreview);
    
    // Load initial items
    loadMenuItems();
});

// Handle image preview
function handleImagePreview(e) {
    const preview = document.getElementById('editImagePreview');
    if (!preview) return;

    if (e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(e.target.files[0]);
    } else {
        preview.style.display = 'none';
    }
}

// Show edit modal
function showEditModal(item = null) {
    try {
        const editForm = document.getElementById('editForm');
        const editTitle = document.getElementById('editModalLabel');
        const editItemId = document.getElementById('editItemId');
        const editDisplayTitle = document.getElementById('editDisplayTitle');
        const editSmallDescription = document.getElementById('editSmallDescription');
        const editCurrentImage = document.getElementById('editCurrentImage');
        const editImagePreview = document.getElementById('editImagePreview');
        const editAlwaysItem = document.getElementById('editAlwaysItem');
        const editNowProvid = document.getElementById('editNowProvid');
        const editStartDate = document.getElementById('editStartDate');
        const editEndDate = document.getElementById('editEndDate');
        const editDateFields = document.getElementById('editDateFields');

        if (!editForm || !editTitle) {
            throw new Error('Required form elements not found');
        }

        // Clear previous image preview
        if (editImagePreview) editImagePreview.style.display = 'none';
        
        // Set modal title and populate fields
        editTitle.textContent = item ? 'Edit Menu Item' : 'Add New Menu Item';
        
        if (item) {
            // Editing existing item
            editItemId.value = item._id;
            editDisplayTitle.value = item.displayTitle || '';
            editSmallDescription.value = item.smallDescription || '';
            editAlwaysItem.checked = item.alwaysItem || false;
            editNowProvid.checked = item.nowProvid || false;
            
            // Set dates if they exist
            if (editStartDate) editStartDate.value = item.startDate ? item.startDate.split('T')[0] : '';
            if (editEndDate) editEndDate.value = item.endDate ? item.endDate.split('T')[0] : '';
            
            // Show current image if exists
            if (item.foodImage && editCurrentImage) {
                editCurrentImage.src = item.foodImage;
                editCurrentImage.style.display = 'block';
            } else if (editCurrentImage) {
                editCurrentImage.style.display = 'none';
            }
        } else {
            // Adding new item
            editForm.reset();
            if (editCurrentImage) editCurrentImage.style.display = 'none';
            if (editItemId) editItemId.value = '';
        }

        // Update date fields visibility
        updateDateFieldsVisibility();

        // Add event listeners for checkboxes
        editAlwaysItem?.addEventListener('change', updateDateFieldsVisibility);
        editNowProvid?.addEventListener('change', updateDateFieldsVisibility);

        // Show modal
        const editModal = document.getElementById('editModal');
        if (!editModal) throw new Error('Edit modal not found');
        
        const modal = new bootstrap.Modal(editModal);
        modal.show();
    } catch (error) {
        console.error('Error showing edit modal:', error);
        showAlert('danger', '編輯表單載入失敗：' + error.message);
    }
}

// Update date fields visibility based on checkbox status
function updateDateFieldsVisibility() {
    const editAlwaysItem = document.getElementById('editAlwaysItem');
    const editNowProvid = document.getElementById('editNowProvid');
    const editStartDate = document.getElementById('editStartDate');
    const editEndDate = document.getElementById('editEndDate');
    const editDateFields = document.getElementById('editDateFields');

    if (!editDateFields || !editStartDate || !editEndDate) return;

    const shouldDisableDates = editAlwaysItem?.checked || editNowProvid?.checked;

    if (shouldDisableDates) {
        editDateFields.style.opacity = '0.5';
        editStartDate.value = '';
        editEndDate.value = '';
        editStartDate.disabled = true;
        editEndDate.disabled = true;
    } else {
        editDateFields.style.opacity = '1';
        editStartDate.disabled = false;
        editEndDate.disabled = false;
    }
}

// Save menu item
async function saveMenuItem() {
    try {
        const editForm = document.getElementById('editForm');
        if (!editForm) throw new Error('Edit form not found');

        // Get form data
        const itemId = document.getElementById('editItemId').value;
        const displayTitle = document.getElementById('editDisplayTitle').value;
        const smallDescription = document.getElementById('editSmallDescription').value;
        const alwaysItem = document.getElementById('editAlwaysItem').checked;
        const nowProvid = document.getElementById('editNowProvid').checked;
        const foodImage = document.getElementById('editFoodImage').files[0];
        const startDate = document.getElementById('editStartDate').value;
        const endDate = document.getElementById('editEndDate').value;

        // Validate required fields
        if (!displayTitle) throw new Error('標題是必填的');
        if (!smallDescription) throw new Error('描述是必填的');

        // Validate dates if not always available or currently provided
        if (!alwaysItem && !nowProvid) {
            if (startDate && endDate) {
                const start = new Date(startDate);
                const end = new Date(endDate);
                if (end < start) {
                    throw new Error('結束日期必須在開始日期之後');
                }
            }
        }

        // Create form data for API call
        const formData = new FormData();
        formData.append('displayTitle', displayTitle);
        formData.append('smallDescription', smallDescription);
        formData.append('alwaysItem', String(alwaysItem)); // Convert boolean to string
        formData.append('nowProvid', String(nowProvid)); // Convert boolean to string
        if (foodImage) {
            formData.append('foodImage', foodImage);
        }
        
        // Only append dates if not always available or currently provided
        if (!alwaysItem && !nowProvid) {
            if (startDate) formData.append('startDate', startDate);
            if (endDate) formData.append('endDate', endDate);
        } else {
            // Explicitly set dates to null when alwaysItem or nowProvid is true
            formData.append('startDate', '');
            formData.append('endDate', '');
        }

        // Log the form data for debugging
        console.log('Saving item with data:', {
            id: itemId,
            displayTitle,
            smallDescription,
            alwaysItem,
            nowProvid,
            startDate: !alwaysItem && !nowProvid ? startDate : null,
            endDate: !alwaysItem && !nowProvid ? endDate : null,
            hasImage: !!foodImage
        });

        // Make API call
        const response = await fetch(`/api/menu-items/${itemId || ''}`, {
            method: itemId ? 'PUT' : 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '保存失敗');
        }

        const savedItem = await response.json();
        console.log('Received response:', savedItem); // Debug log
        
        // Update the item in currentItems array
        if (itemId) {
            const index = currentItems.findIndex(item => item._id === itemId);
            if (index !== -1) {
                // Update the item with new values
                currentItems[index] = {
                    ...currentItems[index],
                    displayTitle,
                    smallDescription,
                    alwaysItem, // Update boolean fields
                    nowProvid,  // Update boolean fields
                    startDate: alwaysItem || nowProvid ? null : startDate,
                    endDate: alwaysItem || nowProvid ? null : endDate
                };

                // Update foodImage only if a new one was uploaded and saved successfully
                if (savedItem && savedItem.foodImage) {
                    currentItems[index].foodImage = savedItem.foodImage;
                }
                
                // Update the specific row in the table
                const tbody = document.getElementById('menuItemsList');
                if (tbody) {
                    const rows = tbody.getElementsByTagName('tr');
                    for (let row of rows) {
                        if (row.dataset.id === itemId) {
                            // Update row with new data
                            row.innerHTML = `
                                <td class="text-center">
                                    ${currentItems[index].foodImage ? 
                                        `<img src="${currentItems[index].foodImage}" class="img-preview" alt="${displayTitle}">` : 
                                        'No Image'}
                                </td>
                                <td>${displayTitle}</td>
                                <td>${smallDescription}</td>
                                <td class="text-center">
                                    <div class="form-check d-flex justify-content-center">
                                        <input type="checkbox" class="form-check-input" 
                                               ${alwaysItem ? 'checked' : ''} 
                                               onchange="updateItem('${itemId}', 'alwaysItem', this.checked)">
                                    </div>
                                </td>
                                <td class="text-center">
                                    <div class="form-check d-flex justify-content-center">
                                        <input type="checkbox" class="form-check-input" 
                                               ${nowProvid ? 'checked' : ''} 
                                               onchange="updateItem('${itemId}', 'nowProvid', this.checked)">
                                    </div>
                                </td>
                                <td class="text-center">
                                    <input type="date" class="form-control form-control-sm" 
                                           value="${startDate || ''}"
                                           ${alwaysItem || nowProvid ? 'disabled' : ''}
                                           onchange="updateItem('${itemId}', 'startDate', this.value)">
                                </td>
                                <td class="text-center">
                                    <input type="date" class="form-control form-control-sm" 
                                           value="${endDate || ''}"
                                           ${alwaysItem || nowProvid ? 'disabled' : ''}
                                           onchange="updateItem('${itemId}', 'endDate', this.value)">
                                </td>
                                <td class="text-center">
                                    <div class="btn-group">
                                        <button class="btn btn-primary me-2" onclick="editItem('${itemId}')">
                                            <i class="bi bi-pencil"></i> Edit
                                        </button>
                                        <button class="btn btn-danger" onclick="deleteItem('${itemId}')">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </td>
                            `;
                            break;
                        }
                    }
                }
            }
        } else {
            // For new items, add to array and re-render
            if (savedItem) {
                currentItems.push(savedItem);
                renderMenuItems(currentItems);
            }
        }

        // Close modal
        const editModal = bootstrap.Modal.getInstance(document.getElementById('editModal'));
        if (editModal) editModal.hide();

        showAlert('success', itemId ? 'Changes saved successfully!' : 'New item added successfully!');
    } catch (error) {
        console.error('Error saving menu item:', error);
        showAlert('danger', '保存失敗：' + error.message);
    }
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialize notification container
let notificationContainer;

function initializeNotificationContainer() {
    // Create container if it doesn't exist
    if (!document.getElementById('notificationContainer')) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notificationContainer';
        notificationContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
        `;
        document.body.appendChild(notificationContainer);
    } else {
        notificationContainer = document.getElementById('notificationContainer');
    }
}

// Show alert message
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        // Create alert container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'alertContainer';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.role = 'alert';
    alert.style.minWidth = '300px';
    alert.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    alert.style.border = 'none';
    alert.style.borderRadius = '8px';
    alert.style.padding = '1rem 1.25rem';
    alert.style.marginBottom = '1rem';
    alert.style.fontSize = '0.9rem';
    alert.style.opacity = '0';
    alert.style.transform = 'translateX(100%)';
    alert.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';

    // Add icon based on type
    let icon = '';
    switch(type) {
        case 'success':
            icon = '<i class="bi bi-check-circle-fill me-2"></i>';
            alert.style.backgroundColor = '#d1e7dd';
            alert.style.color = '#0a3622';
            break;
        case 'danger':
            icon = '<i class="bi bi-exclamation-circle-fill me-2"></i>';
            alert.style.backgroundColor = '#f8d7da';
            alert.style.color = '#58151c';
            break;
        case 'warning':
            icon = '<i class="bi bi-exclamation-triangle-fill me-2"></i>';
            alert.style.backgroundColor = '#fff3cd';
            alert.style.color = '#664d03';
            break;
        case 'info':
            icon = '<i class="bi bi-info-circle-fill me-2"></i>';
            alert.style.backgroundColor = '#cff4fc';
            alert.style.color = '#055160';
            break;
    }

    // Set alert content
    alert.innerHTML = `
        ${icon}
        ${message}
        <button type="button" class="btn-close" style="padding: 1.25rem;" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    // Add alert to container
    const container = document.getElementById('alertContainer');
    container.appendChild(alert);

    // Trigger animation
    setTimeout(() => {
        alert.style.opacity = '1';
        alert.style.transform = 'translateX(0)';
    }, 10);

    // Remove alert after delay
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 3000);
}

// Edit item
function editItem(id) {
    const item = currentItems.find(i => i._id === id);
    if (item) {
        showEditModal(item);
    } else {
        showAlert('danger', '找不到菜單項目');
    }
}

// Add some CSS styles
const style = document.createElement('style');
style.textContent = `
    .editable-cell {
        min-height: 20px;
        padding: 4px;
        border: 1px solid transparent;
        cursor: text;
    }
    .editable-cell:hover {
        border-color: #ddd;
    }
    .editable-cell:focus {
        border-color: #007bff;
        outline: none;
        background-color: #fff;
    }
    .checkbox-cell {
        text-align: center;
    }
    .actions-column {
        white-space: nowrap;
        width: 1%;
    }
    .image-cell {
        position: relative;
        cursor: pointer;
    }
    .image-cell:hover::after {
        content: "Click to change";
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 12px;
        padding: 2px;
        text-align: center;
    }
    thead th {
        vertical-align: middle !important;
        padding: 8px 4px !important;
        font-size: 14px;
        line-height: 1.2;
    }
    input[type="date"]:disabled {
        background-color: #e9ecef;
        cursor: not-allowed;
        opacity: 0.7;
    }
    input[type="date"]:disabled::after {
        content: "Not available";
        position: absolute;
        left: 0;
        right: 0;
        text-align: center;
        color: #6c757d;
    }
    .date-field-container {
        position: relative;
    }
    .date-field-container::after {
        content: attr(data-status);
        position: absolute;
        top: 100%;
        left: 0;
        font-size: 11px;
        color: #6c757d;
        display: none;
    }
    .date-field-container:hover::after {
        display: block;
    }
    #editDateFields {
        transition: opacity 0.3s ease;
        position: relative;
    }
    #editDateFields::after {
        content: attr(data-status);
        position: absolute;
        top: 100%;
        left: 0;
        font-size: 11px;
        color: #6c757d;
        margin-top: 4px;
    }
    #editDateFields.disabled {
        opacity: 0.7;
        pointer-events: none;
    }
`;
document.head.appendChild(style);
