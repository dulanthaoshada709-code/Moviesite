// ============================================
// MOVIELK - MAIN JAVASCRIPT (DATABASE VERSION)
// ============================================

// Initialize AOS
AOS.init({
    duration: 1000,
    once: true,
    mirror: false
});

// Global Variables
let moviesData = [];
let filteredMovies = [];
let currentSlide = 0;
const MOVIES_PER_PAGE = 12;
let currentPage = 1;
let visitorCount = 0;

// ============================================
// LOAD MOVIES FROM CLOUD DATABASE
// ============================================

async function loadMovies() {
    console.log('🚀 Loading MovieLK from Cloud...');
    showSkeletonLoader();
    
    try {
        // Load from cloud database
        moviesData = await db.getMovies();
        
        // Generate sample movies if empty
        if (!moviesData || moviesData.length === 0) {
            console.log('📦 No movies found, generating samples...');
            moviesData = generateSampleMovies();
            await db.saveMovies(moviesData);
            console.log('✅ Sample movies saved to cloud');
        }
        
        // Track visitor
        visitorCount = await db.incrementVisitor();
        
        // Update UI
        updateStats();
        displayHeroCarousel();
        displayTopDownloads();
        
        // Show movies after loading animation
        setTimeout(() => {
            hideSkeletonLoader();
            displayMovies(moviesData.slice(0, MOVIES_PER_PAGE));
            
            if (moviesData.length > MOVIES_PER_PAGE) {
                document.getElementById('loadMoreContainer').style.display = 'block';
            }
        }, 1500);
        
        setupLiveSearch();
        
        console.log(`✅ Loaded ${moviesData.length} movies successfully!`);
        
    } catch (error) {
        console.error('❌ Cloud load failed:', error);
        
        // Fallback to localStorage
        const localData = localStorage.getItem('moviesData');
        if (localData) {
            console.log('💾 Using local backup data');
            moviesData = JSON.parse(localData);
            updateStats();
            displayHeroCarousel();
            displayTopDownloads();
            hideSkeletonLoader();
            displayMovies(moviesData.slice(0, MOVIES_PER_PAGE));
        } else {
            // No data at all
            document.getElementById('allMovies').innerHTML = `
                <div style="text-align:center;grid-column:1/-1;padding:80px 20px;">
                    <i class="fas fa-cloud-upload-alt" style="font-size:5em;opacity:0.2;display:block;margin-bottom:20px;"></i>
                    <h3 style="opacity:0.7;margin-bottom:10px;">Database එකට connect වෙන්නේ නෑ 😔</h3>
                    <p style="opacity:0.5;">පස්සේ try කරන්න</p>
                    <button onclick="location.reload()" style="margin-top:20px;padding:10px 30px;background:var(--primary);border:none;border-radius:25px;color:white;cursor:pointer;">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        }
        
        document.getElementById('skeletonLoader').style.display = 'none';
    }
}

// ============================================
// GENERATE SAMPLE MOVIES
// ============================================

function generateSampleMovies() {
    const categories = ['action', 'drama', 'comedy', 'horror', 'romance', 'scifi'];
    const qualities = {
        '4K': '#',
        '1080p': '#',
        '720p': '#',
        '480p': '#'
    };
    
    const sampleTitles = [
        'The Matrix Resurrections', 'Avatar 3', 'Spider-Man: Beyond',
        'Jurassic World', 'Fast & Furious 10', 'John Wick 5',
        'Black Panther 2', 'Doctor Strange 3', 'Thor 5',
        'Guardians Galaxy 4', 'Iron Man 4', 'Captain America 5',
        'Ant-Man 4', 'Deadpool 3', 'Venom 3',
        'Aquaman 3', 'Wonder Woman 3', 'Flash 2',
        'Batman 2', 'Superman Legacy'
    ];
    
    return sampleTitles.map((title, index) => ({
        id: index + 1,
        title: title,
        year: (2023 + Math.floor(index / 5)).toString(),
        poster: `https://picsum.photos/400/600?random=${index + 10}`,
        description: `This is a sample description for ${title}. An exciting movie that you must watch!`,
        category: categories[index % categories.length],
        downloads: Math.floor(Math.random() * 20000) + 1000,
        rating: (Math.random() * 2 + 3).toFixed(1),
        qualities: qualities,
        subtitles: {
            'Sinhala Sub': '#',
            'English Sub': '#'
        },
        addedDate: new Date().toISOString()
    }));
}

// ============================================
// UPDATE STATS
// ============================================

function updateStats() {
    document.getElementById('totalMovieCount').textContent = moviesData.length;
    
    let totalDownloads = moviesData.reduce((sum, movie) => sum + (movie.downloads || 0), 0);
    document.getElementById('totalDownloadCount').textContent = formatNumber(totalDownloads);
    document.getElementById('visitorCount').textContent = formatNumber(visitorCount);
}

// ============================================
// FORMAT NUMBER
// ============================================

function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// ============================================
// HERO CAROUSEL
// ============================================

function displayHeroCarousel() {
    const carousel = document.getElementById('heroCarousel');
    const dotsContainer = document.getElementById('carouselDots');
    
    if (!carousel || !dotsContainer) return;
    
    const topMovies = [...moviesData]
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 5);
    
    if (topMovies.length === 0) return;
    
    carousel.innerHTML = topMovies.map((movie, index) => `
        <div class="hero-slide ${index === 0 ? 'active' : ''}">
            <img src="${movie.poster}" alt="${movie.title}" 
                 onerror="this.src='https://via.placeholder.com/1200x500/1a1a2e/fff?text=${encodeURIComponent(movie.title)}'">
            <div class="hero-overlay">
                <h2 class="gradient-text">${movie.title}</h2>
                <p>${movie.description?.substring(0, 100) || 'No description'}...</p>
                <button class="hero-btn" onclick="viewMovie(${movie.id})">
                    <i class="fas fa-play"></i> Watch Now
                </button>
            </div>
        </div>
    `).join('');
    
    dotsContainer.innerHTML = topMovies.map((_, index) => `
        <div class="dot ${index === 0 ? 'active' : ''}" 
             onclick="goToSlide(${index})"></div>
    `).join('');
}

function changeSlide(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}

function goToSlide(index) {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    currentSlide = index;
    
    slides.forEach(s => s.classList.remove('active'));
    dots.forEach(d => d.classList.remove('active'));
    
    slides[index].classList.add('active');
    dots[index].classList.add('active');
}

// Auto-slide every 5 seconds
setInterval(() => {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 1) {
        changeSlide(1);
    }
}, 5000);

// ============================================
// TOP DOWNLOADS MARQUEE
// ============================================

function displayTopDownloads() {
    const container = document.getElementById('topDownloads');
    if (!container) return;
    
    const topMovies = [...moviesData]
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, 10);
    
    if (topMovies.length === 0) return;
    
    // Duplicate for seamless scroll
    const duplicated = [...topMovies, ...topMovies];
    
    container.innerHTML = duplicated.map(movie => createMovieCard(movie)).join('');
}

// ============================================
// CREATE MOVIE CARD HTML
// ============================================

function createMovieCard(movie) {
    const qualityKeys = Object.keys(movie.qualities || {});
    const bestQuality = qualityKeys[qualityKeys.length - 1] || 'HD';
    
    return `
        <div class="movie-card" onclick="viewMovie(${movie.id})" 
             data-year="${movie.year || ''}" 
             data-category="${movie.category || ''}">
            <div class="card-img-container">
                <img src="${movie.poster}" 
                     alt="${movie.title}" 
                     loading="lazy"
                     onerror="this.src='https://via.placeholder.com/300x450/1a1a2e/fff?text=No+Image'">
                <div class="card-overlay">
                    <span>👁️ View Details</span>
                </div>
                <span class="card-badge">${bestQuality}</span>
            </div>
            <div class="card-info">
                <h3 title="${movie.title}">${movie.title}</h3>
                <div class="card-meta">
                    <span>📅 ${movie.year || 'N/A'}</span>
                    <span class="card-rating">⭐ ${movie.rating || '4.5'}</span>
                </div>
                <div class="card-meta" style="margin-top:5px;">
                    <span>⬇️ ${formatNumber(movie.downloads)}</span>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// DISPLAY MOVIES GRID
// ============================================

function displayMovies(movies) {
    const container = document.getElementById('allMovies');
    if (!container) return;
    
    if (!movies || movies.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;grid-column:1/-1;padding:50px;">
                <i class="fas fa-search" style="font-size:3em;opacity:0.3;display:block;margin-bottom:15px;"></i>
                <h3 style="opacity:0.7;">Movies හම්බුනේ නෑ 😔</h3>
            </div>
        `;
        return;
    }
    
    container.innerHTML = movies.map(movie => createMovieCard(movie)).join('');
    container.classList.add('stagger-children');
}

// ============================================
// SKELETON LOADER
// ============================================

function showSkeletonLoader() {
    const skeleton = document.getElementById('skeletonLoader');
    const moviesGrid = document.getElementById('allMovies');
    
    if (skeleton) {
        skeleton.style.display = 'grid';
        skeleton.innerHTML = Array(8).fill(0).map((_, i) => 
            `<div class="skeleton-card shimmer" style="animation-delay:${i * 0.1}s;"></div>`
        ).join('');
    }
    
    if (moviesGrid) {
        moviesGrid.style.display = 'none';
    }
}

function hideSkeletonLoader() {
    const skeleton = document.getElementById('skeletonLoader');
    const moviesGrid = document.getElementById('allMovies');
    
    if (skeleton) skeleton.style.display = 'none';
    if (moviesGrid) moviesGrid.style.display = 'grid';
}

// ============================================
// LOAD MORE MOVIES
// ============================================

async function loadMoreMovies() {
    currentPage++;
    const start = (currentPage - 1) * MOVIES_PER_PAGE;
    const end = start + MOVIES_PER_PAGE;
    
    // Reload from cloud to get latest
    moviesData = await db.getMovies();
    
    const nextMovies = moviesData.slice(start, end);
    
    if (nextMovies.length > 0) {
        const container = document.getElementById('allMovies');
        nextMovies.forEach(movie => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = createMovieCard(movie);
            container.appendChild(tempDiv.firstChild);
        });
    }
    
    if (end >= moviesData.length) {
        document.getElementById('loadMoreContainer').style.display = 'none';
    }
}

// ============================================
// LIVE SEARCH
// ============================================

function setupLiveSearch() {
    const searchBar = document.getElementById('searchBar');
    const liveResults = document.getElementById('liveResults');
    
    if (!searchBar || !liveResults) return;
    
    let searchTimeout;
    
    searchBar.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(async () => {
            const term = e.target.value.toLowerCase().trim();
            
            if (term.length < 2) {
                liveResults.classList.remove('active');
                return;
            }
            
            // Search in loaded movies
            const results = moviesData.filter(movie => 
                movie.title.toLowerCase().includes(term) ||
                (movie.description && movie.description.toLowerCase().includes(term))
            ).slice(0, 5);
            
            if (results.length > 0) {
                liveResults.innerHTML = results.map(movie => `
                    <div class="live-result-item" onclick="viewMovie(${movie.id})"
                         style="display:flex;align-items:center;gap:15px;padding:12px 15px;cursor:pointer;transition:0.3s;"
                         onmouseover="this.style.background='rgba(108,92,231,0.2)'"
                         onmouseout="this.style.background='transparent'">
                        <img src="${movie.poster}" 
                             style="width:40px;height:60px;object-fit:cover;border-radius:5px;"
                             onerror="this.src='https://via.placeholder.com/40x60/1a1a2e/fff'">
                        <div>
                            <strong>${highlightMatch(movie.title, term)}</strong>
                            <small style="display:block;color:var(--text-secondary);">${movie.year} | ⭐ ${movie.rating}</small>
                        </div>
                    </div>
                `).join('');
                liveResults.classList.add('active');
            } else {
                liveResults.innerHTML = `
                    <div style="padding:20px;text-align:center;">
                        <p style="opacity:0.7;">Movie හම්බුනේ නෑ 😔</p>
                    </div>
                `;
                liveResults.classList.add('active');
            }
        }, 300);
    });
    
    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-wrapper')) {
            liveResults.classList.remove('active');
        }
    });
}

function highlightMatch(text, term) {
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<span style="color:#ffd93d;">$1</span>');
}

// ============================================
// SEARCH FUNCTION
// ============================================

async function searchMovies() {
    const term = document.getElementById('searchBar').value.toLowerCase().trim();
    
    if (!term) {
        // Reset to all movies
        moviesData = await db.getMovies();
        displayMovies(moviesData.slice(0, MOVIES_PER_PAGE));
        document.getElementById('loadMoreContainer').style.display = 
            moviesData.length > MOVIES_PER_PAGE ? 'block' : 'none';
        return;
    }
    
    // Search
    filteredMovies = moviesData.filter(movie => 
        movie.title.toLowerCase().includes(term) ||
        (movie.description && movie.description.toLowerCase().includes(term))
    );
    
    displayMovies(filteredMovies);
    document.getElementById('loadMoreContainer').style.display = 'none';
}

// ============================================
// FILTER BY CATEGORY/YEAR
// ============================================

function filterMovies(filter) {
    // Update active pill
    document.querySelectorAll('.pill').forEach(p => {
        p.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    if (filter === 'all') {
        displayMovies(moviesData.slice(0, MOVIES_PER_PAGE));
        document.getElementById('loadMoreContainer').style.display = 
            moviesData.length > MOVIES_PER_PAGE ? 'block' : 'none';
        return;
    }
    
    filteredMovies = moviesData.filter(movie => 
        movie.year === filter || movie.category === filter
    );
    
    displayMovies(filteredMovies);
    document.getElementById('loadMoreContainer').style.display = 'none';
}

// ============================================
// CHANGE VIEW (GRID/LIST)
// ============================================

function changeView(view) {
    const grid = document.getElementById('allMovies');
    const buttons = document.querySelectorAll('.view-btn');
    
    buttons.forEach(b => b.classList.remove('active'));
    
    if (event && event.target) {
        const btn = event.target.closest('.view-btn');
        if (btn) btn.classList.add('active');
    }
    
    if (view === 'list') {
        grid.classList.add('list-view');
    } else {
        grid.classList.remove('list-view');
    }
}

// ============================================
// VIEW MOVIE DETAILS
// ============================================

function viewMovie(id) {
    window.location.href = `movie.html?id=${id}`;
}

// ============================================
// SCROLL TO TOP
// ============================================

function scrollToTop() {
    window.scrollTo({ 
        top: 0, 
        behavior: 'smooth' 
    });
}

// Show/Hide back to top button
window.addEventListener('scroll', () => {
    const btn = document.querySelector('.back-to-top');
    if (btn) {
        if (window.scrollY > 500) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }
});

// ============================================
// THEME TOGGLE
// ============================================

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const icon = document.querySelector('.theme-toggle i');
    if (icon) {
        if (document.body.classList.contains('light-theme')) {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    // Save theme preference
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
}

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        const icon = document.querySelector('.theme-toggle i');
        if (icon) icon.className = 'fas fa-sun';
    }
}

// ============================================
// INITIALIZE
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadMovies();
    console.log('🎬 MovieLK Initialized');
    console.log('🗄️ Database:', typeof db !== 'undefined' ? 'Connected ✓' : 'Not Connected ✗');
});

// ============================================
// SERVICE WORKER FOR OFFLINE CACHE
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('📦 Service Worker registered');
        }).catch(error => {
            console.log('❌ Service Worker registration failed:', error);
        });
    });
}

// ============================================
// ERROR HANDLING
// ============================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});