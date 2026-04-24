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
            if (!artwork.image_id) return;

            const card = document.createElement('div');
            card.className = 'artwork-card';
            card.style.animationDelay = `${index * 0.1}s`;
            
            const imageUrl = getImageUrl(artwork.image_id, 300); // Requested smaller size for optimization
            const title = artwork.title || 'Untitled';
            const artist = artwork.artist_title || 'Unknown Artist';
            const date = artwork.date_display || 'Unknown Date';
            
            // Use Low Quality Image Placeholder if available from API
            const lqip = artwork.thumbnail?.lqip || '';
            const bgStyle = lqip ? `background-image: url('${lqip}'); background-size: cover; background-position: center;` : '';
            
            card.innerHTML = `
                <div class="image-wrapper" style="${bgStyle}">
                    <div class="image-placeholder" style="${lqip ? 'opacity: 0;' : ''}"></div>
                    <img class="card-image" src="${imageUrl}" alt="${title}" loading="lazy" style="opacity: 0; transition: opacity 0.5s ease; width: 100%; height: 100%; object-fit: cover;">
                </div>
                <div class="card-content">
                    <h3 class="artwork-title" title="${title}">${title}</h3>
                    <p class="artwork-artist">${artist}</p>
                    <div class="card-footer">
                        <span>${date}</span>
                    </div>
                </div>
            `;
            
            // Image load handler
            const img = card.querySelector('.card-image');
            img.onload = () => {
                img.style.opacity = '1';
                const placeholder = card.querySelector('.image-placeholder');
                if(placeholder) placeholder.style.opacity = '0';
            };

            // Click handler for modal
            card.addEventListener('click', () => openModal(artwork));
            
            gallery.appendChild(card);
        });

        hideLoading();
    }

    function updatePagination(paginationInfo) {
        if (paginationInfo) {
            pageInfo.textContent = `Page ${currentPage} of ${paginationInfo.total_pages || '?'}`;
            prevBtn.disabled = currentPage <= 1;
            
            // If we have total_pages from API, use it. Otherwise guess based on if we got full results
            if (paginationInfo.total_pages) {
                nextBtn.disabled = currentPage >= paginationInfo.total_pages;
            } else {
                nextBtn.disabled = false;
            }
        }
    }

    function openModal(artwork) {
        const imageUrl = getImageUrl(artwork.image_id, 843);
        
        modalImage.src = imageUrl;
        modalTitle.textContent = artwork.title || 'Untitled';
        modalArtist.textContent = artwork.artist_title || 'Unknown Artist';
        modalDate.textContent = artwork.date_display || 'Unknown Date';
        modalMedium.textContent = artwork.medium_display || 'Unknown Medium';
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    }

    function closeModal() {
        modal.classList.remove('show');
        document.body.style.overflow = '';
        setTimeout(() => {
            modalImage.src = ''; // Clear image to prevent flash on next open
        }, 300);
    }

    function getImageUrl(imageId, size = 843) {
        return `https://www.artic.edu/iiif/2/${imageId}/full/${size},/0/default.jpg`;
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
