// ============================================
// JSONBIN.IO DATABASE CONFIGURATION
// ============================================

// ⚠️ මේ values ඔයාගේ ඒවාට change කරන්න!
const CONFIG = {
    API_KEY: '$2a$10$2VXTKn3xX5Xm.pvCUrKSQ.5LmgPTBCeOkkyBVgW2v2CsWIpDHB5uq', // උඩින් copy කරපු API key එක
    BIN_ID: '6a259d23f5f4af5e29c7001b',          // Bin ID එක
    BASE_URL: 'https://api.jsonbin.io/v3/b'
};

class MovieDatabase {
    constructor() {
        this.cache = null;
        this.lastFetch = null;
        this.cacheTimeout = 300000; // 5 minutes
    }
    
    // ============ GET ALL MOVIES ============
    async getMovies() {
        // Cache check (5 min වලින් අඩු නම් cache use කරන්න)
        if (this.cache && this.lastFetch && (Date.now() - this.lastFetch < this.cacheTimeout)) {
            console.log('📦 Loading from cache...');
            return this.cache;
        }
        
        try {
            console.log('☁️ Fetching from cloud...');
            
            const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.API_KEY,
                    'X-Bin-Meta': 'false' // Metadata ඕන නෑ
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();
            const movies = data.record.movies || [];
            
            // Update cache
            this.cache = movies;
            this.lastFetch = Date.now();
            
            // Local backup save කරන්න
            localStorage.setItem('moviesData', JSON.stringify(movies));
            
            console.log(`✅ Loaded ${movies.length} movies from cloud`);
            return movies;
            
        } catch (error) {
            console.error('❌ Cloud fetch failed:', error);
            
            // Fallback to localStorage
            const localData = localStorage.getItem('moviesData');
            if (localData) {
                console.log('💾 Using local backup data');
                return JSON.parse(localData);
            }
            
            // Nothing found
            console.log('📦 Returning empty array');
            return [];
        }
    }
    
    // ============ SAVE ALL MOVIES ============
    async saveMovies(movies) {
        try {
            console.log('☁️ Saving to cloud...');
            
            const payload = {
                movies: movies,
                lastUpdated: new Date().toISOString()
            };
            
            const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.API_KEY,
                    'X-Bin-Versioning': 'false'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Update cache
            this.cache = movies;
            this.lastFetch = Date.now();
            
            // Local backup
            localStorage.setItem('moviesData', JSON.stringify(movies));
            
            console.log(`✅ Saved ${movies.length} movies to cloud`);
            return { success: true };
            
        } catch (error) {
            console.error('❌ Cloud save failed:', error);
            
            // Offline වුනත් local save කරන්න
            localStorage.setItem('moviesData', JSON.stringify(movies));
            
            return { success: false, error: error.message };
        }
    }
    
    // ============ ADD MOVIE ============
    async addMovie(movie) {
        console.log('➕ Adding new movie:', movie.title);
        
        const movies = await this.getMovies();
        movies.push(movie);
        
        const result = await this.saveMovies(movies);
        
        if (result.success) {
            console.log('✅ Movie added successfully!');
        }
        
        return result;
    }
    
    // ============ DELETE MOVIE ============
    async deleteMovie(movieId) {
        console.log('🗑️ Deleting movie ID:', movieId);
        
        let movies = await this.getMovies();
        const originalLength = movies.length;
        
        movies = movies.filter(m => m.id !== movieId);
        
        if (movies.length === originalLength) {
            console.log('⚠️ Movie not found!');
            return { success: false, error: 'Movie not found' };
        }
        
        const result = await this.saveMovies(movies);
        
        if (result.success) {
            console.log('✅ Movie deleted successfully!');
        }
        
        return result;
    }
    
    // ============ UPDATE MOVIE ============
    async updateMovie(movieId, updates) {
        console.log('🔄 Updating movie ID:', movieId);
        
        let movies = await this.getMovies();
        const index = movies.findIndex(m => m.id === movieId);
        
        if (index === -1) {
            console.log('⚠️ Movie not found!');
            return { success: false, error: 'Movie not found' };
        }
        
        movies[index] = { ...movies[index], ...updates };
        
        const result = await this.saveMovies(movies);
        
        if (result.success) {
            console.log('✅ Movie updated successfully!');
        }
        
        return result;
    }
    
    // ============ INCREMENT DOWNLOADS ============
    async incrementDownloads(movieId) {
        console.log('⬇️ Incrementing downloads for movie ID:', movieId);
        
        let movies = await this.getMovies();
        const movie = movies.find(m => m.id === movieId);
        
        if (movie) {
            movie.downloads = (movie.downloads || 0) + 1;
            await this.saveMovies(movies);
            return movie.downloads;
        }
        
        return 0;
    }
    
    // ============ GET VISITOR COUNT ============
    async getVisitorCount() {
        try {
            const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.API_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            
            const data = await response.json();
            return data.record.visitors || { totalCount: 0, todayCount: 0 };
            
        } catch (error) {
            console.error('❌ Failed to get visitor count:', error);
            return { totalCount: 0, todayCount: 0 };
        }
    }
    
    // ============ INCREMENT VISITOR ============
    async incrementVisitor() {
        console.log('👤 New visitor!');
        
        try {
            // Current data get කරන්න
            const response = await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}/latest`, {
                headers: {
                    'X-Master-Key': CONFIG.API_KEY,
                    'X-Bin-Meta': 'false'
                }
            });
            
            const fullData = await response.json();
            const record = fullData.record;
            
            // Visitors update කරන්න
            if (!record.visitors) {
                record.visitors = { totalCount: 0, todayCount: 0, lastReset: new Date().toISOString() };
            }
            
            const today = new Date().toDateString();
            const lastReset = record.visitors.lastReset ? new Date(record.visitors.lastReset).toDateString() : '';
            
            // Today reset කරන්න
            if (today !== lastReset) {
                record.visitors.todayCount = 1;
                record.visitors.lastReset = new Date().toISOString();
            } else {
                record.visitors.todayCount++;
            }
            
            record.visitors.totalCount++;
            record.lastUpdated = new Date().toISOString();
            
            // Save කරන්න
            await fetch(`${CONFIG.BASE_URL}/${CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': CONFIG.API_KEY
                },
                body: JSON.stringify(record)
            });
            
            // Local backup
            localStorage.setItem('visitorCount', record.visitors.totalCount.toString());
            
            return record.visitors.totalCount;
            
        } catch (error) {
            console.error('❌ Failed to increment visitor:', error);
            
            // Local fallback
            let count = parseInt(localStorage.getItem('visitorCount') || '0');
            count++;
            localStorage.setItem('visitorCount', count.toString());
            return count;
        }
    }
    
    // ============ CLEAR CACHE ============
    clearCache() {
        this.cache = null;
        this.lastFetch = null;
        console.log('🧹 Cache cleared!');
    }
}

// ============================================
// CREATE GLOBAL DATABASE INSTANCE
// ============================================
const db = new MovieDatabase();

console.log('🗄️ MovieDatabase initialized!');
console.log('📡 API KEY:', CONFIG.API_KEY ? 'Set ✓' : '❌ Not Set');
console.log('📦 BIN ID:', CONFIG.BIN_ID ? 'Set ✓' : '❌ Not Set');