// Get movie ID from URL
const urlParams = new URLSearchParams(window.location.search);
const movieId = parseInt(urlParams.get('id'));

function loadMovieDetail() {
    const moviesData = JSON.parse(localStorage.getItem('moviesData')) || [];
    const movie = moviesData.find(m => m.id === movieId);
    
    if (!movie) {
        document.getElementById('movieDetail').innerHTML = '<h2>Movie එක හම්බුනේ නෑ 😔</h2>';
        return;
    }
    
    const detailContainer = document.getElementById('movieDetail');
    
    // Generate quality buttons
    let qualityButtons = '';
    for (let quality in movie.qualities) {
        qualityButtons += `
            <a href="${movie.qualities[quality]}" class="quality-btn" download>
                📥 ${quality}
            </a>
        `;
    }
    
    // Generate subtitle buttons
    let subtitleButtons = '';
    for (let subName in movie.subtitles) {
        subtitleButtons += `
            <a href="${movie.subtitles[subName]}" class="subtitle-btn" download>
                📝 ${subName}
            </a>
        `;
    }
    
    detailContainer.innerHTML = `
        <div class="movie-poster-large">
            <img src="${movie.poster}" alt="${movie.title}">
        </div>
        <div class="movie-info-detail">
            <h1>${movie.title}</h1>
            <p class="year">📅 ${movie.year} | ⬇️ Downloads: ${movie.downloads}</p>
            <p class="description">${movie.description}</p>
            
            <div class="download-section">
                <h3>📥 Download Movie</h3>
                <div class="quality-buttons">
                    ${qualityButtons || '<p>No download links available</p>'}
                </div>
            </div>
            
            ${Object.keys(movie.subtitles).length > 0 ? `
            <div class="subtitle-section">
                <h3>📝 Subtitles</h3>
                <div class="subtitle-buttons">
                    ${subtitleButtons}
                </div>
            </div>
            ` : ''}
        </div>
    `;
    
    // Increment download count when clicked
    document.querySelectorAll('.quality-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            movie.downloads++;
            localStorage.setItem('moviesData', JSON.stringify(moviesData));
        });
    });
}

window.onload = loadMovieDetail;