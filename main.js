/** * MagazineHub - Unified Main Logic
 * Handles API Fetching, Rendering, and Persistent Dark Mode
 */

let magazines = [];
let filteredMagazines = [];
let currentCategory = 'all'; 
let currentSort = 'newest';

// 1. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    setupDarkMode();
    initializeApp();
});

async function initializeApp() {
    console.log("Connecting to server...");
    try {
        const response = await fetch('/api/magazines');
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data received from server:", data);

        // Ensure data is an array
        magazines = Array.isArray(data) ? data : [];
        filteredMagazines = [...magazines];
        
        sortMagazines();
        renderHomePage();
        
        // Initialize UI listeners
        initializeSearch();
        initializeFilters();
        initializeSort();

    } catch (error) {
        console.error("Connection Failed:", error);
        const grid = document.getElementById('magazineGrid');
        if(grid) {
            grid.innerHTML = `
                <div class="col-span-full text-center py-20 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                    <p class="text-gray-500 dark:text-gray-400 font-medium">Unable to connect to the magazine library.</p>
                    <p class="text-xs text-gray-400 mt-2">Error: ${error.message}</p>
                    <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm">Retry Connection</button>
                </div>`;
        }
    }
}

// 2. CORE RENDERING
function renderHomePage() {
    renderFeaturedCarousel();
    renderMagazineGrid();
}

function renderMagazineGrid() {
    const grid = document.getElementById('magazineGrid');
    if (!grid) return;

    // Filter by Region Category (Bangladeshi / International)
    let displayList = (currentCategory === 'all') 
        ? filteredMagazines 
        : filteredMagazines.filter(m => m.category === currentCategory);

    if (displayList.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-20 text-gray-400">No magazines found in this section.</div>';
        return;
    }

    grid.innerHTML = displayList.map((mag) => {
        const rawPrice = Number(mag.price) || 0;
        const discountPercent = Number(mag.discount) || 0;
        const finalPrice = (rawPrice - (rawPrice * (discountPercent / 100))).toFixed(2);

        return `
        <div class="magazine-card group bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer" 
             onclick="window.location.href='reader.html?id=${mag.id}'">
            
            <div class="relative aspect-[3/4] overflow-hidden">
                <img src="${mag.cover}" alt="${mag.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                
                ${discountPercent > 0 ? `
                    <div class="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg">
                        ${discountPercent}% OFF
                    </div>
                ` : ''}
            </div>

            <div class="p-4">
                <div class="flex justify-between items-start mb-1">
                    <span class="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">${mag.category}</span>
                    <span class="text-[10px] text-gray-400 font-mono">${mag.readingTime || '10 min'}</span>
                </div>
                <h3 class="font-display text-lg font-bold text-gray-900 dark:text-white line-clamp-1 mb-3">${mag.title}</h3>
                
                <div class="flex items-center justify-between mt-2 pt-3 border-t border-gray-50 dark:border-slate-800">
                    <div class="flex flex-col">
                        <span class="text-base font-bold text-gray-900 dark:text-white">
                            ${finalPrice > 0 ? '$' + finalPrice : '<span class="text-green-500">FREE</span>'}
                        </span>
                        ${discountPercent > 0 ? `
                            <span class="text-[11px] text-gray-400 line-through">$${rawPrice.toFixed(2)}</span>
                        ` : ''}
                    </div>
                    <button class="bg-slate-900 dark:bg-amber-500 text-white dark:text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition">
                        Read
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');

    // Update count if element exists
    const countEl = document.getElementById('magazineCount');
    if(countEl) countEl.textContent = displayList.length;
}

// 3. CAROUSEL
function renderFeaturedCarousel() {
    const splideList = document.querySelector('#featured-carousel .splide__list');
    if (!splideList || magazines.length === 0) return;

    const featured = [...magazines].sort((a,b) => b.id - a.id).slice(0, 6);

    splideList.innerHTML = featured.map(mag => `
        <li class="splide__slide p-2">
            <div class="relative rounded-xl overflow-hidden h-64 shadow-md cursor-pointer group" onclick="window.location.href='reader.html?id=${mag.id}'">
                <img src="${mag.cover}" class="w-full h-full object-cover">
                <div class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <h4 class="text-white font-bold text-sm truncate">${mag.title}</h4>
                    <p class="text-amber-400 text-[10px] font-bold uppercase">${mag.category}</p>
                </div>
            </div>
        </li>
    `).join('');

    if (window.Splide) {
        new Splide('#featured-carousel', {
            type: 'loop',
            perPage: 4,
            gap: '1rem',
            autoplay: true,
            arrows: false,
            pagination: false,
            breakpoints: { 1024: { perPage: 3 }, 768: { perPage: 2 }, 480: { perPage: 1.5 } }
        }).mount();
    }
}

// 4. UTILITIES
function setupDarkMode() {
    const html = document.documentElement;
    const toggleBtn = document.getElementById('themeToggle');
    
    // Initial Load Check
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        html.classList.add('dark');
    } else {
        html.classList.remove('dark');
    }

    if(toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            html.classList.toggle('dark');
            const isDark = html.classList.contains('dark');
            localStorage.theme = isDark ? 'dark' : 'light';
        });
    }
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-tag');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('bg-amber-500', 'text-white'));
            button.classList.add('bg-amber-500', 'text-white');
            currentCategory = button.dataset.category;
            renderMagazineGrid();
        });
    });
}

function initializeSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            sortMagazines();
            renderMagazineGrid();
        });
    }
}

function sortMagazines() {
    if (currentSort === 'newest') {
        filteredMagazines.sort((a, b) => b.id - a.id);
    } else if (currentSort === 'title') {
        filteredMagazines.sort((a, b) => a.title.localeCompare(b.title));
    }
}

function initializeSearch() {
    const input = document.getElementById('searchInput');
    if(input) {
        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            filteredMagazines = magazines.filter(m => 
                m.title.toLowerCase().includes(term) || 
                m.category.toLowerCase().includes(term)
            );
            renderMagazineGrid();
        });
    }
}
