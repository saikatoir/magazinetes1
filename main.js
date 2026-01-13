// MagazineHub - Main Logic

let filteredMagazines = [];
let currentPage = 1;
const magazinesPerPage = 12;

// DEFAULT SORT set to 'newest' so uploads appear at the top immediately
let currentSort = 'newest'; 
let currentCategory = 'all';

// Reader State
let readerPages = [];
let readerCurrentPage = 1;
let readerTotalPages = 1;

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});
// Remove the hardcoded const magazines = [...] array.
let magazines = []; 

// Add your Render URL here
const API_URL = 'https://magazinetes1.onrender.com';

async function initializeApp() {
    try {
        const response = await fetch(`${API_URL}/api/magazines`);
        magazines = await response.json();
        
        // Update all your existing render functions
        renderMagazineGrid(magazines);
        initializeFeaturedCarousel();
        // ... any other init functions you have
    } catch (error) {
        console.error("Connection to backend failed:", error);
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);
async function initializeApp() {
    // 1. Fetch magazines from backend
    try {
        const response = await fetch('/api/magazines');
        const data = await response.json();
        magazines = data;
        
        // Initialize filtered list with everything
        filteredMagazines = [...magazines];
        
        // 2. Ensure sorting is applied (Newest First)
        sortMagazines();
    } catch (error) {
        console.error("Failed to load magazines:", error);
    }

    // 3. Router logic based on current page
    const pageName = window.location.pathname.split('/').pop();

    if (pageName === 'index.html' || pageName === '') {
        initializeHomePage();
    } else if (pageName === 'reader.html') {
        initializeReader();
    } else if (pageName === 'library.html') {
        initializeLibrary();
    }
    
    initializeScrollAnimations();
    initializeSearch();
}

// --- HOME PAGE LOGIC ---

function initializeHomePage() {
    renderMagazineGrid();
    initializeFeaturedCarousel();
    initializeFilters();
    initializeSort();
    initializeLoadMore();
    initializeModal();
}

function renderMagazineGrid() {
    const grid = document.getElementById('magazineGrid');
    if (!grid) return;
    
    // FILTER: Only show magazines that have is_discover enabled
    // Note: If you have old magazines without this column value, 
    // we use !== 0 so they show up by default.
    const discoverMagazines = filteredMagazines.filter(m => m.is_discover !== 0);
    
    const startIndex = (currentPage - 1) * magazinesPerPage;
    const endIndex = startIndex + magazinesPerPage;
    const magazinesToShow = discoverMagazines.slice(startIndex, endIndex);
    
    grid.innerHTML = '';
    
    if (magazinesToShow.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-10 text-gray-500">No magazines found in Discover.</div>';
    }

    magazinesToShow.forEach((magazine, index) => {
        const magazineCard = createMagazineCard(magazine, index);
        grid.appendChild(magazineCard);
    });
    
    const countElement = document.getElementById('magazineCount');
    if (countElement) countElement.textContent = discoverMagazines.length;
    
    animateMagazineCards();
}
function createMagazineCard(magazine, index) {
    const card = document.createElement('div');
    card.className = 'magazine-card rounded-lg overflow-hidden cursor-pointer fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    // Use the exact design provided
    card.innerHTML = `
        <div class="relative group">
            <img src="${magazine.cover}" alt="${magazine.title}" class="w-full h-64 object-cover">
            <div class="magazine-overlay absolute inset-0 flex items-end p-4">
                <div class="text-white">
                    <div class="flex items-center space-x-2 mb-2">
                        <span class="text-xs bg-amber-500 px-2 py-1 rounded capitalize">${magazine.category}</span>
                        <span class="text-xs">${magazine.readingTime || '5 min'}</span>
                    </div>
                    <div class="flex text-amber-400 text-sm mb-1">
                        ★★★★★
                    </div>
                </div>
            </div>
        </div>
        <div class="p-4">
            <h3 class="font-medium text-gray-900 mb-1">${magazine.title}</h3>
            <p class="text-sm text-gray-600 mb-2">${magazine.date || 'Recently Added'}</p>
        </div>
    `;
    
    // --- KEY INTERACTION: CLICK TO READ ---
    // This event listener makes the entire card clickable
    card.addEventListener('click', () => {
        // Redirect to reader page with the specific magazine ID
        window.location.href = `reader.html?id=${magazine.id}`;
    });
    
    return card;
}

function initializeSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        // Force dropdown to show "Newest" selected
        sortSelect.value = 'newest';
        
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            sortMagazines();
            renderMagazineGrid();
        });
    }
}

function sortMagazines() {
    // Logic to handle sorting
    if (currentSort === 'newest') {
        // Sort by ID descending (High IDs are newer in SQL)
        filteredMagazines.sort((a, b) => b.id - a.id);
    } else if (currentSort === 'date') {
        filteredMagazines.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (currentSort === 'title') {
        filteredMagazines.sort((a, b) => a.title.localeCompare(b.title));
    } else {
        // Popularity (fallback to rating)
        filteredMagazines.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
}

function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-tag');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Update UI
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Update Logic
            currentCategory = button.dataset.category;
            
            if (currentCategory === 'all') {
                filteredMagazines = [...magazines];
            } else {
                filteredMagazines = magazines.filter(m => 
                    m.category.toLowerCase() === currentCategory.toLowerCase() || 
                    (m.tags && m.tags.includes(currentCategory))
                );
            }
            sortMagazines(); // Keep sort preference when filtering
            currentPage = 1;
            renderMagazineGrid();
        });
    });
}

function initializeLoadMore() {
    const btn = document.getElementById('loadMoreBtn');
    if(btn) btn.addEventListener('click', () => { currentPage++; renderMagazineGrid(); });
}

function initializeSearch() {
    const input = document.getElementById('searchInput');
    if(input) {
        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            if(!term) filteredMagazines = [...magazines];
            else filteredMagazines = magazines.filter(m => 
                m.title.toLowerCase().includes(term) || m.category.toLowerCase().includes(term)
            );
            sortMagazines();
            renderMagazineGrid();
        });
    }
}

// --- READER LOGIC ---

async function initializeReader() {
    // Get ID from URL (e.g., reader.html?id=5)
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if(!id) {
        console.error("No magazine ID found in URL");
        return;
    }

    try {
        // Fetch specific magazine details
        const res = await fetch(`/api/magazines/${id}`);
        if (!res.ok) throw new Error("Magazine not found");
        
        const magazine = await res.json();
        
        // Update Title
        const titleEl = document.querySelector('.reader-header h1');
        if(titleEl) titleEl.textContent = magazine.title;
        
        // Load Content
        const content = document.getElementById('magazineContent');

        if(magazine.pdf_path) {
            // IF PDF: Show iframe
            content.innerHTML = `
                <iframe src="${magazine.pdf_path}" 
                        style="width:100%; height:100vh; border:none;" 
                        title="${magazine.title}">
                </iframe>`;
                
            // Hide standard pagination controls since PDF has its own
            const nav = document.querySelector('.page-navigation');
            if(nav) nav.style.display = 'none';
        } else {
            // IF TEXT (Fallback): Show description
            content.innerHTML = `
                <article class="magazine-content">
                    <h1>${magazine.title}</h1>
                    <img src="${magazine.cover}" style="max-width:300px; margin: 20px auto; display:block;">
                    <p>${magazine.description}</p>
                </article>`;
        }
    } catch(e) {
        console.error(e);
        const content = document.getElementById('magazineContent');
        if(content) content.innerHTML = `<div class="text-center p-10">Error loading magazine.</div>`;
    }
}

// --- ANIMATIONS & UTILS ---

function animateMagazineCards() {
    if (typeof anime !== 'undefined') {
        anime({
            targets: '.magazine-card',
            opacity: [0, 1],
            translateY: [30, 0],
            delay: anime.stagger(100)
        });
    }
}

function initializeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// Placeholder functions for carousel and modals
function initializeFeaturedCarousel() {
    if(typeof Splide !== 'undefined' && document.querySelector('#featured-carousel')) {
        new Splide('#featured-carousel', { type: 'loop', perPage: 4, autoplay: true, gap: '1rem', breakpoints:{768:{perPage:2}} }).mount();
    }
}
// Add this to your initializeApp or initializeHomePage function
async function initializeHomePage() {
    renderMagazineGrid();
    renderFeaturedCarousel(); // New dynamic function
    initializeFilters();
    initializeSort();
    // ... rest of your code
}

function renderFeaturedCarousel() {
    const splideList = document.querySelector('#featured-carousel .splide__list');
    if (!splideList) return;

    // Filter magazines for the carousel 
    // (e.g., show the 5 newest magazines that have is_discover enabled)
    const featuredMags = magazines
        .filter(m => m.is_discover !== 0)
        .slice(0, 5);

    if (featuredMags.length === 0) return;

    // Clear existing placeholders
    splideList.innerHTML = '';

    featuredMags.forEach(mag => {
        const slide = document.createElement('li');
        slide.className = 'splide__slide';
        slide.innerHTML = `
            <div class="relative group cursor-pointer overflow-hidden rounded-xl h-64 shadow-lg" onclick="window.location.href='reader.html?id=${mag.id}'">
                <img src="${mag.cover}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <span class="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">${mag.category}</span>
                    <h2 class="text-white font-display text-2xl font-bold">${mag.title}</h2>
                    <p class="text-gray-300 text-sm mt-1">Featured Issue • ${mag.date}</p>
                </div>
            </div>
        `;
        splideList.appendChild(slide);
    });

    // Re-initialize Splide after adding dynamic content
    new Splide('#featured-carousel', {
        type: 'loop',
        perPage: 3,
        gap: '2rem',
        autoplay: true,
        interval: 4000,
        arrows: false,
        pagination: true,
        breakpoints: {
            1024: { perPage: 2 },
            640: { perPage: 1 }
        }
    }).mount();
}
function initializeModal() {} 
function initializeLibrary() {}
