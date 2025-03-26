/**
 * Gamerence - JavaScript file for Popular Games page
 */

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize popular games list
    initPopularGames();
    
    // Set up sorting events
    setupSorting();
    
    // Set up pagination
    setupPagination();
});

/**
 * Initialize popular games list
 */
async function initPopularGames() {
    try {
        // If games data exists in global variable, use it
        let games = window.gamesData;
        
        // If no global data, load from JSON file
        if (!games) {
            const response = await fetch('../data/games.json');
            if (!response.ok) {
                throw new Error('Unable to load game data');
            }
            const gamesData = await response.json();
            // Note: games.json is an array, not an object
            games = gamesData;
            window.gamesData = games;
        }
        
        // Sort by play count to get popular games
        const popularGames = [...games].sort((a, b) => (b.plays || 0) - (a.plays || 0));
        
        // Display total number of popular games
        displayGameCount(popularGames.length);
        
        // Initialize first page of games
        displayGames(popularGames);
        
        // Initialize pagination
        setupPagination(popularGames.length);
        
    } catch (error) {
        console.error('Error loading game data:', error);
        displayError('Error loading game data. Please try again later.');
        
        // Hide loading indicator
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }
}

/**
 * Display game count
 */
function displayGameCount(count) {
    const subtitle = document.querySelector('main section:first-child p');
    if (subtitle) {
        subtitle.textContent = `Explore the most popular games on our platform (${count} total)`;
    }
}

/**
 * Display error message
 */
function displayError(message) {
    const gameList = document.querySelector('#games-container');
    if (gameList) {
        gameList.innerHTML = `
            <div class="col-span-full text-center py-8">
                <div class="text-apple-red text-xl mb-2">Error</div>
                <p class="text-gray-600">${message}</p>
            </div>
        `;
    }
}

/**
 * Display games list
 */
function displayGames(games, page = 1, itemsPerPage = 12) {
    const container = document.querySelector('#games-container');
    if (!container) return;
    
    // Hide loading indicator
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    // Clear existing content, but keep loading indicator
    const currentContent = Array.from(container.children);
    currentContent.forEach(child => {
        if (child.id !== 'loading' && child.id !== 'no-results') {
            child.remove();
        }
    });
    
    // Calculate pagination
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, games.length);
    const currentPageGames = games.slice(startIndex, endIndex);
    
    if (currentPageGames.length === 0) {
        document.getElementById('no-results').classList.remove('hidden');
        return;
    }
    
    document.getElementById('no-results').classList.add('hidden');
    
    // Add game cards
    currentPageGames.forEach(game => {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
    });
    
    // Show pagination container if we have games
    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer && games.length > 0) {
        paginationContainer.style.display = 'flex';
    }
}

/**
 * Create game card element
 */
function createGameCard(game) {
    const gameCard = document.createElement('a');
    
    // Handle game link
    let gameUrl;
    if (game.embedUrl) {
        // If embedUrl exists, use dynamic game page
        gameUrl = `./play.html?id=${game.id}`;
    } else if (game.url && game.url.includes('./play.html')) {
        // If URL is play.html format, ensure correct path
        gameUrl = `./play.html?id=${game.id}`;
    } else {
        // Default case, use game-specific page or dynamic game page
        gameUrl = game.url || `./play.html?id=${game.id}`;
    }
    
    gameCard.href = gameUrl;
    gameCard.className = 'game-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow fade-in';
    
    // Build game card HTML
    const isNew = game.isNew || (game.dateAdded && isNewGame(game.dateAdded));
    const badgeClass = isNew ? 'bg-apple-green' : 'bg-apple-blue';
    const badgeText = isNew ? 'New' : 'Popular';
    
    // Fix image path issues
    let imagePath = game.image;
    if (!imagePath) {
        // If no image path, use default image
        imagePath = '../images/placeholder.jpg';
    } else if (imagePath.startsWith('../')) {
        // If path starts with ../, no need to modify as we're already in the games directory
        // Keep as is
    } else if (!imagePath.startsWith('/') && !imagePath.startsWith('http')) {
        // If relative path but doesn't start with ../, add ../ prefix
        imagePath = '../' + imagePath;
    }
    
    gameCard.innerHTML = `
        <div class="relative aspect-video">
            <img src="${imagePath}" alt="${game.title}" class="w-full h-full object-cover">
            <div class="absolute top-0 right-0 ${badgeClass} text-white text-xs px-2 py-1 m-2 rounded">${badgeText}</div>
        </div>
        <div class="p-3">
            <h3 class="font-bold text-sm md:text-base line-clamp-1">${game.title}</h3>
            <div class="flex text-xs text-gray-500 mt-1 flex-wrap">
                <span class="bg-apple-light-gray text-gray-700 rounded-full px-2 py-0.5 text-xs mr-1 mb-1">${game.category}</span>
                ${game.rating ? `<span class="bg-apple-light-gray text-gray-700 rounded-full px-2 py-0.5 text-xs mr-1 mb-1">★ ${game.rating}</span>` : ''}
                ${game.plays ? `<span class="bg-apple-light-gray text-gray-700 rounded-full px-2 py-0.5 text-xs mr-1 mb-1">${game.plays} plays</span>` : ''}
            </div>
        </div>
    `;
    
    return gameCard;
}

/**
 * Check if game is new (within 30 days)
 */
function isNewGame(dateAdded) {
    const addedDate = new Date(dateAdded);
    const now = new Date();
    const diffTime = Math.abs(now - addedDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
}

/**
 * Set up sorting
 */
function setupSorting() {
    const sortDropdown = document.getElementById('sort-dropdown');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', () => {
            const games = getSortedGames(sortDropdown.value);
            displayGames(games);
            setupPagination(games.length);
        });
    }
}

/**
 * Get sorted games
 */
function getSortedGames(sortType = 'plays') {
    const games = window.gamesData || [];
    let sortedGames = [...games];
    
    switch (sortType) {
        case 'plays':
            sortedGames.sort((a, b) => (b.plays || 0) - (a.plays || 0));
            break;
        case 'rating':
            sortedGames.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        case 'newest':
            sortedGames.sort((a, b) => {
                const dateA = new Date(a.dateAdded || 0);
                const dateB = new Date(b.dateAdded || 0);
                return dateB - dateA;
            });
            break;
    }
    
    return sortedGames;
}

/**
 * Set up pagination
 */
function setupPagination(totalItems, itemsPerPage = 12) {
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) {
        console.error('Pagination container not found');
        return;
    }
    
    // Total pages
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    // If only one page, hide pagination
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        return;
    }
    
    // Show pagination
    paginationContainer.style.display = 'flex';
    
    // Clear existing pagination
    paginationContainer.innerHTML = '';
    
    // Add previous page button
    const prevButton = document.createElement('button');
    prevButton.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
    prevButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
    `;
    prevButton.disabled = true; // Initial page is first page, disable previous button
    prevButton.addEventListener('click', () => {
        const currentPage = parseInt(paginationContainer.querySelector('button.bg-apple-blue').textContent || '1');
        if (currentPage > 1) {
            changePage(currentPage - 1);
        }
    });
    paginationContainer.appendChild(prevButton);
    
    // Add page number buttons (show max 5 pages)
    const maxVisiblePages = 5;
    const startPage = 1;
    const endPage = Math.min(totalPages, maxVisiblePages);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = i === 1 ? 'w-10 h-10 rounded-full bg-apple-blue text-white flex items-center justify-center' : 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => changePage(i));
        paginationContainer.appendChild(pageButton);
    }
    
    // If total pages is more than 5, add ellipsis and last page
    if (totalPages > maxVisiblePages) {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'w-10 h-10 flex items-center justify-center';
        ellipsis.textContent = '...';
        paginationContainer.appendChild(ellipsis);
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
        lastPageButton.textContent = totalPages;
        lastPageButton.addEventListener('click', () => changePage(totalPages));
        paginationContainer.appendChild(lastPageButton);
    }
    
    // Add next page button
    const nextButton = document.createElement('button');
    nextButton.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
    nextButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
    `;
    nextButton.addEventListener('click', () => {
        const currentPage = parseInt(paginationContainer.querySelector('button.bg-apple-blue').textContent || '1');
        if (currentPage < totalPages) {
            changePage(currentPage + 1);
        }
    });
    paginationContainer.appendChild(nextButton);
}

/**
 * Change current page
 */
function changePage(page) {
    // Get current sort
    const sortDropdown = document.getElementById('sort-dropdown');
    const sortType = sortDropdown ? sortDropdown.value : 'plays';
    
    // Get sorted games
    const games = getSortedGames(sortType);
    
    // Display games for selected page
    displayGames(games, page);
    
    // Update page buttons
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    
    const buttons = paginationContainer.querySelectorAll('button');
    buttons.forEach(button => {
        if (button.textContent && parseInt(button.textContent) === page) {
            button.className = 'w-10 h-10 rounded-full bg-apple-blue text-white flex items-center justify-center';
        } else if (button.textContent && !isNaN(parseInt(button.textContent))) {
            button.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
        }
    });
    
    // Update prev/next button state
    const totalPages = Math.ceil(games.length / 12);
    const prevButton = buttons[0];
    const nextButton = buttons[buttons.length - 1];
    
    if (prevButton) {
        if (page === 1) {
            prevButton.classList.add('opacity-50', 'cursor-not-allowed');
            prevButton.disabled = true;
        } else {
            prevButton.classList.remove('opacity-50', 'cursor-not-allowed');
            prevButton.disabled = false;
        }
    }
    
    if (nextButton) {
        if (page === totalPages) {
            nextButton.classList.add('opacity-50', 'cursor-not-allowed');
            nextButton.disabled = true;
        } else {
            nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
            nextButton.disabled = false;
        }
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
} 