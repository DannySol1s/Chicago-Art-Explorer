document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gallery = document.getElementById('gallery');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('no-results');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const departmentSelect = document.getElementById('departmentSelect');
    const randomBtn = document.getElementById('randomBtn');
    const favoritesBtn = document.getElementById('favoritesBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    
    // Modal Elements
    const modal = document.getElementById('artworkModal');
    const closeBtn = document.querySelector('.close-btn');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalArtist = document.getElementById('modalArtist');
    const modalDate = document.getElementById('modalDate');
    const modalMedium = document.getElementById('modalMedium');
    const modalDept = document.getElementById('modalDept');
    const modalDesc = document.getElementById('modalDesc');
    const modalLoader = document.getElementById('modalLoader');
    const modalFavBtn = document.getElementById('modalFavBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');

    // State
    let currentPage = 1;
    let currentQuery = '';
    let currentDept = '';
    let showingFavorites = false;
    let favorites = JSON.parse(localStorage.getItem('art_favorites') || '[]');
    const limit = 12;

    // Initialize
    fetchDepartments();
    fetchArtworks();

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    randomBtn.addEventListener('click', fetchRandomArtwork);
    
    favoritesBtn.addEventListener('click', toggleFavoritesView);

    departmentSelect.addEventListener('change', (e) => {
        currentDept = e.target.value;
        currentPage = 1;
        showingFavorites = false;
        favoritesBtn.classList.remove('active');
        fetchArtworks();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentQuery = btn.dataset.query;
            searchInput.value = currentQuery;
            currentPage = 1;
            showingFavorites = false;
            favoritesBtn.classList.remove('active');
            fetchArtworks();
        });
    });

    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchArtworks();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    nextBtn.addEventListener('click', () => {
        currentPage++;
        fetchArtworks();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Modal Listeners
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    modalFavBtn.addEventListener('click', () => {
        const artwork = modalFavBtn.dataset.artwork ? JSON.parse(modalFavBtn.dataset.artwork) : null;
        if (artwork) {
            toggleFavorite(artwork);
            updateModalFavIcon(artwork.id);
        }
    });

    shareBtn.addEventListener('click', () => {
        const title = modalTitle.textContent;
        const text = `Check out this masterpiece: ${title}`;
        if (navigator.share) {
            navigator.share({ title, text, url: window.location.href });
        } else {
            navigator.clipboard.writeText(`${text} - ${window.location.href}`);
            alert('Link copied to clipboard!');
        }
    });

    // Functions
    async function fetchDepartments() {
        try {
            const response = await fetch('/api/departments');
            if (response.ok) {
                const depts = await response.json();
                depts.forEach(dept => {
                    const option = document.createElement('option');
                    option.value = dept.name;
                    option.textContent = dept.name;
                    departmentSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    }

    function handleSearch() {
        const query = searchInput.value.trim();
        currentQuery = query;
        currentPage = 1;
        showingFavorites = false;
        favoritesBtn.classList.remove('active');
        fetchArtworks();
    }

    async function fetchArtworks() {
        if (showingFavorites) {
            displayArtworks(favorites);
            updatePagination({ total_pages: 1, current_page: 1 });
            return;
        }

        showLoading();
        try {
            let url = `/api/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=${limit}`;
            if (currentDept) url += `&department=${encodeURIComponent(currentDept)}`;
            if (!currentQuery && !currentDept) url = `/api/artworks?page=${currentPage}&limit=${limit}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch data');
            const data = await response.json();
            
            displayArtworks(data.data);
            updatePagination(data.pagination);
        } catch (error) {
            console.error('Error fetching artworks:', error);
            showNoResults();
        }
    }

    async function fetchRandomArtwork() {
        showLoading();
        try {
            const response = await fetch('/api/random');
            if (response.ok) {
                const artwork = await response.json();
                openModal(artwork);
                hideLoading();
            }
        } catch (error) {
            console.error('Error fetching random artwork:', error);
            fetchArtworks(); // Fallback to list
        }
    }

    function toggleFavoritesView() {
        showingFavorites = !showingFavorites;
        favoritesBtn.classList.toggle('active', showingFavorites);
        currentPage = 1;
        fetchArtworks();
    }

    function toggleFavorite(artwork) {
        const index = favorites.findIndex(f => f.id === artwork.id);
        if (index > -1) {
            favorites.splice(index, 1);
        } else {
            favorites.push(artwork);
        }
        localStorage.setItem('art_favorites', JSON.stringify(favorites));
        
        // If we are in favorites view, refresh the gallery
        if (showingFavorites) fetchArtworks();
        
        // Update any existing cards in the gallery
        const cardBtn = document.querySelector(`.fav-card-btn[data-id="${artwork.id}"]`);
        if (cardBtn) cardBtn.classList.toggle('active', index === -1);
    }

    function isFavorite(id) {
        return favorites.some(f => f.id === id);
    }

    function displayArtworks(artworks) {
        gallery.innerHTML = '';
        if (!artworks || artworks.length === 0) {
            showNoResults();
            return;
        }

        artworks.forEach((artwork, index) => {
            const imageUrl = artwork.images?.web?.url || '';
            if (!imageUrl) return;

            const card = document.createElement('div');
            card.className = 'artwork-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const title = artwork.title || 'Untitled';
            const artist = artwork.creators?.[0]?.description || 'Unknown Artist';
            const date = artwork.creation_date || 'Unknown Date';
            const favClass = isFavorite(artwork.id) ? 'active' : '';

            card.innerHTML = `
                <div class="image-wrapper">
                    <button class="fav-card-btn ${favClass}" data-id="${artwork.id}" title="Toggle Favorite">
                        <i class="fas fa-heart"></i>
                    </button>
                    <img class="card-image" src="${imageUrl}" alt="${title}" loading="lazy" style="opacity: 0; transition: opacity 0.8s ease;">
                </div>
                <div class="card-content">
                    <h3 class="artwork-title" title="${title}">${title}</h3>
                    <p class="artwork-artist">${artist}</p>
                    <div class="card-footer">
                        <span class="artwork-date">${date}</span>
                    </div>
                </div>
            `;
            
            const img = card.querySelector('.card-image');
            img.onload = () => img.style.opacity = '1';
            img.onerror = () => {
                img.src = `/api/image/proxy?url=${encodeURIComponent(imageUrl)}`;
            };

            card.querySelector('.fav-card-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                toggleFavorite(artwork);
            });

            card.addEventListener('click', () => openModal(artwork));
            gallery.appendChild(card);
        });
        hideLoading();
    }

    function updatePagination(paginationInfo) {
        if (paginationInfo) {
            const totalPages = paginationInfo.total_pages || 1;
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
            
            // Hide pagination if in favorites view or total pages is 1
            const paginationEl = document.querySelector('.pagination');
            paginationEl.style.display = (showingFavorites || totalPages <= 1) ? 'none' : 'flex';
        }
    }

    function openModal(artwork) {
        const imageUrl = artwork.images?.web?.url || '';
        modalLoader.style.display = 'block';
        modalImage.style.display = 'none';
        
        modalImage.src = imageUrl;
        modalTitle.textContent = artwork.title || 'Untitled';
        modalArtist.textContent = artwork.creators?.[0]?.description || 'Unknown Artist';
        modalDate.textContent = artwork.creation_date || 'Unknown Date';
        modalMedium.textContent = artwork.technique || artwork.type || 'Unknown Medium';
        modalDept.textContent = artwork.department || 'Not Specified';
        modalDesc.textContent = artwork.wall_description || artwork.description || 'No detailed description available for this piece.';
        
        downloadBtn.href = artwork.images?.print?.url || artwork.images?.web?.url || '#';
        modalFavBtn.dataset.artwork = JSON.stringify(artwork);
        updateModalFavIcon(artwork.id);

        modalImage.onload = () => {
            modalLoader.style.display = 'none';
            modalImage.style.display = 'block';
        };

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    function updateModalFavIcon(id) {
        const icon = modalFavBtn.querySelector('i');
        if (isFavorite(id)) {
            icon.className = 'fas fa-heart';
            modalFavBtn.style.color = '#fb7185';
        } else {
            icon.className = 'far fa-heart';
            modalFavBtn.style.color = '#fb7185';
        }
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }

    function showLoading() {
        loading.classList.remove('hidden');
        gallery.classList.add('hidden');
        noResults.classList.add('hidden');
    }

    function hideLoading() {
        loading.classList.add('hidden');
        gallery.classList.remove('hidden');
    }

    function showNoResults() {
        loading.classList.add('hidden');
        gallery.classList.add('hidden');
        noResults.classList.remove('hidden');
    }
});
