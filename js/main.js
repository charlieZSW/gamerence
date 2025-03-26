/**
 * Gamerence - Main JavaScript File
 */

// Execute when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load game data
    loadGames();
    
    // Initialize search functionality
    initSearch();
});

/**
 * Load game data from JSON file
 */
async function loadGames() {
    try {
        // Get current page path to determine correct data file path
        const currentPath = window.location.pathname;
        let dataPath;
        
        // Determine relative path of data file based on current page path
        if (currentPath.includes('/games/') || currentPath.includes('/categories/')) {
            dataPath = '../data/games.json';
        } else {
            dataPath = './data/games.json';
        }
        
        console.log('Loading game data, path:', dataPath);
        const response = await fetch(dataPath);
        
        if (!response.ok) {
            throw new Error(`Cannot load game data: HTTP error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Game data loaded successfully:', data.length, 'games');
        
        // Save data to global variable for search and other features
        window.gamesData = data;
        
        // Update page with data
        updateHomePage(data);
    } catch (error) {
        console.error('Error loading game data:', error);
        // Display friendly error message
        const errorContainer = document.getElementById('error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong class="font-bold">Loading Failed!</strong>
                    <span class="block sm:inline">Unable to load game data: ${error.message}</span>
                </div>
            `;
            errorContainer.classList.remove('hidden');
        }
    }
}

/**
 * Update homepage with loaded game data
 */
function updateHomePage(data) {
    if (!data || data.length === 0) {
        console.error('No game data available');
        showError('Unable to load game data: No game data available');
        return;
    }
    
    // Add debug information
    const debugPanel = document.getElementById('debug-panel');
    const debugInfo = document.getElementById('debug-info');
    
    if (debugPanel && debugInfo) {
        debugInfo.innerHTML = `Page loaded successfully! Found ${data.length} games`;
        // Show debug panel in development environment
        // debugPanel.classList.remove('hidden');
    }
    
    try {
        // Get featured games
        const featuredGames = data.filter(game => game.featured === true);
        
        // Initialize featured games carousel
        if (featuredGames.length > 0) {
            initFeaturedCarousel(featuredGames);
            if (debugInfo) {
                debugInfo.innerHTML += `, including ${featuredGames.length} featured games.`;
            }
        } else {
            console.warn('No featured games found, please mark at least one game as featured: true in games.json');
            if (debugInfo) {
                debugInfo.innerHTML += `, but no featured games found. Please mark at least one game as featured: true in games.json.`;
            }
        }
        
        // Update game category counts
        updateCategoryCount(data);
        
        // Replace placeholder game cards
        // Sort by rating to get popular games
        const popularGames = [...data].sort((a, b) => b.rating - a.rating).slice(0, 8);
        // Sort by date to get newest games
        const newGames = [...data].sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded)).slice(0, 8);
        
        updateGameSection('Popular Games', popularGames);
        updateGameSection('Latest Games', newGames);
        
        // Remove animation effects from loading placeholders
        document.querySelectorAll('.game-card-placeholder').forEach(placeholder => {
            placeholder.classList.add('hidden');
        });
    
    } catch (error) {
        console.error('Error updating homepage:', error);
        showError(`Error updating homepage: ${error.message}`);
    }
}

/**
 * Display error message
 */
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `
            <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong class="font-bold">Loading Failed!</strong>
                <span class="block sm:inline">${message}</span>
            </div>
        `;
        errorContainer.classList.remove('hidden');
    }
}

/**
 * Update game section
 */
function updateGameSection(sectionTitle, games) {
    // Use more precise selector
    let container;
    
    if (sectionTitle === 'Popular Games') {
        // Find section with title "Popular Games"
        const sections = document.querySelectorAll('section.mb-12');
        for (let i = 0; i < sections.length; i++) {
            const heading = sections[i].querySelector('h2');
            if (heading && heading.textContent.trim() === 'Popular Games') {
                container = sections[i].querySelector('.grid');
                break;
            }
        }
    } else if (sectionTitle === 'Latest Games') {
        // Find section with title "Latest Games"
        const sections = document.querySelectorAll('section.mb-12');
        for (let i = 0; i < sections.length; i++) {
            const heading = sections[i].querySelector('h2');
            if (heading && heading.textContent.trim() === 'Latest Games') {
                container = sections[i].querySelector('.grid');
                break;
            }
        }
    }
    
    if (!container) {
        console.error(`Container for "${sectionTitle}" section not found`);
        return;
    }
    
    console.log(`Updating ${sectionTitle} section, adding ${games.length} game cards to`, container);
    
    // Clear all existing content in container
    container.innerHTML = '';
    
    // Add game cards
    games.forEach(game => {
        const gameCard = createGameCard(game);
        container.appendChild(gameCard);
    });
}

/**
 * Create game card element
 */
function createGameCard(game) {
    const gameCard = document.createElement('a');
    
    // Process game link
    let gameUrl;
    if (game.embedUrl) {
        // If there is an embedUrl, use dynamic game page
        gameUrl = `./games/play.html?id=${game.id}`;
    } else if (game.url && game.url.includes('./play.html')) {
        // If URL is in play.html format, ensure correct path is used
        gameUrl = `./games/play.html?id=${game.id}`;
    } else {
        // Default case, use game exclusive page or dynamic game page
        gameUrl = game.url || `./games/play.html?id=${game.id}`;
    }
    
    gameCard.href = gameUrl;
    gameCard.className = 'game-card bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow fade-in';
    
    // Build game card HTML
    const isNew = game.isNew || (game.dateAdded && isNewGame(game.dateAdded));
    const badgeClass = isNew ? 'bg-apple-green' : 'bg-apple-blue';
    const badgeText = isNew ? 'New Release' : 'Popular';
    
    gameCard.innerHTML = `
        <div class="relative aspect-video">
            <img src="${game.image}" alt="${game.title}" class="w-full h-full object-cover">
            <div class="absolute top-0 right-0 ${badgeClass} text-white text-xs px-2 py-1 m-2 rounded">${badgeText}</div>
        </div>
        <div class="p-3">
            <h3 class="font-bold text-sm md:text-base line-clamp-1">${game.title}</h3>
            <div class="flex text-xs text-gray-500 mt-1 flex-wrap">
                <span class="bg-apple-light-gray text-gray-700 rounded-full px-2 py-0.5 text-xs mr-1 mb-1">${game.category}</span>
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
 * Initialize search functionality
 */
function initSearch() {
    // Add search function to global scope so Alpine.js can access
    window.searchGames = function(query) {
        if (!query || query.trim() === '') return;
        
        // Redirect to search results page
        window.location.href = `./search.html?q=${encodeURIComponent(query.trim())}`;
    };
}

/**
 * Filter games by search query
 */
function filterGamesByQuery(games, query) {
    if (!query || query.trim() === '' || !games || !Array.isArray(games)) return [];
    
    const searchTerm = query.toLowerCase().trim();
    
    return games.filter(game => {
        // Search in game name, description, and category
        const nameMatch = game.title.toLowerCase().includes(searchTerm);
        const descMatch = game.description && game.description.toLowerCase().includes(searchTerm);
        const categoryMatch = game.category && game.category.toLowerCase().includes(searchTerm);
        
        return nameMatch || descMatch || categoryMatch;
    }).sort((a, b) => {
        // Sort by relevance (name match takes priority)
        const aNameMatch = a.title.toLowerCase().includes(searchTerm);
        const bNameMatch = b.title.toLowerCase().includes(searchTerm);
        
        if (aNameMatch && !bNameMatch) return -1;
        if (!aNameMatch && bNameMatch) return 1;
        return 0;
    });
}

function initFeaturedCarousel(featuredGames) {
    // Limit maximum carousel items to 4
    const maxFeaturedGames = featuredGames.slice(0, 4);
    
    // Get carousel container
    const carousel = document.querySelector('section:nth-of-type(2)'); // Second section is featured games carousel
    if (!carousel) {
        console.error('Featured carousel section not found');
        return;
    }
    
    // Set Alpine.js data - compatible with both v2 and v3 versions
    if (window.Alpine) {
        let data;
        // Try using Alpine.js v3 API
        if (typeof window.Alpine.$data === 'function') {
            data = window.Alpine.$data(carousel);
        } 
        // If not v3, try using v2 way to get data
        else if (carousel.__x) {
            data = carousel.__x.getUnobservedData();
        }
        
        // Only set auto carousel when data is successfully retrieved
        if (data && typeof data.activeSlide !== 'undefined') {
            // If there's only one carousel item, no need for auto carousel
            if (maxFeaturedGames.length > 1) {
                // Set auto carousel
                let intervalId = setInterval(() => {
                    data.activeSlide = (data.activeSlide + 1) % maxFeaturedGames.length;
                }, 5000);
                
                // Pause auto carousel when user interacts
                carousel.addEventListener('mouseenter', () => clearInterval(intervalId));
                carousel.addEventListener('mouseleave', () => {
                    intervalId = setInterval(() => {
                        data.activeSlide = (data.activeSlide + 1) % maxFeaturedGames.length;
                    }, 5000);
                });
            }
        }
    }
    
    // Get carousel content area and indicator area
    const slidesContainer = carousel.querySelector('.relative.rounded-lg');
    if (!slidesContainer) {
        console.error('Featured carousel content container not found');
        return;
    }
    
    const indicators = slidesContainer.querySelector('.absolute.bottom-4.right-4');
    if (!indicators) {
        console.error('Featured carousel indicator container not found');
        return;
    }
    
    // Clear existing content (keep indicator container)
    // Remove carousel items, but keep indicator container
    while (slidesContainer.firstChild) {
        if (slidesContainer.firstChild !== indicators) {
            slidesContainer.removeChild(slidesContainer.firstChild);
        } else {
            break;
        }
    }
    indicators.innerHTML = '';
    
    // Create carousel items for each featured game
    maxFeaturedGames.forEach((game, index) => {
        // Create carousel item
        const slide = document.createElement('div');
        slide.className = 'absolute top-0 left-0 w-full h-full transition-opacity duration-500';
        slide.setAttribute('x-bind:class', `{ 'opacity-100': activeSlide === ${index}, 'opacity-0': activeSlide !== ${index} }`);
        
        slide.innerHTML = `
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
            <img src="${game.image}" alt="${game.title}" class="w-full h-full object-cover">
            <div class="absolute bottom-0 left-0 p-4 md:p-6 text-white z-20">
                <h3 class="text-2xl md:text-3xl font-bold mb-2">${game.title}</h3>
                <p class="mb-4 text-sm md:text-base max-w-xl">${game.description}</p>
                <a href="./games/play.html?id=${game.id}" class="bg-apple-blue hover:bg-blue-600 text-white px-4 py-2 rounded-full inline-block transition-colors">Play Now</a>
            </div>
        `;
        // Add carousel item before indicator
        slidesContainer.insertBefore(slide, indicators);
        
        // Create indicator
        const indicator = document.createElement('button');
        indicator.className = 'w-3 h-3 rounded-full transition-colors duration-300';
        indicator.setAttribute('x-bind:class', `activeSlide === ${index} ? 'bg-white' : 'border border-white bg-transparent'`);
        indicator.setAttribute('x-on:click', `activeSlide = ${index}`);
        indicators.appendChild(indicator);
    });
}

/**
 * Update game category counts
 */
function updateCategoryCount(games) {
    // Check if we're on homepage
    if (!document.querySelector('section h2.text-2xl')) {
        console.log('Not on homepage, no need to update category counts');
        return; // Not on homepage, no need to update category counts
    }
    
    try {
        console.log('Updating game category counts... Total game count:', games.length);
        
        // Calculate game count for each category
        const categoryCounts = {};
        games.forEach(game => {
            if (game.category) {
                const category = game.category.toLowerCase();
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;
            }
        });
        
        console.log('Category count statistics:', categoryCounts);
        
        // Update category cards on page
        const categorySection = document.querySelector('section h2.text-2xl');
        
        if (!categorySection) {
            console.error('Game category section not found');
            return;
        }
        
        const categoryCards = document.querySelectorAll('section h2.text-2xl ~ div.grid > a');
        console.log('Found category card count:', categoryCards.length);
        
        // Category name mapping table (English name to category ID mapping)
        const categoryMapping = {
            'Action Games': 'action',
            'Puzzle Games': 'puzzle',
            'Strategy Games': 'strategy',
            'Sports Games': 'sports',
            'Adventure Games': 'adventure',
            'RPG Games': 'rpg',
            'Shooter Games': 'shooter',
            'Racing Games': 'racing'
        };
        
        categoryCards.forEach(card => {
            const titleElement = card.querySelector('h3.text-xl');
            if (!titleElement) {
                console.warn('Category card title element not found');
                return;
            }
            
            const title = titleElement.textContent.trim();
            console.log('Processing category:', title);
            
            // Use mapping table to find category ID
            const category = categoryMapping[title];
            
            // Update category game count
            if (category) {
                const count = categoryCounts[category] || 0;
                console.log(`Category ${title} (${category}) has ${count} games`);
                
                const countElement = card.querySelector('span.text-apple-blue');
                if (countElement) {
                    countElement.textContent = `${count} games`;
                    console.log(`Updated ${title} game count to ${count}`);
                } else {
                    console.warn(`${title} count display element not found`);
                }
            } else {
                console.warn(`No category ID found for ${title}`);
            }
        });
        
    } catch (error) {
        console.error('Error updating game category counts:', error);
    }
}