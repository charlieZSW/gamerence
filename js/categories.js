// Used to dynamically update the number of games in each category on the game categories page

// Define game categories and their corresponding CSS selectors
const categorySelectors = {
    'action': '[data-category="action"] .text-apple-blue',
    'adventure': '[data-category="adventure"] .text-apple-blue',
    'puzzle': '[data-category="puzzle"] .text-apple-blue',
    'strategy': '[data-category="strategy"] .text-apple-blue',
    'roguelike': '[data-category="roguelike"] .text-apple-blue',
    'racing': '[data-category="racing"] .text-apple-blue',
    'sports': '[data-category="sports"] .text-apple-blue',
    'rpg': '[data-category="rpg"] .text-apple-blue',
    'shooter': '[data-category="shooter"] .text-apple-blue',
    'arcade': '[data-category="arcade"] .text-apple-blue',
    'simulation': '[data-category="simulation"] .text-apple-blue',
    'platformer': '[data-category="platformer"] .text-apple-blue',
    'idle': '[data-category="idle"] .text-sm',
    'multiplayer': '[data-category="multiplayer"] .text-apple-blue',
    'html5': '[data-category="html5"] .text-sm',
    'io': '[data-category="io"] .text-sm',
    'clicker': '[data-category="clicker"] .text-sm',
    'educational': '[data-category="educational"] .text-apple-blue',
    'card': '[data-category="card"] .text-apple-blue',
    'fighting': '[data-category="fighting"] .text-apple-blue',
    'horror': '[data-category="horror"] .text-apple-blue',
    'casual': '[data-category="casual"] .text-apple-blue',
    'rhythm': '[data-category="rhythm"] .text-apple-blue',
    'sandbox': '[data-category="sandbox"] .text-apple-blue',
    'mmo': '[data-category="mmo"] .text-apple-blue',
    'board': '[data-category="board"] .text-sm',
    'fashion': '[data-category="fashion"] .text-apple-blue'
};

// Get the base path for the current page to build the games.json relative path
function getBasePath() {
    // If on the homepage, return the path relative to the root directory
    if (window.location.pathname.endsWith('/index.html') || window.location.pathname.endsWith('/')) {
        return './data/games.json';
    }
    // If on the categories page, return the path relative to the categories directory
    else if (window.location.pathname.includes('/categories/')) {
        return '../data/games.json';
    }
    // Default to the path relative to the root directory
    return './data/games.json';
}

// Main function: Load game data and update category counts
async function initCategories() {
    try {
        // Get game data using relative path
        const response = await fetch(getBasePath());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const games = await response.json();
        
        // Output debug information
        if (window.debug) {
            console.log('Successfully loaded game data:', games.length, 'games');
        }
        
        // Get the number of games in each category
        const categoryCounts = countGamesByCategory(games);
        
        // Update the category game counts on the page
        updateCategoryCountsOnPage(categoryCounts);
        
    } catch (error) {
        console.error('Error loading game data:', error);
        displayErrorMessage('Unable to load game data, please try again later.');
    }
}

// Count games by category
function countGamesByCategory(games) {
    const counts = {};
    
    // Initialize all category counts to 0
    Object.keys(categorySelectors).forEach(category => {
        counts[category] = 0;
    });
    
    // Count the number of games in each category
    games.forEach(game => {
        // 创建一个集合来记录已经计算过的类别，避免重复计算
        const countedCategories = new Set();
        
        // Handle single category field (string)
        if (game.category && typeof game.category === 'string') {
            const category = game.category.toLowerCase();
            if (counts[category] !== undefined) {
                counts[category]++;
                countedCategories.add(category); // 记录此类别已被计算
            }
        }
        
        // Also compatible with potential categories array
        if (game.categories && Array.isArray(game.categories)) {
            game.categories.forEach(category => {
                const categoryLower = category.toLowerCase();
                // 只有当这个类别尚未被计算过时才增加计数
                if (counts[categoryLower] !== undefined && !countedCategories.has(categoryLower)) {
                    counts[categoryLower]++;
                    countedCategories.add(categoryLower);
                }
            });
        }
    });
    
    // Output debug information
    console.log('Category count results:', counts);
    
    return counts;
}

// Update category game counts on the page
function updateCategoryCountsOnPage(categoryCounts) {
    Object.entries(categorySelectors).forEach(([category, selector]) => {
        const count = categoryCounts[category] || 0;
        
        try {
            // Try to find all matching elements
            const elements = document.querySelectorAll(selector);
            console.log(`Found ${elements.length} elements matching selector: ${selector}`);
            
            // If no elements found, try to find loading-text elements
            if (elements.length === 0) {
                const loadingElements = document.querySelectorAll(`[data-category="${category}"] .loading-text`);
                loadingElements.forEach(element => {
                    element.classList.remove('loading-text');
                    element.textContent = `${count} games`;
                });
            } else {
                elements.forEach(element => {
                    // Remove loading animation class
                    element.classList.remove('loading-text');
                    
                    // Format count based on element class
                    if (element.classList.contains('text-apple-blue')) {
                        element.textContent = `${count} games`;
                    } else if (element.classList.contains('text-sm')) {
                        element.textContent = `${count} games`;
                    } else if (element.classList.contains('bg-red-100')) {
                        element.textContent = `${count} games`;
                    } else {
                        element.textContent = `${count} games`;
                    }
                });
            }
        } catch (error) {
            console.error(`Error updating ${category} category count:`, error);
        }
    });
    
    // Handle all remaining loading-text elements, set them all to "0 games"
    document.querySelectorAll('.loading-text').forEach(element => {
        element.classList.remove('loading-text');
        element.textContent = '0 games';
    });
}

// Display error message
function displayErrorMessage(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Error!</strong>
                <span class="block sm:inline">${message}</span>
            </div>
        `;
        errorContainer.classList.remove('hidden');
    }
}

// Initialize categories when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initCategories); 