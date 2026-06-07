// Admin credentials (3 admins)
const admins = [
    { username: "admin1", password: "pass123" },
    { username: "admin2", password: "pass456" },
    { username: "admin3", password: "pass789" }
];

let isLoggedIn = false;

// Login Function
function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMsg = document.getElementById('loginError');
    
    const admin = admins.find(a => a.username === username && a.password === password);
    
    if (admin) {
        isLoggedIn = true;
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadAdminDashboard();
    } else {
        errorMsg.style.display = 'block';
        errorMsg.textContent = '❌ Username හෝ Password වැරදියි!';
    }
}

// Logout
function logout() {
    isLoggedIn = false;
    document.getElementById('loginPage').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

// Load Admin Dashboard
function loadAdminDashboard() {
    const moviesData = JSON.parse(localStorage.getItem('moviesData')) || [];
    const visitorCount = localStorage.getItem('visitorCount') || 0;
    
    // Update stats
    document.getElementById('totalMovies').textContent = moviesData.length;
    document.getElementById('visitorCount').textContent = visitorCount;
    
    let totalDownloads = 0;
    moviesData.forEach(m => totalDownloads += m.downloads);
    document.getElementById('totalDownloads').textContent = totalDownloads;
    
    // Display movies
    displayAdminMovies(moviesData);
}

// Display movies in admin panel
function displayAdminMovies(movies) {
    const movieList = document.getElementById('adminMovieList');
    movieList.innerHTML = '';
    
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'admin-movie-card';
        card.innerHTML = `
            <button class="delete-btn" onclick="deleteMovie(${movie.id})">
                <i class="fas fa-trash"></i>
            </button>
            <img src="${movie.poster}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:15px;">
            <h3>${movie.title}</h3>
            <p>📅 ${movie.year} | ⬇️ ${movie.downloads}</p>
            <p>Qualities: ${Object.keys(movie.qualities).join(', ')}</p>
            <p>Subtitles: ${Object.keys(movie.subtitles).length || 0} files</p>
        `;
        movieList.appendChild(card);
    });
}

// Delete Movie
function deleteMovie(movieId) {
    if (confirm('ඔබට විශ්වාසද මෙම movie එක delete කරන්න?')) {
        let moviesData = JSON.parse(localStorage.getItem('moviesData')) || [];
        moviesData = moviesData.filter(m => m.id !== movieId);
        localStorage.setItem('moviesData', JSON.stringify(moviesData));
        loadAdminDashboard();
    }
}

// Open Add Movie Modal
function openAddMovieModal() {
    document.getElementById('addMovieModal').style.display = 'block';
}

// Close Modal
function closeModal() {
    document.getElementById('addMovieModal').style.display = 'none';
    // Clear form
    document.getElementById('movieTitle').value = '';
    document.getElementById('movieYear').value = '';
    document.getElementById('moviePoster').value = '';
    document.getElementById('movieDescription').value = '';
    document.getElementById('qualityContainer').innerHTML = `
        <div class="quality-item">
            <input type="text" placeholder="Quality (1080p)" class="quality-name">
            <input type="text" placeholder="Direct Download Link" class="quality-link">
            <button onclick="this.parentElement.remove()" style="background:#ff4757;border:none;color:#fff;padding:5px 10px;border-radius:5px;cursor:pointer;">X</button>
        </div>
    `;
    document.getElementById('subtitleContainer').innerHTML = `
        <div class="subtitle-item">
            <input type="text" placeholder="Subtitle Name (Sinhala Sub)" class="subtitle-name">
            <input type="text" placeholder="Subtitle File Link" class="subtitle-link">
            <button onclick="this.parentElement.remove()" style="background:#ff4757;border:none;color:#fff;padding:5px 10px;border-radius:5px;cursor:pointer;">X</button>
        </div>
    `;
}

// Add Quality Field
function addQualityField() {
    const container = document.getElementById('qualityContainer');
    const qualityItem = document.createElement('div');
    qualityItem.className = 'quality-item';
    qualityItem.innerHTML = `
        <input type="text" placeholder="Quality (720p)" class="quality-name">
        <input type="text" placeholder="Direct Download Link" class="quality-link">
        <button onclick="this.parentElement.remove()" style="background:#ff4757;border:none;color:#fff;padding:5px 10px;border-radius:5px;cursor:pointer;">X</button>
    `;
    container.appendChild(qualityItem);
}

// Add Subtitle Field
function addSubtitleField() {
    const container = document.getElementById('subtitleContainer');
    const subtitleItem = document.createElement('div');
    subtitleItem.className = 'subtitle-item';
    subtitleItem.innerHTML = `
        <input type="text" placeholder="Subtitle Name" class="subtitle-name">
        <input type="text" placeholder="Subtitle File Link" class="subtitle-link">
        <button onclick="this.parentElement.remove()" style="background:#ff4757;border:none;color:#fff;padding:5px 10px;border-radius:5px;cursor:pointer;">X</button>
    `;
    container.appendChild(subtitleItem);
}

// Save Movie
function saveMovie() {
    const title = document.getElementById('movieTitle').value;
    const year = document.getElementById('movieYear').value;
    const poster = document.getElementById('moviePoster').value;
    const description = document.getElementById('movieDescription').value;
    
    // Validate
    if (!title || !year || !poster || !description) {
        alert('කරුණාකර සියලුම fields පුරවන්න!');
        return;
    }
    
    // Get qualities
    const qualityNames = document.getElementsByClassName('quality-name');
    const qualityLinks = document.getElementsByClassName('quality-link');
    const qualities = {};
    
    for (let i = 0; i < qualityNames.length; i++) {
        if (qualityNames[i].value && qualityLinks[i].value) {
            qualities[qualityNames[i].value] = qualityLinks[i].value;
        }
    }
    
    if (Object.keys(qualities).length === 0) {
        alert('අඩුම එක quality එකක්වත් add කරන්න!');
        return;
    }
    
    // Get subtitles
    const subtitleNames = document.getElementsByClassName('subtitle-name');
    const subtitleLinks = document.getElementsByClassName('subtitle-link');
    const subtitles = {};
    
    for (let i = 0; i < subtitleNames.length; i++) {
        if (subtitleNames[i].value && subtitleLinks[i].value) {
            subtitles[subtitleNames[i].value] = subtitleLinks[i].value;
        }
    }
    
    // Create movie object
    const moviesData = JSON.parse(localStorage.getItem('moviesData')) || [];
    const newMovie = {
        id: Date.now(),
        title: title,
        year: year,
        poster: poster,
        description: description,
        downloads: 0,
        qualities: qualities,
        subtitles: subtitles
    };
    
    moviesData.push(newMovie);
    localStorage.setItem('moviesData', JSON.stringify(moviesData));
    
    alert('✅ Movie එක සාර්ථකව add කරා!');
    closeModal();
    loadAdminDashboard();
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('addMovieModal');
    if (event.target === modal) {
        closeModal();
    }
}

// Check if already logged in
window.onload = function() {
    if (isLoggedIn) {
        document.getElementById('loginPage').style.display = 'none';
        document.getElementById('adminDashboard').style.display = 'block';
        loadAdminDashboard();
    }
}