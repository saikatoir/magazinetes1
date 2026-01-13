// MagazineHub - Main JavaScript (Merged Production Version)

let magazines = []; // Will be populated from the database

// --- INITIALIZATION ---
async function initializeApp() {
    console.log('Initializing MagazineHub...');
    await fetchMagazines(); // Load from Render Backend
    initializeFilters();
    initializeSort();
    setupSearch();
    initializeScrollAnimations();
}

// --- BACKEND CONNECTION ---
async function fetchMagazines() {
    try {
        const response = await fetch('/api/magazines');
        magazines = await response.json();
        
        // Update UI
        renderMagazineGrid(magazines);
        renderFeaturedCarousel();
        updateMagazineCount(magazines.length);
    } catch (err) {
        console.error("Failed to fetch from Render:", err);
        // Fallback to empty state if server is down
        renderMagazineGrid([]);
    }
}

// --- DYNAMIC RENDERING ---
function renderFeaturedCarousel() {
    const list = document.getElementById('featuredList');
    if (!list) return;

    // Filter for magazines to show in the top slider
    const featured = magazines.slice(0, 5); 
    
    if (featured.length === 0) {
        list.innerHTML = '<li class="splide__slide"><div class="h-48 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">Upload magazines to see them here</div></li>';
        return;
    }

    list.innerHTML = featured.map(mag => `
        <li class="splide__slide">
            <div class="relative group cursor-pointer overflow-hidden rounded-xl h-64 shadow-lg" onclick="openMagazineModal(${mag.id})">
                <img src="${mag.cover}" class="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700">
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
                    <span class="text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">${mag.category}</span>
                    <h2 class="text-white font-display text-2xl font-bold">${mag.title}</h2>
                </div>
            </div>
        </li>
    `).join('');

    // Re-init Splide
    new Splide('#featured-carousel', {
        type: 'loop',
        perPage: 3,
        gap: '2rem',
        autoplay: true,
        breakpoints: { 1024: { perPage: 2 }, 640: { perPage: 1 } }
    }).mount();
}

function renderMagazineGrid(data) {
    const grid = document.getElementById('magazineGrid');
    if (!grid) return;

    if (data.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center py-12 text-gray-400">No magazines found matching your criteria.</div>';
        return;
    }

    grid.innerHTML = data.map(mag => `
        <div class="magazine-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 fade-in cursor-pointer" onclick="openMagazineModal(${mag.id})">
            <div class="relative h-72 overflow-hidden">
                <img src="${mag.cover}" alt="${mag.title}" class="w-full h-full object-cover">
                <div class="magazine-overlay absolute inset-0 flex items-center justify-center p-6">
                    <button class="bg-white text-gray-900 px-6 py-2 rounded-full font-semibold text-sm transform translate-y-4 group-hover:translate-y-0 transition-transform">View Details</button>
                </div>
            </div>
            <div class="p-5">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-xs font-bold uppercase tracking-wider text-amber-600">${mag.category}</span>
                    <span class="text-xs text-gray-400">${mag.date}</span>
                </div>
                <h3 class="font-display text-xl font-bold text-gray-900 mb-1">${mag.title}</h3>
                <p class="text-gray-500 text-sm">${mag.readingTime || '15 min'} read</p>
            </div>
        </div>
    `).join('');
}

// --- INTERACTIVE FEATURES (MODALS) ---
function openMagazineModal(id) {
    const mag = magazines.find(m => m.id === id);
    if (!mag) return;

    document.getElementById('modalTitle').textContent = mag.title;
    document.getElementById('modalCategory').textContent = mag.category;
    document.getElementById('modalDate').textContent = mag.date;
    document.getElementById('modalDescription').textContent = mag.description || "Experience the latest insights and trends in this featured issue.";
    document.getElementById('modalCover').src = mag.cover;
    
    // Set the "Read Now" link to use the PDF path from database
    const readBtn = document.getElementById('modalReadNow');
    readBtn.onclick = () => {
        window.location.href = `reader.html?id=${mag.id}`;
    };

    const modal = document.getElementById('magazineModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeMagazineModal() {
    const modal = document.getElementById('magazineModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// --- UTILITIES ---
function updateMagazineCount(count) {
    const el = document.getElementById('magazineCount');
    if (el) el.textContent = count;
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = magazines.filter(m => 
            m.title.toLowerCase().includes(term) || 
            m.category.toLowerCase().includes(term)
        );
        renderMagazineGrid(filtered);
    });
}

function initializeFilters() {
    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            document.querySelectorAll('.filter-tag').forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            
            const category = tag.dataset.category;
            const filtered = category === 'all' ? magazines : magazines.filter(m => m.category.toLowerCase() === category);
            renderMagazineGrid(filtered);
        });
    });
}

function initializeScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

function initializeSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;
    sortSelect.addEventListener('change', (e) => {
        let sorted = [...magazines];
        if (e.target.value === 'title') sorted.sort((a, b) => a.title.localeCompare(b.title));
        if (e.target.value === 'newest') sorted.reverse();
        renderMagazineGrid(sorted);
    });
}

// Start everything
document.addEventListener('DOMContentLoaded', initializeApp);
