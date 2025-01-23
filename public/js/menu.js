// Function to load menu items from database
async function loadMenuItems() {
    try {
        const response = await fetch('/api/menu-items/active');
        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to fetch menu items:', result.error);
            return;
        }

        const menuItems = result.data;
        const now = new Date();

        // Categorize items
        const categories = {
            limited: [], // 期間限定
            regular: [], // 常規供應
            other: []    // 其他美食
        };

        menuItems.forEach(item => {
            if (item.alwaysItem) {
                // 常規供應
                categories.regular.push(item);
            } else if (item.nowProvid) {
                // 其他美食
                categories.other.push(item);
            } else {
                // Check if item is within date range for 期間限定
                const startDate = item.startDate ? new Date(item.startDate) : null;
                const endDate = item.endDate ? new Date(item.endDate) : null;
                
                if (startDate && endDate && startDate <= now && endDate >= now) {
                    categories.limited.push(item);
                }
            }
        });

        // Sort each category by title
        for (const category in categories) {
            categories[category].sort((a, b) => 
                a.displayTitle.localeCompare(b.displayTitle)
            );
        }

        // Create menu sections
        const menuContainer = document.getElementById('menuContainer');
        if (!menuContainer) {
            console.error('Menu container element not found');
            return;
        }
        menuContainer.innerHTML = ''; // Clear existing content

        // Create grid container for all sections
        const gridContainer = document.createElement('div');
        gridContainer.className = 'menu-grid';

        // 期間限定 Section
        if (categories.limited.length > 0) {
            const limitedSection = createSection('期間限定', categories.limited);
            gridContainer.appendChild(limitedSection);
        }

        // 常規供應 Section
        if (categories.regular.length > 0) {
            const regularSection = createSection('常規供應', categories.regular);
            gridContainer.appendChild(regularSection);
        }

        // 其他美食 Section
        if (categories.other.length > 0) {
            const otherSection = createSection('其他美食', categories.other);
            gridContainer.appendChild(otherSection);
        }

        menuContainer.appendChild(gridContainer);

    } catch (error) {
        console.error('Error loading menu:', error);
        const menuContainer = document.getElementById('menuContainer');
        if (menuContainer) {
            menuContainer.innerHTML = '<p class="error-message">無法載入菜單項目。請稍後再試。</p>';
        }
    }
}

function createSection(title, items) {
    const section = document.createElement('div');
    section.className = 'menu-section';

    const titleElement = document.createElement('h2');
    titleElement.className = 'section-title';
    titleElement.textContent = title;
    section.appendChild(titleElement);

    const itemsContainer = document.createElement('div');
    itemsContainer.className = 'menu-items-grid';

    items.forEach(item => {
        const itemElement = createMenuItem(item);
        itemsContainer.appendChild(itemElement);
    });

    section.appendChild(itemsContainer);
    return section;
}

function createMenuItem(item) {
    const itemElement = document.createElement('div');
    itemElement.className = 'menu-item';

    const imageContainer = document.createElement('div');
    imageContainer.className = 'menu-item-image';
    const image = document.createElement('img');
    image.src = item.foodImage;
    image.alt = item.displayTitle;
    imageContainer.appendChild(image);

    const contentContainer = document.createElement('div');
    contentContainer.className = 'menu-item-content';

    const title = document.createElement('h3');
    title.className = 'menu-item-title';
    title.textContent = item.displayTitle;

    const description = document.createElement('p');
    description.className = 'menu-item-description';
    description.textContent = item.smallDescription;

    const ingredients = document.createElement('p');
    ingredients.className = 'menu-item-ingredients';
    if (item.ingredients && item.ingredients.length > 0) {
        ingredients.textContent = '食材: ' + item.ingredients.join(', ');
    }

    // Add availability dates for limited items
    if (!item.alwaysItem && !item.nowProvid && item.startDate && item.endDate) {
        const dates = document.createElement('p');
        dates.className = 'menu-item-dates';
        const startDate = new Date(item.startDate).toLocaleDateString();
        const endDate = new Date(item.endDate).toLocaleDateString();
        dates.textContent = `供應期間: ${startDate} - ${endDate}`;
        contentContainer.appendChild(dates);
    }

    contentContainer.appendChild(title);
    contentContainer.appendChild(description);
    if (item.ingredients && item.ingredients.length > 0) {
        contentContainer.appendChild(ingredients);
    }

    itemElement.appendChild(imageContainer);
    itemElement.appendChild(contentContainer);

    return itemElement;
}

document.addEventListener('DOMContentLoaded', loadMenuItems);
