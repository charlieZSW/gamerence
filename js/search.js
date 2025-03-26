/**
 * Gamerence - Search Page JavaScript
 * Handles search functionality for the game search page
 */

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const searchTitleCheckbox = document.getElementById('search-title');
    const searchDescriptionCheckbox = document.getElementById('search-description');
    const searchCategoryCheckbox = document.getElementById('search-category');
    const resultsTitle = document.getElementById('results-title');
    const resultsGrid = document.getElementById('results-grid');
    const searchPrompt = document.getElementById('search-prompt');
    const loadingElement = document.getElementById('loading');
    const noResultsElement = document.getElementById('no-results');
    const errorElement = document.getElementById('error-state');
    const sortContainer = document.getElementById('sort-container');
    const sortDropdown = document.getElementById('sort-dropdown');
    const paginationContainer = document.getElementById('pagination-container');
    const pageNumbers = document.getElementById('page-numbers');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    // State
    let allGames = [];
    let searchResults = [];
    let currentPage = 1;
    let gamesPerPage = 12;
    let currentQuery = '';
    let categoriesMap = {};

    // Check for search query in URL
    const urlParams = new URLSearchParams(window.location.search);
    const queryParam = urlParams.get('q');
    
    if (queryParam) {
        searchInput.value = queryParam;
        performSearch(queryParam);
    }
    
    // Event listeners
    searchButton.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });
    
    sortDropdown.addEventListener('change', function() {
        sortResults();
        renderResults();
    });
    
    prevButton.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderResults();
        }
    });
    
    nextButton.addEventListener('click', function() {
        if (currentPage < Math.ceil(searchResults.length / gamesPerPage)) {
            currentPage++;
            renderResults();
        }
    });
    
    // Load games data and categories
    loadGamesData();

    // Functions
    function loadGamesData() {
        fetch('../data/games.json')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                allGames = data;
                
                // Extract categories from games
                data.forEach(game => {
                    if (game.category) {
                        categoriesMap[game.category] = capitalizeFirstLetter(game.category);
                    }
                });
                
                // If there was a query in the URL, search now that we have the data
                if (queryParam && searchResults.length === 0) {
                    performSearch(queryParam);
                }
            })
            .catch(error => {
                console.error('Error loading game data:', error);
                showError();
            });
    }
    
    function performSearch(query) {
        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('q', query);
        window.history.pushState({}, '', url);
        
        currentQuery = query;
        currentPage = 1;
        
        // Show loading state
        showLoading();
        
        // Update results title
        resultsTitle.textContent = `Search Results for "${query}"`;
        
        // Simulate loading delay for better UX
        setTimeout(() => {
            // Filter games based on search criteria
            searchResults = filterGamesByQuery(allGames, query);
            
            if (searchResults.length > 0) {
                sortResults();
                renderResults();
                
                // Show sort options and pagination if we have results
                sortContainer.style.display = 'block';
                if (searchResults.length > gamesPerPage) {
                    paginationContainer.style.display = 'flex';
                } else {
                    paginationContainer.style.display = 'none';
                }
            } else {
                showNoResults();
            }
        }, 500);
    }
    
    function filterGamesByQuery(games, query) {
        query = query.toLowerCase().trim();
        
        return games.filter(game => {
            const matchTitle = searchTitleCheckbox.checked && 
                               game.title && 
                               game.title.toLowerCase().includes(query);
            
            const matchDescription = searchDescriptionCheckbox.checked && 
                                     game.description && 
                                     game.description.toLowerCase().includes(query);
            
            const matchCategory = searchCategoryCheckbox.checked && 
                                  game.category && 
                                  game.category.toLowerCase().includes(query);
            
            return matchTitle || matchDescription || matchCategory;
        });
    }
    
    function sortResults() {
        const sortBy = sortDropdown.value;
        
        switch(sortBy) {
            case 'name':
                searchResults.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
                break;
            case 'newest':
                searchResults.sort((a, b) => {
                    const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0);
                    const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0);
                    return dateB - dateA;
                });
                break;
            case 'rating':
                searchResults.sort((a, b) => {
                    const ratingA = a.rating || 0;
                    const ratingB = b.rating || 0;
                    return ratingB - ratingA;
                });
                break;
            default: // relevance - keep original order
                // No sorting needed, results are already sorted by relevance
                break;
        }
    }
    
    function renderResults() {
        // Clear existing results
        resultsGrid.innerHTML = '';
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const currentPageGames = searchResults.slice(startIndex, endIndex);
        
        // Create game cards
        currentPageGames.forEach(game => {
            const card = createGameCard(game);
            resultsGrid.appendChild(card);
        });
        
        // Update pagination
        updatePagination();
        
        // Show results grid
        hideAllStates();
        resultsGrid.classList.remove('hidden');
    }
    
    function createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow';
        
        const imageUrl = game.image || '../images/placeholder.jpg';
        const isNew = isNewGame(game.dateAdded);
        const isPopular = !isNew && (game.plays >= 10000);
        
        let badgeHtml = '';
        if (isNew) {
            badgeHtml = `<div class="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 m-2 rounded">New</div>`;
        } else if (isPopular) {
            badgeHtml = `<div class="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 m-2 rounded">Popular</div>`;
        }
        
        card.innerHTML = `
            <a href="../games/play.html?id=${game.id}">
                <div class="relative">
                    <img src="${imageUrl}" alt="${game.title}" class="w-full h-40 object-cover">
                    ${badgeHtml}
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-gray-900 mb-1 line-clamp-1">${game.title}</h3>
                    <div class="flex flex-wrap gap-1 mb-2">
                        <span class="text-xs bg-gray-200 rounded-full px-2 py-1">${getCategoryName(game.category)}</span>
                        ${game.rating ? `<span class="text-xs bg-gray-200 rounded-full px-2 py-1">★ ${game.rating}</span>` : ''}
                        ${game.plays ? `<span class="text-xs bg-gray-200 rounded-full px-2 py-1">${game.plays} plays</span>` : ''}
                    </div>
                    <p class="text-gray-600 text-sm line-clamp-2">${game.description || ''}</p>
                </div>
            </a>
        `;
        
        return card;
    }
    
    function updatePagination() {
        // Clear existing page numbers
        pageNumbers.innerHTML = '';
        
        const totalPages = Math.ceil(searchResults.length / gamesPerPage);
        
        // Determine which page numbers to show
        let pagesToShow = [];
        if (totalPages <= 5) {
            // Show all pages if 5 or fewer
            for (let i = 1; i <= totalPages; i++) {
                pagesToShow.push(i);
            }
        } else {
            // Always include first and last page
            pagesToShow.push(1);
            
            // Calculate middle range
            if (currentPage <= 3) {
                pagesToShow.push(2, 3, 4, '...');
            } else if (currentPage >= totalPages - 2) {
                pagesToShow.push('...', totalPages - 3, totalPages - 2, totalPages - 1);
            } else {
                pagesToShow.push('...', currentPage - 1, currentPage, currentPage + 1, '...');
            }
            
            pagesToShow.push(totalPages);
        }
        
        // Generate page buttons
        pagesToShow.forEach(page => {
            if (page === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'w-10 h-10 flex items-center justify-center';
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            } else {
                const button = document.createElement('button');
                button.className = page === currentPage 
                    ? 'w-10 h-10 rounded-full bg-apple-blue text-white flex items-center justify-center'
                    : 'w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 hover:bg-apple-blue hover:text-white transition-colors';
                button.textContent = page;
                
                button.addEventListener('click', () => {
                    if (page !== currentPage) {
                        currentPage = page;
                        renderResults();
                    }
                });
                
                pageNumbers.appendChild(button);
            }
        });
        
        // Update prev/next buttons
        prevButton.disabled = currentPage === 1;
        nextButton.disabled = currentPage === totalPages;
        
        prevButton.classList.toggle('opacity-50', currentPage === 1);
        nextButton.classList.toggle('opacity-50', currentPage === totalPages);
    }
    
    function isNewGame(dateAdded) {
        if (!dateAdded) return false;
        
        const addedDate = new Date(dateAdded);
        const now = new Date();
        const diffTime = Math.abs(now - addedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= 30;
    }
    
    function getCategoryName(categoryId) {
        if (!categoryId) return 'Uncategorized';
        return categoriesMap[categoryId] || capitalizeFirstLetter(categoryId);
    }
    
    function capitalizeFirstLetter(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // UI State management
    function hideAllStates() {
        searchPrompt.classList.add('hidden');
        loadingElement.classList.add('hidden');
        noResultsElement.classList.add('hidden');
        errorElement.classList.add('hidden');
        resultsGrid.classList.add('hidden');
    }
    
    function showLoading() {
        hideAllStates();
        loadingElement.classList.remove('hidden');
    }
    
    function showNoResults() {
        hideAllStates();
        noResultsElement.classList.remove('hidden');
        sortContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
    }
    
    function showError() {
        hideAllStates();
        errorElement.classList.remove('hidden');
        sortContainer.style.display = 'none';
        paginationContainer.style.display = 'none';
    }
}); 