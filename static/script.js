document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const gallery = document.getElementById('gallery');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('no-results');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');
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
    const modalLoader = document.getElementById('modalLoader');

    // State
    let currentPage = 1;
    let currentQuery = '';
    const limit = 12;

    // Initialize
    fetchArtworks();

    // Event Listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Set query and fetch
            currentQuery = btn.dataset.query;
            searchInput.value = currentQuery;
            currentPage = 1;
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
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('show')) {
            closeModal();
        }
    });

    // Functions
    function handleSearch() {
        const query = searchInput.value.trim();
        if (query !== currentQuery || currentPage !== 1) {
            currentQuery = query;
            currentPage = 1;
            
            // Update filter buttons if search matches a predefined filter
            filterBtns.forEach(b => {
                if (b.dataset.query.toLowerCase() === currentQuery.toLowerCase()) {
                    b.classList.add('active');
                } else {
                    b.classList.remove('active');
                }
            });
            
            fetchArtworks();
        }
    }

    async function fetchArtworks() {
        showLoading();
        
        try {
            let url = `/api/artworks?page=${currentPage}&limit=${limit}`;
            if (currentQuery) {
                url = `/api/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=${limit}`;
            }

            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();
            
            displayArtworks(data.data);
            updatePagination(data.pagination);
            
        } catch (error) {
            console.error('Error fetching artworks:', error);
            showNoResults();
        }
    }

    function displayArtworks(artworks) {
        gallery.innerHTML = '';
        
        if (!artworks || artworks.length === 0) {
            showNoResults();
            return;
        }

        artworks.forEach((artwork, index) => {
            // Skip artworks without images for better UX
            const imageUrl = artwork.images?.web?.url || '';
            if (!imageUrl) return;

            const card = document.createElement('div');
            card.className = 'artwork-card';
            card.style.animationDelay = `${index * 0.05}s`;
            
            const title = artwork.title || 'Untitled';
            const artist = artwork.creators?.[0]?.description || 'Unknown Artist';
            const date = artwork.creation_date || 'Unknown Date';
            
            const bgStyle = ''; 
            card.innerHTML = `
                <div class="image-wrapper" style="${bgStyle}">
                    <div class="image-placeholder">
                         <i class="fas fa-palette"></i>
                    </div>
                    <img class="card-image" src="${imageUrl}" alt="${title}" loading="lazy" style="opacity: 0; transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1); width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-content">
                    <h3 class="artwork-title" title="${title}">${title}</h3>
                    <p class="artwork-artist">${artist}</p>
                    <div class="card-footer">
                        <span class="artwork-date">${date}</span>
                        <span class="view-details">Explore <i class="fas fa-arrow-right"></i></span>
                    </div>
                </div>
            `;
            
            // Image load handler
            const img = card.querySelector('.card-image');
            
            if (img.complete) {
                handleImageLoad(img, card);
            } else {
                img.onload = () => handleImageLoad(img, card);
                img.onerror = () => {
                    // Try proxy if direct fails
                    if (!img.dataset.triedProxy && imageUrl) {
                        img.dataset.triedProxy = 'true';
                        img.src = `/api/image/proxy?url=${encodeURIComponent(imageUrl)}`;
                    } else {
                        img.src = 'https://via.placeholder.com/400x300?text=Image+Unavailable';
                        img.style.opacity = '1';
                    }
                };
            }

            // Click handler for modal
            card.addEventListener('click', () => openModal(artwork));
            
            gallery.appendChild(card);
        });

        hideLoading();
    }

    function handleImageLoad(img, card) {
        img.style.opacity = '1';
        const placeholder = card.querySelector('.image-placeholder');
        if(placeholder) {
            placeholder.style.opacity = '0';
            setTimeout(() => placeholder.remove(), 800);
        }
    }

    function updatePagination(paginationInfo) {
        if (paginationInfo) {
            const totalPages = paginationInfo.total_pages || 1;
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= totalPages;
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

        modalImage.onload = () => {
            modalLoader.style.display = 'none';
            modalImage.style.display = 'block';
        };

        modalImage.onerror = () => {
            if (!modalImage.dataset.triedProxy && imageUrl) {
                modalImage.dataset.triedProxy = 'true';
                modalImage.src = `/api/image/proxy?url=${encodeURIComponent(imageUrl)}`;
            } else {
                modalLoader.style.display = 'none';
                modalImage.style.display = 'block';
                modalImage.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
            }
        };
        
        modal.classList.add('show');
        delete modalImage.dataset.triedProxy;
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            modalImage.src = ''; // Clear image to prevent flash on next open
        }, 300);
    }

    // Helper to get image URL (Simplified for Cleveland)
    function getImageUrl(artwork) {
        return artwork.images?.web?.url || '';
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
