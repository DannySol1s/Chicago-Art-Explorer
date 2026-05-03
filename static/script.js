document.addEventListener('DOMContentLoaded', () => {
    // Elementos DOM
    const gallery = document.getElementById('gallery');
    const loading = document.getElementById('loading');
    const noResults = document.getElementById('noResults');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');

    const modal = document.getElementById('artModal');
    const modalImage = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const modalArtist = document.getElementById('modalArtist');
    const modalDesc = document.getElementById('modalDesc');
    const modalDate = document.getElementById('modalDate');
    const modalMedium = document.getElementById('modalMedium');
    const closeBtn = document.querySelector('.close-btn');

    // Estado
    let currentPage = 1;
    let currentQuery = '';
    let currentArtwork = null;
    const limit = 12;

    // Carga inicial
    fetchArtworks();

    // Eventos
    searchBtn.addEventListener('click', () => {
        currentQuery = searchInput.value.trim();
        currentPage = 1;
        fetchArtworks();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentQuery = searchInput.value.trim();
            currentPage = 1;
            fetchArtworks();
        }
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

    closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('show');
    });

    // Funciones
    async function fetchArtworks() {
        showLoading();
        try {
            const url = currentQuery
                ? `/api/search?q=${encodeURIComponent(currentQuery)}&page=${currentPage}&limit=${limit}`
                : `/api/artworks?page=${currentPage}&limit=${limit}`;

            const response = await fetch(url);
            const data = await response.json();

            displayArtworks(data.data);
            updatePagination(data.pagination);
        } catch (error) {
            console.error('Error:', error);
            showNoResults();
        }
    }

    function displayArtworks(artworks) {
        gallery.innerHTML = '';
        if (!artworks || artworks.length === 0) {
            showNoResults();
            return;
        }

        artworks.forEach(artwork => {
            const imageUrl = artwork.images?.web?.url;
            if (!imageUrl) return;

            const card = document.createElement('div');
            card.className = 'artwork-card';
            card.innerHTML = `
                <img class="card-image" src="${imageUrl}" alt="${artwork.title}" loading="lazy">
                <div class="card-content">
                    <h3 class="artwork-title">${artwork.title || 'Sin título'}</h3>
                    <p class="artwork-artist">${artwork.creators?.[0]?.description || 'Artista desconocido'}</p>
                </div>
            `;

            const img = card.querySelector('img');
            img.onerror = () => {
                img.src = `/api/image/proxy?url=${encodeURIComponent(imageUrl)}`;
            };

            card.addEventListener('click', () => openModal(artwork));
            gallery.appendChild(card);
        });
        hideLoading();
    }

    function formatDescription(text) {
        if (!text) return '<p>Sin descripción disponible.</p>';
        
        // Limpiar espacios y normalizar
        text = text.trim();
        
        // 1. Dividir por saltos de línea existentes si los hay
        let blocks = text.split(/\r?\n/).filter(b => b.trim().length > 0);
        
        let finalParagraphs = [];
        
        blocks.forEach(block => {
            // 2. Para cada bloque, si es muy largo, dividir por frases
            const sentences = block.match(/[^\.!\?]+[\.!\?]+(?:\s|$)/g) || [block];
            
            if (sentences.length <= 4) {
                finalParagraphs.push(block);
            } else {
                // Dividir en grupos de 3 frases
                for (let i = 0; i < sentences.length; i += 3) {
                    const chunk = sentences.slice(i, i + 3).join(' ');
                    if (chunk.trim()) {
                        finalParagraphs.push(chunk.trim());
                    }
                }
            }
        });
        
        // 3. Envolver todo en etiquetas <p>
        return finalParagraphs.map(p => `<p>${p}</p>`).join('');
    }

    function openModal(artwork) {
        currentArtwork = artwork;
        
        modalImage.src = artwork.images?.web?.url || '';
        modalTitle.textContent = artwork.title || 'Sin título';
        modalArtist.textContent = artwork.creators?.[0]?.description || 'Artista desconocido';
        modalDesc.innerHTML = formatDescription(artwork.wall_description || artwork.description);
        modalDate.textContent = `Fecha: ${artwork.creation_date || 'Desconocida'}`;
        modalMedium.textContent = `Técnica: ${artwork.technique || 'Desconocida'}`;

        modal.classList.add('show');
    }

    function updatePagination(pagination) {
        if (pagination) {
            pageInfo.textContent = `Página ${currentPage} de ${pagination.total_pages || 1}`;
            prevBtn.disabled = currentPage <= 1;
            nextBtn.disabled = currentPage >= (pagination.total_pages || 1);
        }
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
