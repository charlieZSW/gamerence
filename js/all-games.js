/**
 * Gamerence - JavaScript file for All Games page
 */

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game list
    initAllGames();
    
    // Set up filter events
    setupFilters();
});

/**
 * Initialize all games list
 */
async function initAllGames() {
    try {
        // If games data exists in global variable, use it
        let games = window.gamesData;
        
        // If no global data, load from JSON file
        if (!games) {
            const response = await fetch('../data/games.json');
            if (!response.ok) {
                throw new Error('Unable to load game data');
            }
            games = await response.json();
            window.gamesData = games;
        }
        
        // Display total number of games
        displayGameCount(games.length);
        
        // Initialize first page of games
        displayGames(games);
        
        // Initialize pagination
        setupPagination(games.length);
        
    } catch (error) {
        console.error('Error loading game data:', error);
        displayError('Error loading game data. Please try again later.');
        
        // Hide loading indicator and show error message
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.classList.add('hidden');
        }
    }
}

/**
 * Display game count
 */
function displayGameCount(count, isFiltered = false) {
    const subtitle = document.querySelector('main section:first-child p');
    if (subtitle) {
        if (isFiltered) {
            subtitle.textContent = `Found ${count} games matching your filter criteria`;
        } else {
            subtitle.textContent = `Explore all the amazing HTML5 games on our platform (${count} total)`;
        }
    }
}

/**
 * Display error message
 */
function displayError(message) {
    const gameList = document.querySelector('section:nth-of-type(3) .grid');
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
    const container = document.querySelector('section:nth-of-type(3) .grid');
    if (!container) {
        console.error('Game container not found');
        return;
    }
    
    // Hide loading indicator
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
    
    // Clear existing content, but keep loading indicator and no results state
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
    
    const noResultsElement = document.getElementById('no-results');
    if (currentPageGames.length === 0) {
        if (noResultsElement) {
            noResultsElement.classList.remove('hidden');
        }
        return;
    } else {
        if (noResultsElement) {
            noResultsElement.classList.add('hidden');
        }
    }
    
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
    let imagePath = game.image || '../images/placeholder.jpg';
    if (imagePath && imagePath.startsWith('../')) {
        // Already has correct path
    } else if (!imagePath.startsWith('/') && !imagePath.startsWith('http')) {
        // If relative path but doesn't start with ../, add ../ prefix
        imagePath = '../' + imagePath;
    }
    
    gameCard.innerHTML = `
        <div class="relative aspect-video">
            <img src="${imagePath}" alt="${game.title}" class="w-full h-full object-cover" onerror="this.src='../images/placeholder.jpg'">
            <div class="absolute top-0 right-0 ${badgeClass} text-white text-xs px-2 py-1 m-2 rounded">${badgeText}</div>
        </div>
        <div class="p-3">
            <h3 class="font-bold text-sm md:text-base line-clamp-1">${game.title}</h3>
            <div class="flex text-xs text-gray-500 mt-1 flex-wrap">
                <!-- 主分类标签 - 转换为链接 -->
                ${game.category ? 
                  `<a href="../categories/category-template.html?category=${game.category.toLowerCase()}" 
                      class="bg-apple-light-gray text-gray-700 rounded-full px-2 py-0.5 text-xs mr-1 mb-1 hover:bg-gray-300 transition-colors"
                      target="_blank"
                      onclick="event.stopPropagation();">
                      ${game.category}
                   </a>` : ''}
                
                <!-- 额外分类标签 (最多显示两个) - 转换为链接 -->
                ${game.categories && Array.isArray(game.categories) ? 
                  game.categories
                    .filter(cat => cat.toLowerCase() !== (game.category || '').toLowerCase()) // 过滤掉与主类别重复的
                    .slice(0, 2) // 只取前两个
                    .map(cat => 
                      `<a href="../categories/category-template.html?category=${cat.toLowerCase()}" 
                          class="bg-apple-light-gray text-gray-700 rounded-full px-2 py-0.5 text-xs mr-1 mb-1 hover:bg-gray-300 transition-colors"
                          target="_blank"
                          onclick="event.stopPropagation();">
                          ${cat}
                       </a>`
                    )
                    .join('') : ''}
                
                <!-- 游戏信息标签 -->
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
    if (!dateAdded) return false;
    try {
        const addedDate = new Date(dateAdded);
        const now = new Date();
        const diffTime = Math.abs(now - addedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    } catch (e) {
        console.error('Error checking if game is new:', e);
        return false;
    }
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
    // Get filtered games
    const games = getFilteredGames();
    
    // Display games for selected page
    displayGames(games, page);
    
    // Update filtered game count display
    const categoryFilter = document.querySelector('select[aria-label="Game Category"]');
    if (categoryFilter && categoryFilter.value) {
        displayGameCount(games.length, true);
    }
    
    // Update page buttons
    const paginationContainer = document.getElementById('pagination-container');
    if (!paginationContainer) return;
    
    // 计算总页数
    const totalPages = Math.ceil(games.length / 12);
    const maxVisiblePages = 5;

    // 重新计算并更新可见页码范围
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // 如果结束页码与开始页码的差小于最大可见页码数，则调整开始页码
    if (endPage - startPage + 1 < maxVisiblePages && startPage > 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 清除现有页码按钮（保留前后按钮）
    const buttons = Array.from(paginationContainer.querySelectorAll('button, span'));
    const prevButton = buttons[0];
    const nextButton = buttons[buttons.length - 1];
    
    // 清除所有页码按钮和省略号，只保留前后按钮
    paginationContainer.innerHTML = '';
    paginationContainer.appendChild(prevButton);

    // 添加第一页按钮（如果当前范围不从第一页开始）
    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', () => changePage(1));
        paginationContainer.appendChild(firstPageButton);
        
        // 如果开始页不是第2页，添加省略号
        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'w-10 h-10 flex items-center justify-center';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    // 添加中间页码按钮
    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.className = i === page 
            ? 'w-10 h-10 rounded-full bg-apple-blue text-white flex items-center justify-center' 
            : 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
        pageButton.textContent = i;
        pageButton.addEventListener('click', () => changePage(i));
        paginationContainer.appendChild(pageButton);
    }

    // 添加最后一页按钮（如果当前范围不到最后一页）
    if (endPage < totalPages) {
        // 如果结束页不是倒数第二页，添加省略号
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'w-10 h-10 flex items-center justify-center';
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
        
        const lastPageButton = document.createElement('button');
        lastPageButton.className = 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
        lastPageButton.textContent = totalPages;
        lastPageButton.addEventListener('click', () => changePage(totalPages));
        paginationContainer.appendChild(lastPageButton);
    }

    // 添加下一页按钮
    paginationContainer.appendChild(nextButton);
    
    // 更新前一页/下一页按钮状态
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

/**
 * Set up filter events
 */
function setupFilters() {
    // Get filter form elements
    const categoryFilter = document.querySelector('select[aria-label="Game Category"]');
    const sortFilter = document.querySelector('select[aria-label="Sort By"]');
    const applyButton = document.querySelector('button.bg-apple-blue');
    
    console.log('Filters found:', { categoryFilter, sortFilter, applyButton });
    
    if (categoryFilter && sortFilter && applyButton) {
        applyButton.addEventListener('click', () => {
            const games = getFilteredGames();
            console.log(`Filtered games: ${games.length}`);
            
            // 更新游戏计数显示
            const isFiltered = categoryFilter.value !== '';
            displayGameCount(games.length, isFiltered);
            
            // 显示游戏和分页
            displayGames(games);
            setupPagination(games.length);
        });
    } else {
        console.error('Filter elements not found:', { 
            categoryFilterFound: !!categoryFilter, 
            sortFilterFound: !!sortFilter, 
            applyButtonFound: !!applyButton 
        });
    }
}

/**
 * Get filtered games based on current filter settings
 */
function getFilteredGames() {
    const categoryFilter = document.querySelector('select[aria-label="Game Category"]');
    const sortFilter = document.querySelector('select[aria-label="Sort By"]');
    
    let games = window.gamesData || [];
    
    // Apply category filter
    if (categoryFilter && categoryFilter.value) {
        games = games.filter(game => {
            // 先检查主类别
            if (game.category && typeof game.category === 'string') {
                if (game.category.toLowerCase() === categoryFilter.value.toLowerCase()) {
                    return true;
                }
            }
            
            // 再检查次要类别数组
            if (game.categories && Array.isArray(game.categories)) {
                return game.categories.some(category => 
                    category.toLowerCase() === categoryFilter.value.toLowerCase()
                );
            }
            
            return false;
        });
    }
    
    // Apply sorting
    if (sortFilter) {
        switch (sortFilter.value) {
            case 'popular':
                games.sort((a, b) => (b.plays || 0) - (a.plays || 0));
                break;
            case 'newest':
                games.sort((a, b) => {
                    const dateA = new Date(a.dateAdded || 0);
                    const dateB = new Date(b.dateAdded || 0);
                    return dateB - dateA;
                });
                break;
            case 'rating':
                games.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'name':
                games.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
        }
    }
    
    return games;
} 